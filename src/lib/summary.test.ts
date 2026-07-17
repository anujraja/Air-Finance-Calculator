import { describe, it, expect } from "vitest";
import { buildSummary } from "./summary";
import { calculate } from "@/lib/engine/mortgage";
import { compareScenarios } from "@/lib/engine/compare";
import { normalizeCalculatorInput, DEFAULT_INPUT } from "@/lib/engine/schema";

describe("buildSummary", () => {
  const inputA = DEFAULT_INPUT;
  const resultA = calculate(normalizeCalculatorInput(inputA));

  it("includes scenario A figures and the disclaimer", () => {
    const text = buildSummary({ inputA, resultA });
    expect(text).toContain("Scenario A");
    expect(text).toContain("Loan principal");
    expect(text).toContain("Educational demonstration only — not financial advice.");
    expect(text).not.toContain("Scenario B");
  });

  it("includes the comparison block when B is present", () => {
    const inputB = { ...DEFAULT_INPUT, annualInterestRatePercent: 6 };
    const resultB = calculate(normalizeCalculatorInput(inputB));
    const comparison = compareScenarios(resultA, resultB);
    const text = buildSummary({ inputA, resultA, inputB, resultB, comparison });
    expect(text).toContain("Scenario B");
    expect(text).toContain("Difference (B vs A)");
    expect(text).toContain("Lower lifetime cost:   Scenario A");
  });
});
