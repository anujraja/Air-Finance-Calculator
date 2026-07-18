import { describe, it, expect } from "vitest";
import { calculateIncomeTax } from "./incomeTax";
import {
  profileSchema,
  analyzeProfile,
  DEFAULT_PROFILE,
  DEMO_PROFILE,
  COUPLE_DEMO,
  type FinancialProfile,
} from "./profile";

const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

describe("profileSchema", () => {
  it("accepts the default and demo profiles", () => {
    expect(profileSchema.safeParse(DEFAULT_PROFILE).success).toBe(true);
    expect(profileSchema.safeParse(DEMO_PROFILE).success).toBe(true);
  });

  it("accepts the couple demo profile", () => {
    expect(profileSchema.safeParse(COUPLE_DEMO).success).toBe(true);
  });

  it("parses an old v1 profile that omits householdMode and partner fields", () => {
    // Backward-compat: a profile stored before couple mode existed has none of
    // the new keys. The .default(...) on each new field must fill them in.
    const legacy: Partial<Record<keyof FinancialProfile, unknown>> = { ...DEFAULT_PROFILE };
    delete legacy.householdMode;
    delete legacy.partnerEmploymentType;
    delete legacy.partnerEmploymentIncome;
    delete legacy.partnerSelfEmploymentIncome;
    delete legacy.partnerOtherIncome;
    delete legacy.partnerRrspDeduction;
    const parsed = profileSchema.safeParse(legacy);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.householdMode).toBe("single");
      expect(parsed.data.partnerEmploymentIncome).toBe(0);
      expect(parsed.data.partnerSelfEmploymentIncome).toBe(0);
      expect(parsed.data.partnerOtherIncome).toBe(0);
      expect(parsed.data.partnerRrspDeduction).toBe(0);
    }
  });

  it("rejects a negative income", () => {
    expect(profileSchema.safeParse({ ...DEFAULT_PROFILE, employmentIncome: -1 }).success).toBe(false);
  });

  it("rejects a zero home price", () => {
    expect(profileSchema.safeParse({ ...DEFAULT_PROFILE, homePrice: 0 }).success).toBe(false);
  });

  it("coerces numeric strings", () => {
    const r = profileSchema.safeParse({ ...DEFAULT_PROFILE, employmentIncome: "85000" });
    expect(r.success).toBe(true);
  });
});

describe("analyzeProfile", () => {
  it("runs every engine for the default profile", () => {
    const a = analyzeProfile(DEFAULT_PROFILE);
    expect(a.incomeTax.afterTaxIncome).toBeGreaterThan(0);
    expect(a.affordability.maxHomePrice).toBeGreaterThan(0);
    expect(a.savings.monthsToGoal).toBeGreaterThan(0);
    expect(a.mortgage.monthlyMortgagePayment).toBeGreaterThan(0);
    expect(a.corporate).toBeNull();
  });

  it("includes a corporate analysis when business income is present", () => {
    const a = analyzeProfile(DEMO_PROFILE);
    expect(a.corporate).not.toBeNull();
    expect(a.corporate!.totalCorporateTax).toBeGreaterThan(0);
  });

  it("caps the mortgage down payment at the home price", () => {
    const a = analyzeProfile({ ...DEFAULT_PROFILE, downPaymentTarget: 999_999_999, homePrice: 500_000 });
    expect(a.mortgage.principal).toBe(0);
  });

  it("single mode has no partner and household mirrors the sole income tax", () => {
    const a = analyzeProfile(DEFAULT_PROFILE);
    expect(a.partnerIncomeTax).toBeNull();
    expect(a.household.grossIncome).toBe(a.incomeTax.grossIncome);
    expect(a.household.afterTaxIncome).toBe(a.incomeTax.afterTaxIncome);
    expect(a.household.monthlyAfterTax).toBe(a.incomeTax.monthlyAfterTax);
    expect(a.household.totalIncomeTax).toBe(a.incomeTax.totalIncomeTax);
    // Household rate derives from the rounded tax total, so it matches the
    // per-person rate to the cent (a sub-cent rounding epsilon aside).
    expect(a.household.averageTaxRate).toBeCloseTo(a.incomeTax.averageTaxRate, 6);
  });

  it("keeps the DEMO profile's take-home byte-identical (single mode unchanged)", () => {
    const a = analyzeProfile(DEMO_PROFILE);
    expect(a.partnerIncomeTax).toBeNull();
    expect(a.incomeTax.monthlyAfterTax).toBe(11808.08);
    expect(a.household.monthlyAfterTax).toBe(11808.08);
  });

  it("couple mode taxes each partner separately then sums take-home", () => {
    const a = analyzeProfile(COUPLE_DEMO);
    expect(a.partnerIncomeTax).not.toBeNull();
    expect(a.household.grossIncome).toBe(300_000);
    // Household after-tax is exactly the sum of the two individual returns.
    expect(a.household.afterTaxIncome).toBe(
      round2(a.incomeTax.afterTaxIncome + a.partnerIncomeTax!.afterTaxIncome),
    );
    expect(a.household.afterTaxIncome).toBe(219939.38);
    expect(a.household.monthlyAfterTax).toBe(18328.28);
    expect(a.incomeTax.afterTaxIncome).toBe(119109.39);
    expect(a.partnerIncomeTax!.afterTaxIncome).toBe(100829.99);
  });

  it("couple affordability uses combined income, raising the max home price", () => {
    const couple = analyzeProfile(COUPLE_DEMO);
    const singleEquivalent = analyzeProfile({ ...COUPLE_DEMO, householdMode: "single" });
    // Same person-1 income, but the couple adds partner income to GDS/TDS.
    expect(singleEquivalent.partnerIncomeTax).toBeNull();
    expect(couple.affordability.maxHomePrice).toBeGreaterThan(
      singleEquivalent.affordability.maxHomePrice,
    );
    expect(couple.affordability.maxHomePrice).toBeGreaterThan(1_000_000);
  });

  it("two earners net more take-home than one earner with the same total income", () => {
    // Progressive brackets, a second BPA, and separate surtax thresholds mean
    // splitting $300k across two people beats taxing it on one return.
    const couple = analyzeProfile(COUPLE_DEMO);
    const oneEarner = calculateIncomeTax({
      employmentIncome: 300_000,
      selfEmploymentIncome: 0,
      otherIncome: 0,
      rrspDeduction: 27_000, // 15k + 12k, matching the couple's combined RRSP
      otherDeductions: 0,
    });
    expect(couple.household.afterTaxIncome).toBeGreaterThan(oneEarner.afterTaxIncome);
  });
});
