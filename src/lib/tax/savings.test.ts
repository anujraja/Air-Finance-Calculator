import { describe, it, expect } from "vitest";
import { calculateSavings } from "./savings";

describe("calculateSavings", () => {
  it("computes months to a goal with no interest", () => {
    const r = calculateSavings({
      targetAmount: 40_000,
      currentSavings: 10_000,
      monthlyContribution: 1_000,
      annualReturnPercent: 0,
    });
    // (40,000 − 10,000) / 1,000 = 30 months
    expect(r.monthsToGoal).toBe(30);
    expect(r.years).toBe(2);
    expect(r.months).toBe(6);
  });

  it("reaches the goal sooner with a positive return", () => {
    const noReturn = calculateSavings({
      targetAmount: 40_000,
      currentSavings: 0,
      monthlyContribution: 1_000,
      annualReturnPercent: 0,
    });
    const withReturn = calculateSavings({
      targetAmount: 40_000,
      currentSavings: 0,
      monthlyContribution: 1_000,
      annualReturnPercent: 5,
    });
    expect(withReturn.monthsToGoal!).toBeLessThanOrEqual(noReturn.monthsToGoal!);
  });

  it("flags a goal already met", () => {
    const r = calculateSavings({
      targetAmount: 40_000,
      currentSavings: 50_000,
      monthlyContribution: 0,
    });
    expect(r.alreadyMet).toBe(true);
    expect(r.monthsToGoal).toBe(0);
  });

  it("returns null months when the goal is unreachable", () => {
    const r = calculateSavings({
      targetAmount: 40_000,
      currentSavings: 0,
      monthlyContribution: 0,
      annualReturnPercent: 0,
    });
    expect(r.monthsToGoal).toBeNull();
  });

  it("suggests a 5-year contribution amount", () => {
    const r = calculateSavings({
      targetAmount: 60_000,
      currentSavings: 0,
      monthlyContribution: 0,
    });
    // 60,000 / 60 months = 1,000
    expect(r.requiredMonthlyForFiveYears).toBeCloseTo(1_000, 0);
  });
});
