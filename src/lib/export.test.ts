import { describe, it, expect } from "vitest";
import {
  csvEscape,
  rowsToCsv,
  buildAnalysisRows,
  buildAnalysisCsv,
  analysisCsvFilename,
  type CsvRow,
} from "./export";
import { analyzeProfile, DEMO_PROFILE, DEFAULT_PROFILE, COUPLE_DEMO } from "@/lib/tax/profile";

describe("csvEscape", () => {
  it("passes a plain string through unchanged", () => {
    expect(csvEscape("Ontario 2026")).toBe("Ontario 2026");
  });

  it("quotes a field containing a comma", () => {
    expect(csvEscape("a,b")).toBe('"a,b"');
  });

  it("doubles and wraps an embedded quote", () => {
    expect(csvEscape('he said "hi"')).toBe('"he said ""hi"""');
  });

  it("quotes a field containing a newline", () => {
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
  });

  it("passes a number through as its string form", () => {
    expect(csvEscape(1234.56)).toBe("1234.56");
  });
});

describe("rowsToCsv", () => {
  const rows: CsvRow[] = [
    { section: "Report", label: "Jurisdiction", value: "Ontario 2026" },
    { section: "Income & tax", label: "Take-home (month)", value: 11808.08 },
  ];

  it("starts with the fixed header row", () => {
    expect(rowsToCsv(rows).split("\n")[0]).toBe("Section,Metric,Value");
  });

  it("ends with a trailing newline", () => {
    expect(rowsToCsv(rows).endsWith("\n")).toBe(true);
  });

  it("emits one line per row plus the header (and trailing newline)", () => {
    // header + 2 rows + trailing "" after the final \n
    expect(rowsToCsv(rows).split("\n")).toHaveLength(rows.length + 2);
  });
});

describe("buildAnalysisRows / buildAnalysisCsv (single-person, DEMO_PROFILE)", () => {
  const analysis = analyzeProfile(DEMO_PROFILE);
  const csv = buildAnalysisCsv(DEMO_PROFILE, analysis);

  it("emits the home price as a raw number (no $ or thousands separators)", () => {
    expect(csv).toContain("Profile inputs,Home price,900000");
  });

  it("pins the DEMO take-home so export can never drift the demo numbers", () => {
    // Guards the hard constraint: matches the e2e take-home assertion.
    expect(analysis.incomeTax.monthlyAfterTax).toBe(11808.08);
    expect(csv).toContain("Income & tax,Take-home (month),11808.08");
  });

  it("emits the Business (corporate) block (DEMO has business income)", () => {
    expect(csv).toContain("Business (corporate)");
  });

  it("never contains display formatting ($, %, or thousands separators)", () => {
    expect(csv).not.toContain("$");
    expect(csv).not.toContain("%,"); // no percent-formatted value cells
    expect(csv).not.toContain("900,000");
  });

  it("labels ratios and keeps them as 0–1 decimals", () => {
    const rows = buildAnalysisRows(DEMO_PROFILE, analysis);
    const avg = rows.find(
      (r) => r.section === "Income & tax" && r.label === "Average tax rate (ratio 0–1)",
    );
    expect(avg).toBeDefined();
    expect(Number(avg!.value)).toBeGreaterThan(0);
    expect(Number(avg!.value)).toBeLessThan(1);
  });

  it("stays single-mode: no Partner rows", () => {
    expect(csv).not.toContain("Partner");
  });
});

describe("buildAnalysisRows (DEFAULT_PROFILE — no corporate)", () => {
  it("omits the Business (corporate) block when there is no business income", () => {
    expect(DEFAULT_PROFILE.businessIncome).toBe(0);
    const csv = buildAnalysisCsv(DEFAULT_PROFILE, analyzeProfile(DEFAULT_PROFILE));
    expect(csv).not.toContain("Business (corporate)");
  });
});

describe("buildAnalysisCsv (couple mode, COUPLE_DEMO)", () => {
  const analysis = analyzeProfile(COUPLE_DEMO);
  const csv = buildAnalysisCsv(COUPLE_DEMO, analysis);

  it("emits per-partner income-tax sections", () => {
    expect(csv).toContain("Income & tax — Partner 1,Take-home (month),");
    expect(csv).toContain("Income & tax — Partner 2,Take-home (month),");
  });

  it("emits a household summary with the combined take-home", () => {
    expect(csv).toContain(
      `Income & tax — Household,Household take-home (month),${analysis.household.monthlyAfterTax}`,
    );
  });

  it("includes Partner 2 profile inputs", () => {
    expect(csv).toContain(
      `Profile inputs,Partner 2 employment income,${COUPLE_DEMO.partnerEmploymentIncome}`,
    );
  });

  it("keeps affordability at the household level (a single Affordability block)", () => {
    const rows = buildAnalysisRows(COUPLE_DEMO, analysis);
    const sections = new Set(rows.filter((r) => r.value !== undefined).map((r) => r.section));
    expect(sections.has("Affordability")).toBe(true);
    expect([...sections].filter((s) => s.startsWith("Affordability"))).toHaveLength(1);
  });
});

describe("analysisCsvFilename", () => {
  it("uses a dated, stable name", () => {
    expect(analysisCsvFilename(new Date("2026-07-18T12:00:00"))).toBe(
      "homecost-canada-analysis-2026-07-18.csv",
    );
  });

  it("ends with .csv", () => {
    expect(analysisCsvFilename().endsWith(".csv")).toBe(true);
  });
});
