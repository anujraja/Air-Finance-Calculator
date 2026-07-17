/**
 * Simple Ontario corporate income-tax estimate for a Canadian-controlled private
 * corporation (CCPC). Active business income up to the $500k small-business
 * limit is taxed at the combined small-business rate (11.2% as of July 1 2026);
 * income above the limit is taxed at the combined general rate (26.5%).
 *
 * This models corporate-level tax only — it does not model paying the owner via
 * salary or dividends (personal integration), which the personal engine covers.
 * Educational estimate only, not tax advice.
 */

import { CORPORATE_2026 } from "./constants";

export interface CorporateTaxInput {
  /** Active business income (revenue minus deductible expenses). */
  activeBusinessIncome: number;
}

export interface CorporateTaxResult {
  activeBusinessIncome: number;
  smallBusinessPortion: number;
  generalPortion: number;
  smallBusinessTax: number;
  generalTax: number;
  totalCorporateTax: number;
  afterTaxRetained: number;
  averageRate: number;
}

const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

export function calculateCorporateTax(input: CorporateTaxInput): CorporateTaxResult {
  const income = Math.max(input.activeBusinessIncome, 0);
  const smallPortion = Math.min(income, CORPORATE_2026.smallBusinessLimit);
  const generalPortion = Math.max(income - CORPORATE_2026.smallBusinessLimit, 0);
  const smallTax = smallPortion * CORPORATE_2026.smallBusinessRate;
  const generalTax = generalPortion * CORPORATE_2026.generalRate;
  const total = smallTax + generalTax;

  return {
    activeBusinessIncome: income,
    smallBusinessPortion: round2(smallPortion),
    generalPortion: round2(generalPortion),
    smallBusinessTax: round2(smallTax),
    generalTax: round2(generalTax),
    totalCorporateTax: round2(total),
    afterTaxRetained: round2(income - total),
    averageRate: income > 0 ? total / income : 0,
  };
}
