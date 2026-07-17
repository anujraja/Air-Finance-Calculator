/**
 * Ontario + federal tax constants for the 2026 tax year.
 *
 * SOURCES (all figures verified against primary/authoritative reporting):
 * - Federal brackets, BPA, 14% lowest rate — CRA 2026 indexation (factor 2.0%).
 *   https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html
 * - Ontario brackets, BPA, surtax, Health Premium — Ontario Ministry of Finance / TaxTips.ca 2026.
 *   https://www.taxtips.ca/taxrates/on.htm
 * - CPP/CPP2 (YMPE $74,600, YAMPE $85,000, 5.95% + 4%) and EI (MIE $68,900, 1.63%) — CRA 2026.
 * - Ontario small-business corporate rate 2.2% (eff. July 1 2026), combined 11.2% — Ontario Budget 2026.
 *
 * This is transparent modelling for educational use — NOT tax advice or filing.
 * Ontario is the only province modelled at this time.
 */

export interface TaxBracket {
  /** Upper bound of this bracket (Infinity for the top bracket). */
  upTo: number;
  /** Marginal rate applied within the bracket (decimal, e.g. 0.14). */
  rate: number;
}

/** Federal 2026 brackets. */
export const FEDERAL_BRACKETS_2026: TaxBracket[] = [
  { upTo: 58_523, rate: 0.14 },
  { upTo: 117_045, rate: 0.205 },
  { upTo: 181_440, rate: 0.26 },
  { upTo: 258_482, rate: 0.29 },
  { upTo: Infinity, rate: 0.33 },
];

/** Ontario 2026 brackets. */
export const ONTARIO_BRACKETS_2026: TaxBracket[] = [
  { upTo: 53_891, rate: 0.0505 },
  { upTo: 107_785, rate: 0.0915 },
  { upTo: 150_000, rate: 0.1116 },
  { upTo: 220_000, rate: 0.1216 },
  { upTo: Infinity, rate: 0.1316 },
];

export const FEDERAL_2026 = {
  /** Basic personal amount (full, for incomes at/under the 29% bracket floor). */
  bpaMax: 16_452,
  /** Reduced BPA for top-bracket incomes (fully phased in above $258,482). */
  bpaMin: 14_829,
  /** BPA phase-out band (matches the top two bracket floors). */
  bpaPhaseoutStart: 181_440,
  bpaPhaseoutEnd: 258_482,
  /** Rate at which non-refundable credits are valued. */
  lowestRate: 0.14,
} as const;

export const ONTARIO_2026 = {
  bpa: 12_989,
  lowestRate: 0.0505,
  /** Ontario surtax: 20% of ON tax over the first threshold, +36% over the second. */
  surtaxThreshold1: 5_818,
  surtaxThreshold2: 7_445,
  surtaxRate1: 0.2,
  surtaxRate2: 0.36,
} as const;

/**
 * Ontario Health Premium schedule (unchanged since 2004; not indexed).
 * Each tier: for taxable income above `over`, premium is `base` plus `rate`
 * of income above `over`, capped at `cap`.
 */
export const ONTARIO_HEALTH_PREMIUM: {
  over: number;
  base: number;
  rate: number;
  cap: number;
}[] = [
  { over: 20_000, base: 0, rate: 0.06, cap: 300 },
  { over: 36_000, base: 300, rate: 0.06, cap: 450 },
  { over: 48_000, base: 450, rate: 0.25, cap: 600 },
  { over: 72_000, base: 600, rate: 0.25, cap: 750 },
  { over: 200_000, base: 750, rate: 0.25, cap: 900 },
];

export const CPP_2026 = {
  /** Year's basic exemption. */
  basicExemption: 3_500,
  /** Year's maximum pensionable earnings (base CPP ceiling). */
  ympe: 74_600,
  /** Year's additional maximum pensionable earnings (CPP2 ceiling). */
  yampe: 85_000,
  /** Employee base rate (4.95%) + first enhancement (1.00%) = 5.95%. */
  employeeBaseRate: 0.0495,
  employeeEnhancementRate: 0.01,
  employeeRate: 0.0595,
  /** CPP2 rate on earnings between YMPE and YAMPE. */
  cpp2Rate: 0.04,
  /** Self-employed pays both halves. */
  selfEmployedRate: 0.119,
  selfEmployedCpp2Rate: 0.08,
} as const;

export const EI_2026 = {
  /** Maximum insurable earnings. */
  mie: 68_900,
  /** Employee premium rate (Ontario, not Quebec). */
  employeeRate: 0.0163,
  /** Maximum annual employee premium. */
  maxPremium: 1_123.07,
} as const;

export const CORPORATE_2026 = {
  /** Small-business active income limit. */
  smallBusinessLimit: 500_000,
  /** Combined federal (9%) + Ontario (2.2%, eff. July 1 2026) small-business rate. */
  smallBusinessRate: 0.112,
  /** Combined general active-business rate (fed 15% + ON 11.5%). */
  generalRate: 0.265,
} as const;

/** Mortgage affordability guideline ratios and the federal stress-test floor. */
export const AFFORDABILITY = {
  /** Gross Debt Service ratio ceiling. */
  gds: 0.39,
  /** Total Debt Service ratio ceiling. */
  tds: 0.44,
  /** Qualifying rate = max(contractRate + buffer, floor). */
  stressTestBuffer: 2,
  stressTestFloor: 5.25,
  /** Default monthly heating estimate used in GDS when not provided. */
  defaultMonthlyHeat: 175,
} as const;
