/**
 * Mortgage affordability from income, using CMHC-style GDS/TDS ratios and the
 * federal mortgage stress test (qualify at the greater of the contract rate + 2%
 * or 5.25%). Property tax scales with the home price, so the solution is found
 * by fixed-point iteration.
 *
 * Educational estimate only — lenders apply their own rules and credit checks.
 */

import { canadianMonthlyRate } from "@/lib/engine/mortgage";
import { AFFORDABILITY } from "./constants";

export interface AffordabilityInput {
  /** Gross annual household income. */
  grossAnnualIncome: number;
  /** Total monthly payments on other debts (cards, loans, car). */
  monthlyDebtPayments: number;
  /** Cash available for the down payment. */
  downPayment: number;
  /** Contract mortgage rate (annual %, before the stress-test buffer). */
  contractRate: number;
  /** Amortization in years. */
  amortizationYears: number;
  /** Monthly condo/maintenance fees (50% counts toward GDS/TDS). */
  monthlyCondoFees: number;
  /** Estimated annual property tax as a % of home value (default 1.0%). */
  propertyTaxRatePercent?: number;
  /** Monthly heating estimate (defaults to guideline value). */
  monthlyHeat?: number;
}

export interface AffordabilityResult {
  /** Qualifying rate used for the stress test (annual %). */
  qualifyingRate: number;
  maxHomePrice: number;
  maxMortgage: number;
  /** Maximum monthly mortgage payment at the qualifying rate. */
  maxMonthlyMortgage: number;
  /** Maximum total monthly housing budget (GDS/TDS limited). */
  maxMonthlyHousing: number;
  monthlyIncome: number;
  /** Whether GDS or TDS is the binding constraint. */
  limitedBy: "GDS" | "TDS";
  gdsRoom: number;
  tdsRoom: number;
}

/** Present value of a level monthly payment (max mortgage for a given payment). */
function mortgagePrincipalFromPayment(payment: number, monthlyRate: number, n: number): number {
  if (payment <= 0 || n <= 0) return 0;
  if (monthlyRate === 0) return payment * n;
  return (payment * (1 - Math.pow(1 + monthlyRate, -n))) / monthlyRate;
}

export function calculateAffordability(input: AffordabilityInput): AffordabilityResult {
  const monthlyIncome = Math.max(input.grossAnnualIncome, 0) / 12;
  const qualifyingRate = Math.max(
    input.contractRate + AFFORDABILITY.stressTestBuffer,
    AFFORDABILITY.stressTestFloor,
  );
  const monthlyRate = canadianMonthlyRate(qualifyingRate);
  const n = Math.max(input.amortizationYears, 1) * 12;
  const monthlyHeat = input.monthlyHeat ?? AFFORDABILITY.defaultMonthlyHeat;
  const halfCondo = Math.max(input.monthlyCondoFees, 0) * 0.5;
  const propertyTaxRate = (input.propertyTaxRatePercent ?? 1.0) / 100;

  const gdsRoom = AFFORDABILITY.gds * monthlyIncome;
  const tdsRoom = AFFORDABILITY.tds * monthlyIncome - Math.max(input.monthlyDebtPayments, 0);
  const maxMonthlyHousing = Math.max(Math.min(gdsRoom, tdsRoom), 0);
  const limitedBy: "GDS" | "TDS" = tdsRoom < gdsRoom ? "TDS" : "GDS";

  // Property tax depends on home price, which depends on the mortgage — iterate.
  let homePrice = Math.max(input.downPayment, 0);
  let maxMortgage = 0;
  let maxMonthlyMortgage = 0;
  for (let i = 0; i < 50; i++) {
    const monthlyPropertyTax = (homePrice * propertyTaxRate) / 12;
    maxMonthlyMortgage = Math.max(maxMonthlyHousing - monthlyPropertyTax - monthlyHeat - halfCondo, 0);
    maxMortgage = mortgagePrincipalFromPayment(maxMonthlyMortgage, monthlyRate, n);
    const nextHomePrice = maxMortgage + Math.max(input.downPayment, 0);
    if (Math.abs(nextHomePrice - homePrice) < 1) {
      homePrice = nextHomePrice;
      break;
    }
    homePrice = nextHomePrice;
  }

  const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
  return {
    qualifyingRate,
    maxHomePrice: round2(homePrice),
    maxMortgage: round2(maxMortgage),
    maxMonthlyMortgage: round2(maxMonthlyMortgage),
    maxMonthlyHousing: round2(maxMonthlyHousing),
    monthlyIncome: round2(monthlyIncome),
    limitedBy,
    gdsRoom: round2(gdsRoom),
    tdsRoom: round2(tdsRoom),
  };
}
