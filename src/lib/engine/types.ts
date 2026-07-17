/**
 * Domain types for the HomeCost Canada calculation engine.
 *
 * The engine is intentionally free of any UI, React, or Next.js imports so it
 * can be unit-tested in isolation and reused on the server (API route) and the
 * client alike. All monetary values are plain numbers in Canadian dollars.
 */

/** How the user expressed their down payment. */
export type DownPaymentType = "dollar" | "percent";

/**
 * Normalized, already-validated input to the engine. Produced from raw form or
 * API input by {@link normalizeCalculatorInput}. Every field is a finite,
 * non-negative number unless noted; the interest rate is a *percentage*
 * (e.g. `5.25` means 5.25% per year), not a decimal fraction.
 */
export interface EngineInput {
  /** Purchase price of the home. */
  homePrice: number;
  /** Down payment expressed in dollars (already resolved from $ or %). */
  downPaymentAmount: number;
  /** Nominal annual interest rate as a percentage, compounded semi-annually. */
  annualInterestRatePercent: number;
  /** Amortization period in whole years. */
  amortizationYears: number;
  /** Annual property tax in dollars. */
  annualPropertyTax: number;
  /** Annual home-insurance estimate in dollars. */
  annualHomeInsurance: number;
  /** Monthly utilities estimate in dollars. */
  monthlyUtilities: number;
  /** Monthly condo or maintenance fees in dollars. */
  monthlyCondoFees: number;
}

/** One row of the yearly amortization schedule. */
export interface YearlyScheduleEntry {
  /** 1-based year index within the amortization period. */
  year: number;
  /** Mortgage balance remaining at the end of this year. */
  endingBalance: number;
  /** Interest paid during this year only. */
  interestPaid: number;
  /** Principal repaid during this year only. */
  principalPaid: number;
  /** Cumulative interest paid from year 1 through this year. */
  cumulativeInterest: number;
  /** Cumulative principal repaid from year 1 through this year. */
  cumulativePrincipal: number;
}

/** Full result of a home-cost calculation. */
export interface CalculationResult {
  /** Loan principal (home price minus down payment). */
  principal: number;
  /** Resolved down-payment amount in dollars. */
  downPaymentAmount: number;
  /** Down payment as a fraction of the home price (0–1). */
  downPaymentRatio: number;
  /** Effective monthly interest rate (decimal fraction) after semi-annual conversion. */
  monthlyRate: number;
  /** Total number of monthly payments. */
  numberOfPayments: number;

  /** Level monthly mortgage payment (principal + interest). */
  monthlyMortgagePayment: number;
  /** Property tax spread across 12 months. */
  monthlyPropertyTax: number;
  /** Home insurance spread across 12 months. */
  monthlyInsurance: number;
  /** Monthly utilities estimate (pass-through). */
  monthlyUtilities: number;
  /** Monthly condo/maintenance fees (pass-through). */
  monthlyCondoFees: number;
  /** Sum of every monthly housing cost above. */
  totalMonthlyCost: number;

  /** Total of all mortgage payments over the amortization period. */
  totalPaid: number;
  /** Total interest paid over the amortization period. */
  totalInterest: number;

  /** Year-by-year amortization schedule (length === amortizationYears). */
  schedule: YearlyScheduleEntry[];
}
