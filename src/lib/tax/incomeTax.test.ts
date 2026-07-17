import { describe, it, expect } from "vitest";
import {
  calculateIncomeTax,
  bracketTax,
  federalBPA,
  ontarioHealthPremium,
  computeCpp,
  computeEi,
} from "./incomeTax";
import { FEDERAL_BRACKETS_2026 } from "./constants";

const zero = {
  employmentIncome: 0,
  selfEmploymentIncome: 0,
  otherIncome: 0,
  rrspDeduction: 0,
  otherDeductions: 0,
};

describe("bracketTax", () => {
  it("is 0 at or below 0 income", () => {
    expect(bracketTax(FEDERAL_BRACKETS_2026, 0)).toBe(0);
    expect(bracketTax(FEDERAL_BRACKETS_2026, -100)).toBe(0);
  });
  it("taxes only within each band", () => {
    // $58,523 at 14% = $8,193.22
    expect(bracketTax(FEDERAL_BRACKETS_2026, 58_523)).toBeCloseTo(8193.22, 2);
  });
});

describe("federalBPA phase-out", () => {
  it("is the full amount below the phase-out", () => {
    expect(federalBPA(100_000)).toBe(16_452);
  });
  it("is the reduced amount above the phase-out", () => {
    expect(federalBPA(300_000)).toBe(14_829);
  });
  it("interpolates within the phase-out band", () => {
    const mid = federalBPA((181_440 + 258_482) / 2);
    expect(mid).toBeCloseTo((16_452 + 14_829) / 2, 2);
  });
});

describe("ontarioHealthPremium", () => {
  it("is 0 under $20,000", () => {
    expect(ontarioHealthPremium(19_000)).toBe(0);
  });
  it("caps at $750 for mid-high incomes", () => {
    expect(ontarioHealthPremium(100_000)).toBe(750);
  });
  it("caps at $900 for very high incomes", () => {
    expect(ontarioHealthPremium(300_000)).toBe(900);
  });
});

describe("computeCpp", () => {
  it("hits the 2026 employee maximum at high employment income", () => {
    const cpp = computeCpp(100_000, 0);
    expect(cpp.total).toBeCloseTo(4646.45, 2); // 4230.45 base + 416 CPP2
  });
  it("doubles the contribution for self-employment", () => {
    const cpp = computeCpp(0, 100_000);
    expect(cpp.total).toBeCloseTo(9292.9, 2);
  });
  it("returns nothing below the basic exemption", () => {
    expect(computeCpp(3_000, 0).total).toBe(0);
  });
});

describe("computeEi", () => {
  it("hits the 2026 maximum premium", () => {
    expect(computeEi(100_000)).toBeCloseTo(1123.07, 2);
  });
  it("is 0 for no employment income", () => {
    expect(computeEi(0)).toBe(0);
  });
});

describe("calculateIncomeTax — reference cases (Ontario 2026)", () => {
  it("$0 income → no tax", () => {
    const r = calculateIncomeTax(zero);
    expect(r.totalIncomeTax).toBe(0);
    expect(r.afterTaxIncome).toBe(0);
  });

  it("$100,000 T4 employment", () => {
    const r = calculateIncomeTax({ ...zero, employmentIncome: 100_000 });
    expect(r.cpp).toBeCloseTo(4646.45, 2);
    expect(r.ei).toBeCloseTo(1123.07, 2);
    expect(r.federalTax).toBeCloseTo(13_511.74, 0);
    expect(r.ontarioTax).toBeCloseTo(6_722.75, 0);
    expect(r.totalIncomeTax).toBeCloseTo(20_234.49, 0);
    expect(r.afterTaxIncome).toBeCloseTo(73_995.99, 0);
    expect(r.averageTaxRate).toBeCloseTo(0.2023, 3);
    // Marginal: 20.5% fed + 9.15% ON + 1.83% surtax ≈ 31.5%
    expect(r.marginalTaxRate).toBeCloseTo(0.3148, 3);
  });

  it("$60,000 T4 employment", () => {
    const r = calculateIncomeTax({ ...zero, employmentIncome: 60_000 });
    expect(r.afterTaxIncome).toBeCloseTo(47_129.61, 0);
    expect(r.ontarioSurtax).toBe(0);
  });

  it("$80,000 self-employment pays both CPP halves and no EI", () => {
    const r = calculateIncomeTax({ ...zero, selfEmploymentIncome: 80_000 });
    expect(r.cpp).toBeCloseTo(8892.9, 2);
    expect(r.ei).toBe(0);
    expect(r.afterTaxIncome).toBeCloseTo(57_873.53, 0);
  });

  it("$250,000 T4 triggers the Ontario surtax and $900 health premium", () => {
    const r = calculateIncomeTax({ ...zero, employmentIncome: 250_000 });
    expect(r.ontarioSurtax).toBeGreaterThan(0);
    expect(r.ontarioHealthPremium).toBe(900);
    expect(r.afterTaxIncome).toBeCloseTo(156_335.09, 0);
    expect(r.averageTaxRate).toBeCloseTo(0.3516, 3);
  });

  it("RRSP deduction lowers tax", () => {
    const without = calculateIncomeTax({ ...zero, employmentIncome: 100_000 });
    const withRrsp = calculateIncomeTax({ ...zero, employmentIncome: 100_000, rrspDeduction: 10_000 });
    expect(withRrsp.totalIncomeTax).toBeLessThan(without.totalIncomeTax);
  });

  it("combines employment + self-employment + other income", () => {
    const r = calculateIncomeTax({
      ...zero,
      employmentIncome: 50_000,
      selfEmploymentIncome: 30_000,
      otherIncome: 5_000,
    });
    expect(r.grossIncome).toBe(85_000);
    expect(r.afterTaxIncome).toBeLessThan(85_000);
    expect(r.afterTaxIncome).toBeGreaterThan(55_000);
  });
});
