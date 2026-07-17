/**
 * Ontario + federal personal income-tax engine for 2026.
 *
 * Handles employment (T4), self-employment / contract, and other income, plus
 * RRSP and other deductions. Computes CPP (base + CPP2), EI, federal and
 * Ontario tax with the basic-personal-amount and CPP/EI credits, the Ontario
 * surtax, and the Ontario Health Premium.
 *
 * Modelling choices (documented, transparent — this is not tax advice):
 * - Employee CPP: the base portion (4.95%) is a non-refundable credit; the
 *   enhanced portion (1.00% + the 4% CPP2) is deducted from income.
 * - Self-employed CPP: half the contribution (the employer-equivalent) plus the
 *   employee enhancement is deducted; the employee base portion is a credit.
 * - EI applies to employment income only (self-employed opt-in is not modelled).
 * - The federal BPA phases down between $181,440 and $258,482 of income.
 */

import {
  FEDERAL_BRACKETS_2026,
  ONTARIO_BRACKETS_2026,
  FEDERAL_2026,
  ONTARIO_2026,
  ONTARIO_HEALTH_PREMIUM,
  CPP_2026,
  EI_2026,
  type TaxBracket,
} from "./constants";

export interface IncomeTaxInput {
  /** Employment (T4) income before deductions. */
  employmentIncome: number;
  /** Net self-employment / contract income (after business expenses). */
  selfEmploymentIncome: number;
  /** Other taxable income (interest, etc.), taxed at full rates. */
  otherIncome: number;
  /** RRSP deduction. */
  rrspDeduction: number;
  /** Any other deductions from income. */
  otherDeductions: number;
}

export interface IncomeTaxResult {
  grossIncome: number;
  taxableIncome: number;
  federalTax: number;
  ontarioBasicTax: number;
  ontarioSurtax: number;
  ontarioHealthPremium: number;
  /** Ontario total = basic + surtax + health premium. */
  ontarioTax: number;
  cpp: number;
  ei: number;
  totalIncomeTax: number;
  /** Income tax + CPP + EI. */
  totalDeductions: number;
  afterTaxIncome: number;
  monthlyAfterTax: number;
  /** Income tax ÷ gross income. */
  averageTaxRate: number;
  /** (Income tax + CPP + EI) ÷ gross income. */
  averageDeductionRate: number;
  /** Marginal rate on the next dollar of income (captures surtax + OHP). */
  marginalTaxRate: number;
}

const clampNonNegative = (n: number) => (n > 0 ? n : 0);

/** Progressive tax over a bracket table. */
export function bracketTax(brackets: TaxBracket[], income: number): number {
  if (income <= 0) return 0;
  let tax = 0;
  let lower = 0;
  for (const { upTo, rate } of brackets) {
    if (income <= lower) break;
    const taxedInThisBand = Math.min(income, upTo) - lower;
    tax += taxedInThisBand * rate;
    lower = upTo;
  }
  return tax;
}

/** Federal basic personal amount, phased down for high incomes. */
export function federalBPA(income: number): number {
  const { bpaMax, bpaMin, bpaPhaseoutStart, bpaPhaseoutEnd } = FEDERAL_2026;
  if (income <= bpaPhaseoutStart) return bpaMax;
  if (income >= bpaPhaseoutEnd) return bpaMin;
  const fraction = (income - bpaPhaseoutStart) / (bpaPhaseoutEnd - bpaPhaseoutStart);
  return bpaMax - (bpaMax - bpaMin) * fraction;
}

/** Ontario Health Premium for a given taxable income. */
export function ontarioHealthPremium(taxableIncome: number): number {
  let premium = 0;
  for (const tier of ONTARIO_HEALTH_PREMIUM) {
    if (taxableIncome > tier.over) {
      premium = Math.min(tier.base + (taxableIncome - tier.over) * tier.rate, tier.cap);
    }
  }
  return premium;
}

interface CppResult {
  total: number;
  creditable: number;
  deductible: number;
}

/** CPP + CPP2 across employment and self-employment income. */
export function computeCpp(employmentIncome: number, selfEmploymentIncome: number): CppResult {
  const { basicExemption, ympe, yampe, cpp2Rate } = CPP_2026;
  const combined = clampNonNegative(employmentIncome) + clampNonNegative(selfEmploymentIncome);
  if (combined <= basicExemption) return { total: 0, creditable: 0, deductible: 0 };

  const baseEarnings = clampNonNegative(Math.min(combined, ympe) - basicExemption);
  const cpp2Earnings = clampNonNegative(Math.min(combined, yampe) - ympe);
  const seShare = combined > 0 ? clampNonNegative(selfEmploymentIncome) / combined : 0;
  const empShare = 1 - seShare;

  // Employee side (base 4.95% credit, enhancement 1% + CPP2 4% deducted).
  const empBase = baseEarnings * empShare;
  const empCpp2 = cpp2Earnings * empShare;
  const empContribution = empBase * CPP_2026.employeeRate + empCpp2 * cpp2Rate;
  const empDeductible = empBase * CPP_2026.employeeEnhancementRate + empCpp2 * cpp2Rate;
  const empCreditable = empContribution - empDeductible;

  // Self-employed side (half deductible + employee enhancement; base half creditable).
  const seBase = baseEarnings * seShare;
  const seCpp2 = cpp2Earnings * seShare;
  const seContribution = seBase * CPP_2026.selfEmployedRate + seCpp2 * CPP_2026.selfEmployedCpp2Rate;
  const seEnhancement = seBase * CPP_2026.employeeEnhancementRate + seCpp2 * cpp2Rate;
  const seDeductible = seContribution / 2 + seEnhancement;
  const seCreditable = seContribution - seDeductible;

  return {
    total: empContribution + seContribution,
    creditable: empCreditable + seCreditable,
    deductible: empDeductible + seDeductible,
  };
}

