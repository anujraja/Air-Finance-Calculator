/**
 * CSV export of a full profile analysis. Pure and DOM-free so it can be
 * unit-tested; the component layer (ExportActions) handles the Blob download.
 *
 * Values are emitted as raw numbers — no `$`, `%`, or thousands separators — so
 * the file imports cleanly into a spreadsheet (a `$1,234.56` string would break
 * CSV columns). This is deliberately NOT the `formatCAD`/`formatPercent` path,
 * which is for on-screen display only.
 *
 * Layout is a fixed 3-column long/tidy shape — `Section,Metric,Value` — which
 * stays valid whether the profile is single-person or a couple. Couple mode
 * (Canada taxes individuals) adds per-partner income-tax sections plus a
 * household summary; affordability/savings stay household-level per the engine.
 */

import type { FinancialProfile, ProfileAnalysis } from "@/lib/tax/profile";
import type { IncomeTaxResult } from "@/lib/tax/incomeTax";

/** One data row: a section, a human label, and its raw value. */
export interface CsvRow {
  section: string;
  label: string;
  value: string | number;
}

/**
 * RFC-4180-safe quoting: wrap the field in quotes and double any internal
 * quotes when it contains a comma, quote, or newline. Numbers pass through as
 * their `String()` form.
 */
export function csvEscape(field: string | number): string {
  const s = String(field);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Turn rows into CSV text. The header row is fixed: `Section,Metric,Value`.
 * Lines are joined with `\n` (matches the plain-text summary idiom and imports
 * everywhere), and the output ends with a trailing newline.
 */
export function rowsToCsv(rows: CsvRow[]): string {
  const lines = ["Section,Metric,Value"];
  for (const row of rows) {
    lines.push(`${csvEscape(row.section)},${csvEscape(row.label)},${csvEscape(row.value)}`);
  }
  return `${lines.join("\n")}\n`;
}

/** Emit one person's income-tax result under a given section heading. */
function incomeTaxRows(section: string, r: IncomeTaxResult): CsvRow[] {
  return [
    { section, label: "Gross income", value: r.grossIncome },
    { section, label: "Taxable income", value: r.taxableIncome },
    { section, label: "Federal tax", value: r.federalTax },
    { section, label: "Ontario tax", value: r.ontarioTax },
    { section, label: "Ontario basic tax", value: r.ontarioBasicTax },
    { section, label: "Ontario surtax", value: r.ontarioSurtax },
    { section, label: "Ontario health premium", value: r.ontarioHealthPremium },
    { section, label: "CPP", value: r.cpp },
    { section, label: "EI", value: r.ei },
    { section, label: "Total income tax", value: r.totalIncomeTax },
    { section, label: "Total deductions", value: r.totalDeductions },
    { section, label: "After-tax income (year)", value: r.afterTaxIncome },
    { section, label: "Take-home (month)", value: r.monthlyAfterTax },
    { section, label: "Average tax rate (ratio 0–1)", value: r.averageTaxRate },
    { section, label: "Average deduction rate (ratio 0–1)", value: r.averageDeductionRate },
    { section, label: "Marginal tax rate (ratio 0–1)", value: r.marginalTaxRate },
  ];
}

/** Build the ordered list of rows for a profile + its analysis. Pure. */
export function buildAnalysisRows(profile: FinancialProfile, analysis: ProfileAnalysis): CsvRow[] {
  const { incomeTax, partnerIncomeTax, household, corporate, affordability, savings, mortgage } =
    analysis;
  const isCouple = partnerIncomeTax !== null;
  const rows: CsvRow[] = [];

  // Report
  rows.push(
    { section: "Report", label: "Jurisdiction", value: "Ontario 2026" },
    { section: "Report", label: "Generated", value: isoDate() },
    { section: "Report", label: "Household mode", value: profile.householdMode },
  );

  // Profile inputs
  rows.push(
    { section: "Profile inputs", label: "Employment type", value: profile.employmentType },
    { section: "Profile inputs", label: "Employment income", value: profile.employmentIncome },
    { section: "Profile inputs", label: "Self-employment income", value: profile.selfEmploymentIncome },
    { section: "Profile inputs", label: "Other income", value: profile.otherIncome },
    { section: "Profile inputs", label: "Business income", value: profile.businessIncome },
    { section: "Profile inputs", label: "RRSP deduction", value: profile.rrspDeduction },
  );
  // Partner 2 inputs only appear in couple mode (keeps single-mode output free
  // of any "Partner" rows — see the single-mode safety test).
  if (isCouple) {
    rows.push(
      { section: "Profile inputs", label: "Partner 2 employment type", value: profile.partnerEmploymentType },
      { section: "Profile inputs", label: "Partner 2 employment income", value: profile.partnerEmploymentIncome },
      { section: "Profile inputs", label: "Partner 2 self-employment income", value: profile.partnerSelfEmploymentIncome },
      { section: "Profile inputs", label: "Partner 2 other income", value: profile.partnerOtherIncome },
      { section: "Profile inputs", label: "Partner 2 RRSP deduction", value: profile.partnerRrspDeduction },
    );
  }
  rows.push(
    { section: "Profile inputs", label: "Current savings", value: profile.currentSavings },
    { section: "Profile inputs", label: "Monthly savings", value: profile.monthlySavings },
    { section: "Profile inputs", label: "Monthly debt payments", value: profile.monthlyDebtPayments },
    { section: "Profile inputs", label: "Home price", value: profile.homePrice },
    { section: "Profile inputs", label: "Down-payment target", value: profile.downPaymentTarget },
    { section: "Profile inputs", label: "Mortgage rate (%)", value: profile.mortgageRate },
    { section: "Profile inputs", label: "Amortization (years)", value: profile.amortizationYears },
    { section: "Profile inputs", label: "Annual property tax", value: profile.annualPropertyTax },
    { section: "Profile inputs", label: "Annual home insurance", value: profile.annualHomeInsurance },
    { section: "Profile inputs", label: "Monthly utilities", value: profile.monthlyUtilities },
    { section: "Profile inputs", label: "Monthly condo fees", value: profile.monthlyCondoFees },
  );

  // Income & tax. Single mode is one block bound to the sole person, so the
  // demo's take-home stays byte-for-byte. Couple mode splits per partner (each
  // taxed as an individual) and adds a household summary.
  if (isCouple && partnerIncomeTax) {
    rows.push(...incomeTaxRows("Income & tax — Partner 1", incomeTax));
    rows.push(...incomeTaxRows("Income & tax — Partner 2", partnerIncomeTax));
    rows.push(
      { section: "Income & tax — Household", label: "Household gross income", value: household.grossIncome },
      { section: "Income & tax — Household", label: "Household total income tax", value: household.totalIncomeTax },
      { section: "Income & tax — Household", label: "Household total deductions", value: household.totalDeductions },
      { section: "Income & tax — Household", label: "Household after-tax income (year)", value: household.afterTaxIncome },
      { section: "Income & tax — Household", label: "Household take-home (month)", value: household.monthlyAfterTax },
      { section: "Income & tax — Household", label: "Household average tax rate (ratio 0–1)", value: household.averageTaxRate },
      { section: "Income & tax — Household", label: "Household average deduction rate (ratio 0–1)", value: household.averageDeductionRate },
    );
  } else {
    rows.push(...incomeTaxRows("Income & tax", incomeTax));
  }

  // Business (corporate) — only when the profile carries business income.
  if (corporate) {
    rows.push(
      { section: "Business (corporate)", label: "Active business income", value: corporate.activeBusinessIncome },
      { section: "Business (corporate)", label: "Small-business portion", value: corporate.smallBusinessPortion },
      { section: "Business (corporate)", label: "General portion", value: corporate.generalPortion },
      { section: "Business (corporate)", label: "Small-business tax", value: corporate.smallBusinessTax },
      { section: "Business (corporate)", label: "General tax", value: corporate.generalTax },
      { section: "Business (corporate)", label: "Total corporate tax", value: corporate.totalCorporateTax },
      { section: "Business (corporate)", label: "After-tax retained", value: corporate.afterTaxRetained },
      { section: "Business (corporate)", label: "Average rate (ratio 0–1)", value: corporate.averageRate },
    );
  }

  // Affordability — household-level (combined gross income drives GDS/TDS).
  rows.push(
    { section: "Affordability", label: "Qualifying rate (%)", value: affordability.qualifyingRate },
    { section: "Affordability", label: "Max home price", value: affordability.maxHomePrice },
    { section: "Affordability", label: "Max mortgage", value: affordability.maxMortgage },
    { section: "Affordability", label: "Max monthly mortgage", value: affordability.maxMonthlyMortgage },
    { section: "Affordability", label: "Max monthly housing", value: affordability.maxMonthlyHousing },
    { section: "Affordability", label: "Monthly income", value: affordability.monthlyIncome },
    { section: "Affordability", label: "Limited by", value: affordability.limitedBy },
    { section: "Affordability", label: "GDS room", value: affordability.gdsRoom },
    { section: "Affordability", label: "TDS room", value: affordability.tdsRoom },
  );

  // Down-payment plan
  rows.push(
    { section: "Down-payment plan", label: "Target", value: profile.downPaymentTarget },
    { section: "Down-payment plan", label: "Already met", value: savings.alreadyMet ? "yes" : "no" },
    { section: "Down-payment plan", label: "Months to goal", value: savings.monthsToGoal ?? "not reachable" },
    { section: "Down-payment plan", label: "Years", value: savings.years },
    { section: "Down-payment plan", label: "Months", value: savings.months },
    { section: "Down-payment plan", label: "Required monthly (5 yr)", value: savings.requiredMonthlyForFiveYears },
    { section: "Down-payment plan", label: "Gap to target", value: analysis.targetDownPaymentGap },
  );

  // Target-home mortgage
  rows.push(
    { section: "Target-home mortgage", label: "Home price", value: profile.homePrice },
    { section: "Target-home mortgage", label: "Down payment", value: mortgage.downPaymentAmount },
    { section: "Target-home mortgage", label: "Loan principal", value: mortgage.principal },
    { section: "Target-home mortgage", label: "Monthly mortgage", value: mortgage.monthlyMortgagePayment },
    { section: "Target-home mortgage", label: "Total monthly cost", value: mortgage.totalMonthlyCost },
    { section: "Target-home mortgage", label: "Total interest", value: mortgage.totalInterest },
    { section: "Target-home mortgage", label: "Total amount paid", value: mortgage.totalPaid },
  );

  return rows;
}

/** Convenience: buildAnalysisRows → rowsToCsv. This is what the component calls. */
export function buildAnalysisCsv(profile: FinancialProfile, analysis: ProfileAnalysis): string {
  return rowsToCsv(buildAnalysisRows(profile, analysis));
}

/** Stable, dated filename, e.g. `homecost-canada-analysis-2026-07-18.csv`. */
export function analysisCsvFilename(date?: Date): string {
  return `homecost-canada-analysis-${isoDate(date)}.csv`;
}

/** Local date as `yyyy-mm-dd`, zero-padded. */
function isoDate(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
