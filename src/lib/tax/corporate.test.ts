import { describe, it, expect } from "vitest";
import { calculateCorporateTax } from "./corporate";

describe("calculateCorporateTax", () => {
  it("taxes small-business income at 11.2%", () => {
    const r = calculateCorporateTax({ activeBusinessIncome: 200_000 });
    expect(r.totalCorporateTax).toBeCloseTo(22_400, 2); // 200,000 × 11.2%
    expect(r.afterTaxRetained).toBeCloseTo(177_600, 2);
    expect(r.generalTax).toBe(0);
  });

  it("applies the general rate above the $500k limit", () => {
    const r = calculateCorporateTax({ activeBusinessIncome: 600_000 });
    // 500,000 × 11.2% + 100,000 × 26.5%
    expect(r.smallBusinessTax).toBeCloseTo(56_000, 2);
    expect(r.generalTax).toBeCloseTo(26_500, 2);
    expect(r.totalCorporateTax).toBeCloseTo(82_500, 2);
  });

  it("is 0 for no income", () => {
    expect(calculateCorporateTax({ activeBusinessIncome: 0 }).totalCorporateTax).toBe(0);
  });
});
