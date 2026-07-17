import { describe, it, expect } from "vitest";
import { calculate } from "./mortgage";
import { compareScenarios } from "./compare";
import type { EngineInput } from "./types";

const base: EngineInput = {
  homePrice: 500_000,
  downPaymentAmount: 100_000,
  annualInterestRatePercent: 5,
  amortizationYears: 25,
  annualPropertyTax: 0,
  annualHomeInsurance: 0,
  monthlyUtilities: 0,
  monthlyCondoFees: 0,
};

describe("compareScenarios", () => {
  it("reports zero deltas for identical scenarios", () => {
    const a = calculate(base);
    const b = calculate(base);
    const cmp = compareScenarios(a, b);
    expect(cmp.monthlyCostDelta).toBe(0);
    expect(cmp.totalPaidDelta).toBe(0);
    expect(cmp.cheaperMonthly).toBeNull();
    expect(cmp.cheaperLifetime).toBeNull();
  });

  it("flags the lower-rate scenario as cheaper", () => {
    const a = calculate(base); // 5%
    const b = calculate({ ...base, annualInterestRatePercent: 6 });
    const cmp = compareScenarios(a, b);
    expect(cmp.monthlyPaymentDelta).toBeGreaterThan(0); // B pays more
    expect(cmp.totalInterestDelta).toBeGreaterThan(0);
    expect(cmp.cheaperMonthly).toBe("A");
    expect(cmp.cheaperLifetime).toBe("A");
  });

  it("shows a larger down payment lowers lifetime cost", () => {
    const a = calculate(base); // 100k down
    const b = calculate({ ...base, downPaymentAmount: 200_000 });
    const cmp = compareScenarios(a, b);
    expect(cmp.principalDelta).toBe(-100_000);
    expect(cmp.cheaperLifetime).toBe("B");
  });
});
