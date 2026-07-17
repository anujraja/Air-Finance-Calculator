import { describe, it, expect } from "vitest";
import { calculatorInputSchema, normalizeCalculatorInput, DEFAULT_INPUT } from "./schema";

const valid = { ...DEFAULT_INPUT };

describe("calculatorInputSchema", () => {
  it("accepts the default input", () => {
    expect(calculatorInputSchema.safeParse(valid).success).toBe(true);
  });

  it("coerces numeric strings from form fields", () => {
    const result = calculatorInputSchema.safeParse({
      ...valid,
      homePrice: "650000",
      annualInterestRatePercent: "5.25",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.homePrice).toBe(650_000);
  });

  it("rejects a negative home price", () => {
    const result = calculatorInputSchema.safeParse({ ...valid, homePrice: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects a zero home price", () => {
    expect(calculatorInputSchema.safeParse({ ...valid, homePrice: 0 }).success).toBe(false);
  });

  it("rejects an unrealistically high interest rate", () => {
    expect(calculatorInputSchema.safeParse({ ...valid, annualInterestRatePercent: 99 }).success).toBe(false);
  });

  it("rejects a negative interest rate", () => {
    expect(calculatorInputSchema.safeParse({ ...valid, annualInterestRatePercent: -1 }).success).toBe(false);
  });

  it("rejects a non-integer amortization period", () => {
    expect(calculatorInputSchema.safeParse({ ...valid, amortizationYears: 25.5 }).success).toBe(false);
  });

  it("rejects amortization beyond 40 years", () => {
    expect(calculatorInputSchema.safeParse({ ...valid, amortizationYears: 41 }).success).toBe(false);
  });

  it("rejects a down payment percentage over 100%", () => {
    const result = calculatorInputSchema.safeParse({
      ...valid,
      downPaymentType: "percent",
      downPaymentValue: 150,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a dollar down payment that exceeds the home price", () => {
    const result = calculatorInputSchema.safeParse({
      ...valid,
      downPaymentType: "dollar",
      downPaymentValue: 999_999_999,
    });
    expect(result.success).toBe(false);
  });

  it("rejects NaN / missing values", () => {
    expect(calculatorInputSchema.safeParse({ ...valid, monthlyUtilities: NaN }).success).toBe(false);
    expect(calculatorInputSchema.safeParse({ ...valid, homePrice: undefined }).success).toBe(false);
  });

  it("rejects negative recurring costs", () => {
    expect(calculatorInputSchema.safeParse({ ...valid, annualPropertyTax: -100 }).success).toBe(false);
    expect(calculatorInputSchema.safeParse({ ...valid, monthlyCondoFees: -1 }).success).toBe(false);
  });

  it("accepts a 0% interest rate (boundary)", () => {
    expect(calculatorInputSchema.safeParse({ ...valid, annualInterestRatePercent: 0 }).success).toBe(true);
  });

  it("accepts a 100% down payment (boundary)", () => {
    const result = calculatorInputSchema.safeParse({
      ...valid,
      downPaymentType: "percent",
      downPaymentValue: 100,
    });
    expect(result.success).toBe(true);
  });
});

describe("normalizeCalculatorInput", () => {
  it("resolves a percentage down payment to dollars", () => {
    const engineInput = normalizeCalculatorInput({
      ...valid,
      homePrice: 500_000,
      downPaymentType: "percent",
      downPaymentValue: 20,
    });
    expect(engineInput.downPaymentAmount).toBe(100_000);
  });

  it("passes a dollar down payment through unchanged", () => {
    const engineInput = normalizeCalculatorInput({
      ...valid,
      downPaymentType: "dollar",
      downPaymentValue: 75_000,
    });
    expect(engineInput.downPaymentAmount).toBe(75_000);
  });
});
