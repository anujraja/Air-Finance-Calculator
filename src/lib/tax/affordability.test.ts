import { describe, it, expect } from "vitest";
import { calculateAffordability } from "./affordability";

const base = {
  grossAnnualIncome: 120_000,
  monthlyDebtPayments: 0,
  downPayment: 100_000,
  contractRate: 4.5,
  amortizationYears: 25,
  monthlyCondoFees: 0,
};

describe("calculateAffordability", () => {
  it("applies the stress test (max of contract+2% and 5.25%)", () => {
    expect(calculateAffordability({ ...base, contractRate: 4.5 }).qualifyingRate).toBe(6.5);
    expect(calculateAffordability({ ...base, contractRate: 2.0 }).qualifyingRate).toBe(5.25);
  });

  it("produces a sensible max home price above the down payment", () => {
    const r = calculateAffordability(base);
    expect(r.maxHomePrice).toBeGreaterThan(base.downPayment);
    expect(r.maxMortgage).toBeGreaterThan(0);
    expect(r.maxHomePrice).toBeCloseTo(r.maxMortgage + base.downPayment, 0);
  });

  it("reduces affordability when other debts are present", () => {
    const noDebt = calculateAffordability(base);
    const withDebt = calculateAffordability({ ...base, monthlyDebtPayments: 800 });
    expect(withDebt.maxHomePrice).toBeLessThan(noDebt.maxHomePrice);
    expect(withDebt.limitedBy).toBe("TDS");
  });

  it("is GDS-limited when there are no other debts", () => {
    expect(calculateAffordability(base).limitedBy).toBe("GDS");
  });

  it("higher income affords a higher price", () => {
    const low = calculateAffordability({ ...base, grossAnnualIncome: 80_000 });
    const high = calculateAffordability({ ...base, grossAnnualIncome: 160_000 });
    expect(high.maxHomePrice).toBeGreaterThan(low.maxHomePrice);
  });
});
