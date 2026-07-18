import { describe, it, expect } from "vitest";
import { POST, GET } from "./route";
import { DEFAULT_PROFILE, COUPLE_DEMO } from "@/lib/tax/profile";

function req(body: unknown): Request {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/analyze", () => {
  it("returns a full analysis for a valid profile", async () => {
    const res = await POST(req(DEFAULT_PROFILE));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.analysis.incomeTax.afterTaxIncome).toBeGreaterThan(0);
    expect(json.analysis.affordability.maxHomePrice).toBeGreaterThan(0);
    expect(json.analysis.mortgage.monthlyMortgagePayment).toBeGreaterThan(0);
  });

  it("returns household + partner analysis for a couple profile", async () => {
    const res = await POST(req(COUPLE_DEMO));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.analysis.partnerIncomeTax).toBeTruthy();
    expect(json.analysis.household.grossIncome).toBe(300_000);
    expect(json.analysis.household.afterTaxIncome).toBeCloseTo(219939.38, 2);
    expect(json.analysis.affordability.maxHomePrice).toBeGreaterThan(1_000_000);
  });

  it("returns a null partner analysis for a single profile", async () => {
    const res = await POST(req(DEFAULT_PROFILE));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.analysis.partnerIncomeTax).toBeNull();
    expect(json.analysis.household.grossIncome).toBe(json.analysis.incomeTax.grossIncome);
  });

  it("returns 422 for invalid input", async () => {
    const res = await POST(req({ ...DEFAULT_PROFILE, employmentIncome: -1 }));
    expect(res.status).toBe(422);
  });

  it("returns 400 for malformed JSON", async () => {
    expect((await POST(req("{bad"))).status).toBe(400);
  });

  it("rejects GET with 405", () => {
    expect(GET().status).toBe(405);
  });
});
