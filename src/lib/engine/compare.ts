/**
 * Scenario A vs B comparison. Pure derivation from two calculation results so
 * the UI can render monthly and lifetime differences without recomputing.
 */

import type { CalculationResult } from "./types";

export interface ScenarioComparison {
  /** Scenario B monthly housing cost minus Scenario A (positive = B costs more). */
  monthlyCostDelta: number;
  /** Difference in the mortgage payment portion only. */
  monthlyPaymentDelta: number;
  /** Difference in total interest paid over the amortization period. */
  totalInterestDelta: number;
  /** Difference in total amount paid over the amortization period. */
  totalPaidDelta: number;
  /** Difference in loan principal. */
  principalDelta: number;
  /** Which scenario is cheaper on a monthly basis, or null if identical. */
  cheaperMonthly: "A" | "B" | null;
  /** Which scenario costs less over the life of the mortgage, or null if identical. */
  cheaperLifetime: "A" | "B" | null;
}

function cheaper(delta: number): "A" | "B" | null {
  if (delta > 0) return "A"; // B − A > 0 → A is cheaper
  if (delta < 0) return "B";
  return null;
}

/** Compare two results as B relative to A. */
export function compareScenarios(a: CalculationResult, b: CalculationResult): ScenarioComparison {
  const monthlyCostDelta = b.totalMonthlyCost - a.totalMonthlyCost;
  const totalPaidDelta = b.totalPaid - a.totalPaid;
  return {
    monthlyCostDelta,
    monthlyPaymentDelta: b.monthlyMortgagePayment - a.monthlyMortgagePayment,
    totalInterestDelta: b.totalInterest - a.totalInterest,
    totalPaidDelta,
    principalDelta: b.principal - a.principal,
    cheaperMonthly: cheaper(monthlyCostDelta),
    cheaperLifetime: cheaper(totalPaidDelta),
  };
}
