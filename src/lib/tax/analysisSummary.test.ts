import { describe, it, expect } from "vitest";
import { buildAnalysisSummary } from "./analysisSummary";
import { analyzeProfile, DEMO_PROFILE, COUPLE_DEMO } from "./profile";

describe("buildAnalysisSummary", () => {
  it("keeps the single-mode block unchanged (guards the DEMO take-home)", () => {
    const text = buildAnalysisSummary(DEMO_PROFILE, analyzeProfile(DEMO_PROFILE));
    expect(text).toContain("INCOME & TAX");
    expect(text).not.toContain("HOUSEHOLD INCOME & TAX");
    expect(text).not.toContain("PER PARTNER");
    // The DEMO monthly take-home must never silently drift.
    expect(text).toContain("$11,808.08");
    expect(text).toContain("Marginal tax rate:");
  });

  it("switches to household + per-partner blocks in couple mode", () => {
    const text = buildAnalysisSummary(COUPLE_DEMO, analyzeProfile(COUPLE_DEMO));
    expect(text).toContain("HOUSEHOLD INCOME & TAX");
    expect(text).toContain("PER PARTNER");
    expect(text).toContain("$18,328.28"); // household monthly take-home
    expect(text).toContain("Partner 1 take-home:");
    expect(text).toContain("Partner 2 take-home:");
    expect(text).toContain("Combined income used:");
  });
});
