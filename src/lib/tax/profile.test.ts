import { describe, it, expect } from "vitest";
import { profileSchema, analyzeProfile, DEFAULT_PROFILE, DEMO_PROFILE } from "./profile";

describe("profileSchema", () => {
  it("accepts the default and demo profiles", () => {
    expect(profileSchema.safeParse(DEFAULT_PROFILE).success).toBe(true);
    expect(profileSchema.safeParse(DEMO_PROFILE).success).toBe(true);
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
});
