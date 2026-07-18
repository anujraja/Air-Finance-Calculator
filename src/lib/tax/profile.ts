/**
 * The unified financial profile collected by the onboarding wizard, plus the
 * orchestrator that runs every engine and returns one combined analysis.
 *
 * A single Zod schema validates the whole profile; `analyzeProfile` is pure and
 * fully testable. Ontario 2026 is the only jurisdiction modelled.
 */

import { z } from "zod";
import { calculateIncomeTax, type IncomeTaxResult } from "./incomeTax";
import { calculateCorporateTax, type CorporateTaxResult } from "./corporate";
import { calculateAffordability, type AffordabilityResult } from "./affordability";
import { calculateSavings, type SavingsResult } from "./savings";
import { calculate as calculateMortgage } from "@/lib/engine/mortgage";
import type { CalculationResult as MortgageResult } from "@/lib/engine/types";

export const EMPLOYMENT_TYPES = ["employee", "self_employed", "business_owner", "mixed"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

const nonNegative = (label: string, max = 100_000_000) =>
  z.coerce
    .number({ error: `${label} must be a number.` })
    .refine((v) => Number.isFinite(v), `${label} must be a valid number.`)
    .min(0, `${label} cannot be negative.`)
    .max(max, `${label} is unrealistically large.`);

export const profileSchema = z.object({
  employmentType: z.enum(EMPLOYMENT_TYPES),

  // Who the assessment covers. "single" is the default so old stored profiles
  // (which predate partner fields) parse unchanged and behave exactly as before.
  householdMode: z.enum(["single", "couple"]).default("single"),

  // Income
  employmentIncome: nonNegative("Employment income"),
  selfEmploymentIncome: nonNegative("Self-employment income"),
  otherIncome: nonNegative("Other income"),
  businessIncome: nonNegative("Business income"),

  // Partner 2 income (couple mode only; taxed as a separate individual).
  // No partner employmentType and no partner corporate income — kept simple.
  // Every field defaults to 0 so old v1 localStorage profiles still parse.
  partnerEmploymentIncome: nonNegative("Partner employment income").default(0),
  partnerSelfEmploymentIncome: nonNegative("Partner self-employment income").default(0),
  partnerOtherIncome: nonNegative("Partner other income").default(0),
  partnerRrspDeduction: nonNegative("Partner RRSP contribution").default(0),

  // Deductions & savings
  rrspDeduction: nonNegative("RRSP contribution"),
  currentSavings: nonNegative("Current savings"),
  monthlySavings: nonNegative("Monthly savings", 1_000_000),
  monthlyDebtPayments: nonNegative("Monthly debt payments", 1_000_000),

  // Home goal
  homePrice: z.coerce
    .number({ error: "Home price must be a number." })
    .min(1, "Home price must be greater than 0.")
    .max(100_000_000, "Home price is unrealistically large."),
  downPaymentTarget: nonNegative("Down-payment target"),
  mortgageRate: z.coerce
    .number({ error: "Mortgage rate must be a number." })
    .min(0, "Mortgage rate cannot be negative.")
    .max(25, "Mortgage rate is unrealistically high."),
  amortizationYears: z.coerce
    .number({ error: "Amortization must be a number." })
    .int("Amortization must be a whole number of years.")
    .min(1, "Amortization must be at least 1 year.")
    .max(40, "Amortization cannot exceed 40 years."),
  annualPropertyTax: nonNegative("Property tax"),
  annualHomeInsurance: nonNegative("Home insurance"),
  monthlyUtilities: nonNegative("Utilities", 1_000_000),
  monthlyCondoFees: nonNegative("Condo/maintenance fees", 1_000_000),
});

export type FinancialProfile = z.infer<typeof profileSchema>;

/**
 * Household-level income totals. In single mode these mirror the sole person's
 * income-tax result exactly (so every existing number is unchanged); in couple
 * mode they combine both partners, who are taxed separately as individuals.
 */
export interface HouseholdTotals {
  grossIncome: number;
  totalIncomeTax: number;
  totalDeductions: number; // income tax + CPP + EI, both partners
  afterTaxIncome: number;
  monthlyAfterTax: number;
  averageTaxRate: number;
  averageDeductionRate: number;
}

export interface ProfileAnalysis {
  incomeTax: IncomeTaxResult;
  /** Partner 2's income tax; null in single mode. */
  partnerIncomeTax: IncomeTaxResult | null;
  /** Household totals; mirror `incomeTax` in single mode. */
  household: HouseholdTotals;
  corporate: CorporateTaxResult | null;
  affordability: AffordabilityResult;
  savings: SavingsResult;
  mortgage: MortgageResult;
  /** Down payment implied by the target home + saved amount. */
  targetDownPaymentGap: number;
}

/** Run every engine over a validated profile. */
export function analyzeProfile(profile: FinancialProfile): ProfileAnalysis {
  const incomeTax = calculateIncomeTax({
    employmentIncome: profile.employmentIncome,
    selfEmploymentIncome: profile.selfEmploymentIncome,
    otherIncome: profile.otherIncome,
    rrspDeduction: profile.rrspDeduction,
    otherDeductions: 0,
  });

  // Canada taxes individuals, not households: partner 2 is a separate return.
  const partnerIncomeTax =
    profile.householdMode === "couple"
      ? calculateIncomeTax({
          employmentIncome: profile.partnerEmploymentIncome,
          selfEmploymentIncome: profile.partnerSelfEmploymentIncome,
          otherIncome: profile.partnerOtherIncome,
          rrspDeduction: profile.partnerRrspDeduction,
          otherDeductions: 0,
        })
      : null;

  const p = partnerIncomeTax;
  const hGross = incomeTax.grossIncome + (p?.grossIncome ?? 0);
  const hTax = incomeTax.totalIncomeTax + (p?.totalIncomeTax ?? 0);
  const hDeductions = incomeTax.totalDeductions + (p?.totalDeductions ?? 0);
  const hAfterTax = incomeTax.afterTaxIncome + (p?.afterTaxIncome ?? 0);
  const household: HouseholdTotals = {
    grossIncome: round2(hGross),
    totalIncomeTax: round2(hTax),
    totalDeductions: round2(hDeductions),
    afterTaxIncome: round2(hAfterTax),
    monthlyAfterTax: round2(hAfterTax / 12),
    averageTaxRate: hGross > 0 ? hTax / hGross : 0,
    averageDeductionRate: hGross > 0 ? hDeductions / hGross : 0,
  };

  const corporate =
    profile.businessIncome > 0
      ? calculateCorporateTax({ activeBusinessIncome: profile.businessIncome })
      : null;

  const affordability = calculateAffordability({
    // Affordability (GDS/TDS) uses combined gross income. In single mode this
    // equals incomeTax.grossIncome, so the affordability output is unchanged.
    grossAnnualIncome: household.grossIncome,
    monthlyDebtPayments: profile.monthlyDebtPayments,
    downPayment: profile.downPaymentTarget,
    contractRate: profile.mortgageRate,
    amortizationYears: profile.amortizationYears,
    monthlyCondoFees: profile.monthlyCondoFees,
  });

  const savings = calculateSavings({
    targetAmount: profile.downPaymentTarget,
    currentSavings: profile.currentSavings,
    monthlyContribution: profile.monthlySavings,
    annualReturnPercent: 3,
  });

  const mortgage = calculateMortgage({
    homePrice: profile.homePrice,
    downPaymentAmount: Math.min(profile.downPaymentTarget, profile.homePrice),
    annualInterestRatePercent: profile.mortgageRate,
    amortizationYears: profile.amortizationYears,
    annualPropertyTax: profile.annualPropertyTax,
    annualHomeInsurance: profile.annualHomeInsurance,
    monthlyUtilities: profile.monthlyUtilities,
    monthlyCondoFees: profile.monthlyCondoFees,
  });

  return {
    incomeTax,
    partnerIncomeTax,
    household,
    corporate,
    affordability,
    savings,
    mortgage,
    targetDownPaymentGap: Math.max(profile.downPaymentTarget - profile.currentSavings, 0),
  };
}

function round2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/** Sensible Ontario defaults for a first-time visitor (clearly stated, not advice). */
export const DEFAULT_PROFILE: FinancialProfile = {
  employmentType: "employee",
  householdMode: "single",
  employmentIncome: 85_000,
  selfEmploymentIncome: 0,
  otherIncome: 0,
  businessIncome: 0,
  partnerEmploymentIncome: 0,
  partnerSelfEmploymentIncome: 0,
  partnerOtherIncome: 0,
  partnerRrspDeduction: 0,
  rrspDeduction: 5_000,
  currentSavings: 25_000,
  monthlySavings: 1_200,
  monthlyDebtPayments: 400,
  homePrice: 650_000,
  downPaymentTarget: 130_000,
  mortgageRate: 4.75,
  amortizationYears: 25,
  annualPropertyTax: 4_200,
  annualHomeInsurance: 1_500,
  monthlyUtilities: 250,
  monthlyCondoFees: 0,
};

/** A richer "demo" profile that shows every part of the analysis lighting up:
 * a high earner ($200k+ personal income) qualifying for a $900k home. */
export const DEMO_PROFILE: FinancialProfile = {
  employmentType: "mixed",
  householdMode: "single",
  employmentIncome: 150_000,
  selfEmploymentIncome: 45_000,
  otherIncome: 8_000,
  businessIncome: 90_000,
  partnerEmploymentIncome: 0,
  partnerSelfEmploymentIncome: 0,
  partnerOtherIncome: 0,
  partnerRrspDeduction: 0,
  rrspDeduction: 20_000,
  currentSavings: 90_000,
  monthlySavings: 2_500,
  monthlyDebtPayments: 750,
  homePrice: 900_000,
  downPaymentTarget: 180_000,
  mortgageRate: 4.75,
  amortizationYears: 25,
  annualPropertyTax: 6_300,
  annualHomeInsurance: 2_100,
  monthlyUtilities: 350,
  monthlyCondoFees: 0,
};

/**
 * A "couple" demo: two salaried partners buying a million-dollar home together.
 * Each income is taxed separately (Canada taxes individuals), then take-home is
 * summed; the combined gross income drives affordability. No corporate income —
 * the couple story stays about two salaries.
 */
export const COUPLE_DEMO: FinancialProfile = {
  employmentType: "employee",
  householdMode: "couple",
  // Partner 1
  employmentIncome: 165_000,
  selfEmploymentIncome: 0,
  otherIncome: 0,
  businessIncome: 0,
  rrspDeduction: 15_000,
  // Partner 2
  partnerEmploymentIncome: 135_000,
  partnerSelfEmploymentIncome: 0,
  partnerOtherIncome: 0,
  partnerRrspDeduction: 12_000,
  // Household-level
  currentSavings: 120_000,
  monthlySavings: 3_500,
  monthlyDebtPayments: 600,
  homePrice: 1_200_000,
  downPaymentTarget: 260_000,
  mortgageRate: 4.75,
  amortizationYears: 25,
  annualPropertyTax: 8_400,
  annualHomeInsurance: 2_400,
  monthlyUtilities: 400,
  monthlyCondoFees: 0,
};

/** Alias for {@link COUPLE_DEMO}, kept for callers preferring the fuller name. */
export const COUPLE_DEMO_PROFILE = COUPLE_DEMO;
