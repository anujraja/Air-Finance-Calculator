/**
 * Pure Canadian mortgage math.
 *
 * References for the conventions used here:
 * - Canadian fixed-rate mortgages are, by law and long-standing convention,
 *   compounded *semi-annually, not in advance*. To turn a nominal annual rate
 *   into the rate applied to a monthly payment we first find the semi-annual
 *   compounding factor and then take its 1/6 power (2 compounds per year over
 *   12 months → exponent 2/12):
 *
 *       monthlyRate = (1 + annualRate / 2) ^ (2 / 12) − 1
 *
 * - The payment itself uses the standard amortizing-loan (annuity) formula:
 *
 *       payment = P · r / (1 − (1 + r)^−n)
 *
 *   with the r = 0 case handled separately as a straight-line P / n.
 *
 * These functions operate on plain numbers and never round intermediate
 * results; rounding is applied only at the presentation boundary so that the
 * schedule reconciles cleanly to a (near) zero closing balance.
 */

import type { EngineInput, CalculationResult, YearlyScheduleEntry } from "./types";

/** Months in a year — named for readability at call sites. */
const MONTHS_PER_YEAR = 12;

/**
 * Convert a nominal annual interest rate (as a percentage, compounded
 * semi-annually) into the effective monthly rate as a decimal fraction.
 *
 * @param annualRatePercent e.g. `5.25` for 5.25% per year.
 * @returns the per-month rate, e.g. `0.00433…`; returns `0` for a 0% input.
 */
export function canadianMonthlyRate(annualRatePercent: number): number {
  if (!Number.isFinite(annualRatePercent) || annualRatePercent <= 0) return 0;
  const annualRate = annualRatePercent / 100;
  return Math.pow(1 + annualRate / 2, 2 / MONTHS_PER_YEAR) - 1;
}

/**
 * Level monthly payment for an amortizing loan.
 *
 * Handles the zero-interest case (`monthlyRate === 0`) as a straight-line
 * repayment of the principal, and a zero-principal loan as a `0` payment.
 *
 * @param principal loan amount in dollars (must be ≥ 0).
 * @param monthlyRate per-month decimal rate from {@link canadianMonthlyRate}.
 * @param numberOfPayments total number of monthly payments (must be > 0).
 */
export function monthlyPayment(
  principal: number,
  monthlyRate: number,
  numberOfPayments: number,
): number {
  if (numberOfPayments <= 0) return 0;
  if (principal <= 0) return 0;
  if (monthlyRate === 0) return principal / numberOfPayments;
  const factor = Math.pow(1 + monthlyRate, -numberOfPayments);
  return (principal * monthlyRate) / (1 - factor);
}

/**
 * Build a year-by-year amortization schedule by simulating each month.
 *
 * The final year's ending balance is clamped to exactly `0` to absorb
 * floating-point drift so the last row reads as fully paid off.
 */
export function buildYearlySchedule(
  principal: number,
  monthlyRate: number,
  amortizationYears: number,
  payment: number,
): YearlyScheduleEntry[] {
  const schedule: YearlyScheduleEntry[] = [];
  let balance = principal;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;

  for (let year = 1; year <= amortizationYears; year++) {
    let interestThisYear = 0;
    let principalThisYear = 0;

    for (let month = 0; month < MONTHS_PER_YEAR; month++) {
      const interest = balance * monthlyRate;
      // The final scheduled payment may exceed the tiny remaining balance;
      // never pay down more principal than is outstanding.
      const principalPortion = Math.min(payment - interest, balance);
      interestThisYear += interest;
      principalThisYear += principalPortion;
      balance -= principalPortion;
    }

    cumulativeInterest += interestThisYear;
    cumulativePrincipal += principalThisYear;

    const isFinalYear = year === amortizationYears;
    schedule.push({
      year,
      endingBalance: isFinalYear ? 0 : Math.max(balance, 0),
      interestPaid: interestThisYear,
      principalPaid: principalThisYear,
      cumulativeInterest,
      cumulativePrincipal,
    });
  }

  return schedule;
}

/** Round a dollar amount to cents. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Run the full home-cost calculation over a normalized input.
 *
 * Money outputs are rounded to cents. Totals are derived from the exact
 * (unrounded) payment so that `totalInterest = totalPaid − principal` holds.
 */
export function calculate(input: EngineInput): CalculationResult {
  const {
    homePrice,
    downPaymentAmount,
    annualInterestRatePercent,
    amortizationYears,
    annualPropertyTax,
    annualHomeInsurance,
    monthlyUtilities,
    monthlyCondoFees,
  } = input;

  const principal = Math.max(homePrice - downPaymentAmount, 0);
  const downPaymentRatio = homePrice > 0 ? downPaymentAmount / homePrice : 0;
  const monthlyRate = canadianMonthlyRate(annualInterestRatePercent);
  const numberOfPayments = amortizationYears * MONTHS_PER_YEAR;

  const exactPayment = monthlyPayment(principal, monthlyRate, numberOfPayments);
  const totalPaidExact = exactPayment * numberOfPayments;
  const totalInterestExact = Math.max(totalPaidExact - principal, 0);

  const monthlyPropertyTax = annualPropertyTax / MONTHS_PER_YEAR;
  const monthlyInsurance = annualHomeInsurance / MONTHS_PER_YEAR;

  const totalMonthlyCost =
    exactPayment +
    monthlyPropertyTax +
    monthlyInsurance +
    monthlyUtilities +
    monthlyCondoFees;

  return {
    principal: round2(principal),
    downPaymentAmount: round2(downPaymentAmount),
    downPaymentRatio,
    monthlyRate,
    numberOfPayments,

    monthlyMortgagePayment: round2(exactPayment),
    monthlyPropertyTax: round2(monthlyPropertyTax),
    monthlyInsurance: round2(monthlyInsurance),
    monthlyUtilities: round2(monthlyUtilities),
    monthlyCondoFees: round2(monthlyCondoFees),
    totalMonthlyCost: round2(totalMonthlyCost),

    totalPaid: round2(totalPaidExact),
    totalInterest: round2(totalInterestExact),

    schedule: buildYearlySchedule(
      principal,
      monthlyRate,
      amortizationYears,
      exactPayment,
    ).map((entry) => ({
      year: entry.year,
      endingBalance: round2(entry.endingBalance),
      interestPaid: round2(entry.interestPaid),
      principalPaid: round2(entry.principalPaid),
      cumulativeInterest: round2(entry.cumulativeInterest),
      cumulativePrincipal: round2(entry.cumulativePrincipal),
    })),
  };
}
