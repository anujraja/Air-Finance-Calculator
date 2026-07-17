/**
 * Plain-text summary builder for the "Copy summary" action. Kept UI-free so it
 * can be unit-tested and reused.
 */

import type { CalculationResult } from "@/lib/engine/types";
import type { CalculatorInput } from "@/lib/engine/schema";
import type { ScenarioComparison } from "@/lib/engine/compare";
import { formatCAD, formatPercent, formatSignedCAD } from "@/lib/engine/format";

function scenarioBlock(name: string, input: CalculatorInput, result: CalculationResult): string {
  const down =
    input.downPaymentType === "percent"
      ? `${input.downPaymentValue}%`
      : formatCAD(input.downPaymentValue);
  return [
    `${name}`,
    `  Home price:            ${formatCAD(input.homePrice)}`,
    `  Down payment:          ${down} (${formatCAD(result.downPaymentAmount)})`,
    `  Loan principal:        ${formatCAD(result.principal)}`,
    `  Interest rate:         ${input.annualInterestRatePercent}% / ${input.amortizationYears} yr amortization`,
    `  Monthly mortgage:      ${formatCAD(result.monthlyMortgagePayment)}`,
    `  Total monthly cost:    ${formatCAD(result.totalMonthlyCost)}`,
    `  Total interest:        ${formatCAD(result.totalInterest)}`,
    `  Total amount paid:     ${formatCAD(result.totalPaid)}`,
  ].join("\n");
}

export function buildSummary(args: {
  inputA: CalculatorInput;
  resultA: CalculationResult;
  inputB?: CalculatorInput;
  resultB?: CalculationResult;
  comparison?: ScenarioComparison;
}): string {
  const { inputA, resultA, inputB, resultB, comparison } = args;
  const lines = ["HomeCost Canada — Scenario summary", ""];
  lines.push(scenarioBlock("Scenario A", inputA, resultA));

  if (inputB && resultB && comparison) {
    lines.push("", scenarioBlock("Scenario B", inputB, resultB));
    lines.push(
      "",
      "Difference (B vs A)",
      `  Monthly cost:          ${formatSignedCAD(comparison.monthlyCostDelta)}`,
      `  Total interest:        ${formatSignedCAD(comparison.totalInterestDelta)}`,
      `  Total amount paid:     ${formatSignedCAD(comparison.totalPaidDelta)}`,
    );
    if (comparison.cheaperLifetime) {
      lines.push(`  Lower lifetime cost:   Scenario ${comparison.cheaperLifetime}`);
    }
  }

  lines.push(
    "",
    `Down payment ratio (A): ${formatPercent(resultA.downPaymentRatio)}`,
    "",
    "Educational demonstration only — not financial advice.",
  );
  return lines.join("\n");
}
