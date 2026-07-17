import { describe, it, expect } from "vitest";
import { POST, GET } from "./route";
import { DEFAULT_INPUT } from "@/lib/engine/schema";

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/calculate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/calculate", () => {
  it("returns a calculation result for valid input", async () => {
    const res = await POST(postRequest(DEFAULT_INPUT));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.result.principal).toBe(520_000);
    expect(json.result.monthlyMortgagePayment).toBeGreaterThan(0);
    expect(json.result.schedule).toHaveLength(25);
  });

  it("returns 422 with field errors for invalid input", async () => {
    const res = await POST(postRequest({ ...DEFAULT_INPUT, homePrice: -5 }));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe("Validation failed.");
    expect(json.fieldErrors.homePrice).toBeDefined();
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await POST(postRequest("{not json"));
    expect(res.status).toBe(400);
  });

  it("rejects a down payment exceeding the home price", async () => {
    const res = await POST(
      postRequest({ ...DEFAULT_INPUT, downPaymentType: "dollar", downPaymentValue: 5_000_000 }),
    );
    expect(res.status).toBe(422);
  });

  it("rejects GET with 405", async () => {
    const res = GET();
    expect(res.status).toBe(405);
  });
});
