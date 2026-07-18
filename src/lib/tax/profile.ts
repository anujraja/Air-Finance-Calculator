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

  // Income
  employmentIncome: nonNegative("Employment income"),
  selfEmploymentIncome: nonNegative("Self-employment income"),
  otherIncome: nonNegative("Other income"),
  businessIncome: nonNegative("Business income"),

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

export interface ProfileAnalysis {
  incomeTax: IncomeTaxResult;
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

  const corporate =
    profile.businessIncome > 0
      ? calculateCorporateTax({ activeBusinessIncome: profile.businessIncome })
      : null;

  const affordability = calculateAffordability({
    grossAnnualIncome: incomeTax.grossIncome,
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
    corporate,
    affordability,
    savings,
    mortgage,
    targetDownPaymentGap: Math.max(profile.downPaymentTarget - profile.currentSavings, 0),
  };
}

/** Sensible Ontario defaults for a first-time visitor (clearly stated, not advice). */
export const DEFAULT_PROFILE: FinancialProfile = {
  employmentType: "employee",
  employmentIncome: 85_000,
  selfEmploymentIncome: 0,
  otherIncome: 0,
  businessIncome: 0,
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
  employmentIncome: 150_000,
  selfEmploymentIncome: 45_000,
  otherIncome: 8_000,
  businessIncome: 90_000,
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
