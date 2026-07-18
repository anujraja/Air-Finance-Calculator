/**
 * Plain-text summary of a full profile analysis, for the "Copy summary" action.
 * UI-free and testable.
 */

import type { FinancialProfile, ProfileAnalysis } from "./profile";
import { formatCAD, formatPercent } from "@/lib/engine/format";

export function buildAnalysisSummary(profile: FinancialProfile, a: ProfileAnalysis): string {
  const { incomeTax: t, partnerIncomeTax: p, household: h, affordability: aff, savings: s, mortgage: m, corporate: c } = a;
  const lines: string[] = p
    ? [
        "HomeCost Canada — Financial snapshot (Ontario, 2026)",
        "",
        "HOUSEHOLD INCOME & TAX",
        `  Household gross:       ${formatCAD(h.grossIncome)}`,
        `  Household take-home (year):  ${formatCAD(h.afterTaxIncome)}`,
        `  Household take-home (month): ${formatCAD(h.monthlyAfterTax)}`,
        `  Household average tax rate:  ${formatPercent(h.averageTaxRate)}`,
        "",
        "PER PARTNER",
        `  Partner 1 gross:       ${formatCAD(t.grossIncome)}`,
        `  Partner 1 total tax:   ${formatCAD(t.totalIncomeTax)}`,
        `  Partner 1 take-home:   ${formatCAD(t.afterTaxIncome)}`,
        `  Partner 2 gross:       ${formatCAD(p.grossIncome)}`,
        `  Partner 2 total tax:   ${formatCAD(p.totalIncomeTax)}`,
        `  Partner 2 take-home:   ${formatCAD(p.afterTaxIncome)}`,
      ]
    : [
        "HomeCost Canada — Financial snapshot (Ontario, 2026)",
        "",
        "INCOME & TAX",
        `  Gross income:          ${formatCAD(t.grossIncome)}`,
        `  Federal tax:           ${formatCAD(t.federalTax)}`,
        `  Ontario tax:           ${formatCAD(t.ontarioTax)}`,
        `  CPP + EI:              ${formatCAD(t.cpp + t.ei)}`,
        `  Take-home (year):      ${formatCAD(t.afterTaxIncome)}`,
        `  Take-home (month):     ${formatCAD(t.monthlyAfterTax)}`,
        `  Average tax rate:      ${formatPercent(t.averageTaxRate)}`,
        `  Marginal tax rate:     ${formatPercent(t.marginalTaxRate)}`,
      ];

  if (c) {
    lines.push(
      "",
      "BUSINESS (CORPORATE)",
      `  Active business income:${formatCAD(c.activeBusinessIncome)}`,
      `  Corporate tax:         ${formatCAD(c.totalCorporateTax)} (${formatPercent(c.averageRate)})`,
      `  Retained after tax:    ${formatCAD(c.afterTaxRetained)}`,
    );
  }

  lines.push(
    "",
    "WHAT YOU CAN AFFORD",
    `  Max home price:        ${formatCAD(aff.maxHomePrice)}`,
    `  Max mortgage:          ${formatCAD(aff.maxMortgage)}`,
    `  Qualifying rate:       ${aff.qualifyingRate}% (stress test)`,
    `  Limited by:            ${aff.limitedBy}`,
  );
  if (p) {
    lines.push(`  Combined income used:  ${formatCAD(h.grossIncome)}`);
  }
  lines.push(
    "",
    "DOWN-PAYMENT PLAN",
    s.alreadyMet
      ? "  Goal already met."
      : s.monthsToGoal === null
        ? "  Goal not reachable at the current monthly amount."
        : `  Time to goal:          ${s.years} yr ${s.months} mo`,
    `  Target:                ${formatCAD(profile.downPaymentTarget)}`,
    "",
    "TARGET-HOME MORTGAGE",
    `  Home price:            ${formatCAD(profile.homePrice)}`,
    `  Monthly mortgage:      ${formatCAD(m.monthlyMortgagePayment)}`,
    `  Total monthly cost:    ${formatCAD(m.totalMonthlyCost)}`,
    `  Total interest:        ${formatCAD(m.totalInterest)}`,
    "",
    "Educational demonstration only — not financial, tax, or mortgage advice.",
  );

  return lines.join("\n");
}