/** EI premium on employment income (Ontario employee rate). */
export function computeEi(employmentIncome: number): number {
  const insurable = Math.min(clampNonNegative(employmentIncome), EI_2026.mie);
  return Math.min(insurable * EI_2026.employeeRate, EI_2026.maxPremium);
}

/** Federal + Ontario tax for a given taxable income and CPP/EI credits. */
function taxAtTaxableIncome(
  taxableIncome: number,
  creditableCppEi: number,
): { federalTax: number; ontarioBasicTax: number; ontarioSurtax: number } {
  const income = clampNonNegative(taxableIncome);

  const fedBefore = bracketTax(FEDERAL_BRACKETS_2026, income);
  const fedCredits = (federalBPA(income) + creditableCppEi) * FEDERAL_2026.lowestRate;
  const federalTax = clampNonNegative(fedBefore - fedCredits);

  const onBefore = bracketTax(ONTARIO_BRACKETS_2026, income);
  const onCredits = (ONTARIO_2026.bpa + creditableCppEi) * ONTARIO_2026.lowestRate;
  const ontarioBasicTax = clampNonNegative(onBefore - onCredits);

  const ontarioSurtax =
    ONTARIO_2026.surtaxRate1 * clampNonNegative(ontarioBasicTax - ONTARIO_2026.surtaxThreshold1) +
    ONTARIO_2026.surtaxRate2 * clampNonNegative(ontarioBasicTax - ONTARIO_2026.surtaxThreshold2);

  return { federalTax, ontarioBasicTax, ontarioSurtax };
}

/** Run the full personal income-tax calculation. */
export function calculateIncomeTax(input: IncomeTaxInput): IncomeTaxResult {
  const employmentIncome = clampNonNegative(input.employmentIncome);
  const selfEmploymentIncome = clampNonNegative(input.selfEmploymentIncome);
  const otherIncome = clampNonNegative(input.otherIncome);
  const grossIncome = employmentIncome + selfEmploymentIncome + otherIncome;

  const cpp = computeCpp(employmentIncome, selfEmploymentIncome);
  const ei = computeEi(employmentIncome);

  const deductions =
    clampNonNegative(input.rrspDeduction) + clampNonNegative(input.otherDeductions) + cpp.deductible;
  const taxableIncome = clampNonNegative(grossIncome - deductions);

  const creditableCppEi = cpp.creditable + ei;
  const { federalTax, ontarioBasicTax, ontarioSurtax } = taxAtTaxableIncome(
    taxableIncome,
    creditableCppEi,
  );
  const ontarioHealth = ontarioHealthPremium(taxableIncome);
  const ontarioTax = ontarioBasicTax + ontarioSurtax + ontarioHealth;
  const totalIncomeTax = federalTax + ontarioTax;
  const totalDeductions = totalIncomeTax + cpp.total + ei;
  const afterTaxIncome = grossIncome - totalDeductions;

  // Marginal rate: tax on the next $100 of income (captures surtax + OHP steps).
  const bump = 100;
  const nextTaxable = taxableIncome + bump;
  const next = taxAtTaxableIncome(nextTaxable, creditableCppEi);
  const nextTotal =
    next.federalTax + next.ontarioBasicTax + next.ontarioSurtax + ontarioHealthPremium(nextTaxable);
  const marginalTaxRate = (nextTotal - totalIncomeTax) / bump;

  return {
    grossIncome,
    taxableIncome,
    federalTax: round2(federalTax),
    ontarioBasicTax: round2(ontarioBasicTax),
    ontarioSurtax: round2(ontarioSurtax),
    ontarioHealthPremium: round2(ontarioHealth),
    ontarioTax: round2(ontarioTax),
    cpp: round2(cpp.total),
    ei: round2(ei),
    totalIncomeTax: round2(totalIncomeTax),
    totalDeductions: round2(totalDeductions),
    afterTaxIncome: round2(afterTaxIncome),
    monthlyAfterTax: round2(afterTaxIncome / 12),
    averageTaxRate: grossIncome > 0 ? totalIncomeTax / grossIncome : 0,
    averageDeductionRate: grossIncome > 0 ? totalDeductions / grossIncome : 0,
    marginalTaxRate: Math.max(marginalTaxRate, 0),
  };
}

function round2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}
