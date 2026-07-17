import { describe, it, expect } from "vitest";
import { canadianMonthlyRate, monthlyPayment, buildYearlySchedule, calculate } from "./mortgage";
import { normalizeCalculatorInput } from "./schema";
import type { EngineInput } from "./types";

/**
 * These tests pin the engine to hand-verifiable reference values. The headline
 * case ($500,000 principal at 5% over 25 years) is the widely published
 * Canadian benchmark of ≈ $2,908.02/month, which validates the semi-annual
 * compounding convention end to end.
 */

const baseInput: EngineInput = {
  homePrice: 500_000,
  downPaymentAmount: 0,
  annualInterestRatePercent: 5,
  amortizationYears: 25,
  annualPropertyTax: 0,
  annualHomeInsurance: 0,
  monthlyUtilities: 0,
  monthlyCondoFees: 0,
};

describe("canadianMonthlyRate", () => {
  it("converts 5% semi-annual to the effective monthly rate", () => {
    expect(canadianMonthlyRate(5)).toBeCloseTo(0.0041239155, 10);
  });

  it("returns 0 for a 0% rate", () => {
    expect(canadianMonthlyRate(0)).toBe(0);
  });

  it("returns 0 for negative or non-finite input", () => {
    expect(canadianMonthlyRate(-3)).toBe(0);
    expect(canadianMonthlyRate(NaN)).toBe(0);
  });

  it("is monotonic — a higher annual rate yields a higher monthly rate", () => {
    expect(canadianMonthlyRate(6)).toBeGreaterThan(canadianMonthlyRate(5));
  });
});

describe("monthlyPayment", () => {
  it("matches the $500k / 5% / 25yr Canadian benchmark", () => {
    const rate = canadianMonthlyRate(5);
    expect(monthlyPayment(500_000, rate, 300)).toBeCloseTo(2908.0249, 4);
  });

  it("handles the zero-interest case as straight-line repayment", () => {
    expect(monthlyPayment(300_000, 0, 300)).toBe(1000);
  });

  it("returns 0 when the principal is 0 (100% down payment)", () => {
    expect(monthlyPayment(0, canadianMonthlyRate(5), 300)).toBe(0);
  });

  it("returns 0 when there are no payments", () => {
    expect(monthlyPayment(100_000, 0.004, 0)).toBe(0);
  });
});

describe("buildYearlySchedule", () => {
  it("produces one row per year", () => {
    const rate = canadianMonthlyRate(5);
    const payment = monthlyPayment(500_000, rate, 300);
    const schedule = buildYearlySchedule(500_000, rate, 25, payment);
    expect(schedule).toHaveLength(25);
    expect(schedule[0]?.year).toBe(1);
    expect(schedule[24]?.year).toBe(25);
  });

  it("pays the loan off — final balance is exactly 0", () => {
    const rate = canadianMonthlyRate(5);
    const payment = monthlyPayment(500_000, rate, 300);
    const schedule = buildYearlySchedule(500_000, rate, 25, payment);
    expect(schedule[24]?.endingBalance).toBe(0);
  });

  it("has a monotonically decreasing balance", () => {
    const rate = canadianMonthlyRate(5);
    const payment = monthlyPayment(500_000, rate, 300);
    const schedule = buildYearlySchedule(500_000, rate, 25, payment);
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i]!.endingBalance).toBeLessThanOrEqual(schedule[i - 1]!.endingBalance);
    }
  });

  it("shifts from mostly-interest to mostly-principal over time", () => {
    const rate = canadianMonthlyRate(5);
    const payment = monthlyPayment(500_000, rate, 300);
    const schedule = buildYearlySchedule(500_000, rate, 25, payment);
    // Early years are interest-heavy; late years are principal-heavy.
    expect(schedule[0]!.interestPaid).toBeGreaterThan(schedule[0]!.principalPaid);
    expect(schedule[24]!.principalPaid).toBeGreaterThan(schedule[24]!.interestPaid);
  });

  it("has cumulative principal equal to the original principal at payoff", () => {
    const rate = canadianMonthlyRate(5);
    const payment = monthlyPayment(500_000, rate, 300);
    const schedule = buildYearlySchedule(500_000, rate, 25, payment);
    expect(schedule[24]!.cumulativePrincipal).toBeCloseTo(500_000, 2);
  });

  it("zero-interest schedule repays principal linearly", () => {
    const schedule = buildYearlySchedule(300_000, 0, 25, 1000);
    expect(schedule[0]?.interestPaid).toBe(0);
    expect(schedule[0]?.principalPaid).toBe(12_000);
    expect(schedule[24]?.endingBalance).toBe(0);
  });
});

describe("calculate", () => {
  it("computes the headline monthly payment and totals", () => {
    const result = calculate(baseInput);
    expect(result.principal).toBe(500_000);
    expect(result.monthlyMortgagePayment).toBeCloseTo(2908.02, 2);
    expect(result.numberOfPayments).toBe(300);
    // total paid ≈ payment × 300; interest = total − principal
    expect(result.totalPaid).toBeCloseTo(2908.0249 * 300, 0);
    expect(result.totalInterest).toBeCloseTo(result.totalPaid - result.principal, 2);
  });

  it("rolls annual costs into monthly and sums the total housing cost", () => {
    const result = calculate({
      ...baseInput,
      annualPropertyTax: 4_200,
      annualHomeInsurance: 1_500,
      monthlyUtilities: 250,
      monthlyCondoFees: 100,
    });
    expect(result.monthlyPropertyTax).toBe(350); // 4200 / 12
    expect(result.monthlyInsurance).toBe(125); // 1500 / 12
    expect(result.totalMonthlyCost).toBeCloseTo(
      result.monthlyMortgagePayment + 350 + 125 + 250 + 100,
      2,
    );
  });

  it("handles a 100% down payment (no mortgage)", () => {
    const result = calculate({ ...baseInput, downPaymentAmount: 500_000 });
    expect(result.principal).toBe(0);
    expect(result.monthlyMortgagePayment).toBe(0);
    expect(result.totalInterest).toBe(0);
    expect(result.schedule[24]?.endingBalance).toBe(0);
  });

  it("computes the down payment ratio", () => {
    const result = calculate({ ...baseInput, homePrice: 500_000, downPaymentAmount: 100_000 });
    expect(result.downPaymentRatio).toBeCloseTo(0.2, 10);
    expect(result.principal).toBe(400_000);
  });

  it("normalizes a percentage down payment before calculating", () => {
    const engineInput = normalizeCalculatorInput({
      homePrice: 650_000,
      downPaymentType: "percent",
      downPaymentValue: 20,
      annualInterestRatePercent: 5.25,
      amortizationYears: 25,
      annualPropertyTax: 0,
      annualHomeInsurance: 0,
      monthlyUtilities: 0,
      monthlyCondoFees: 0,
    });
    const result = calculate(engineInput);
    expect(result.downPaymentAmount).toBe(130_000);
    expect(result.principal).toBe(520_000);
    expect(result.monthlyMortgagePayment).toBeCloseTo(3098.77, 2);
  });

  it("is deterministic — same input, same output", () => {
    expect(calculate(baseInput)).toEqual(calculate(baseInput));
  });
});
