/**
 * Serverless calculation endpoint.
 *
 * `POST /api/calculate` validates the request body with the shared Zod schema,
 * normalizes it, and returns the full calculation result. Validation lives on
 * the server as well as the client so the engine can never receive unsafe input
 * regardless of how the endpoint is called. Vercel-compatible (Edge-safe pure
 * compute, but runs on the default Node runtime).
 */

import { NextResponse } from "next/server";
import { calculatorInputSchema, normalizeCalculatorInput } from "@/lib/engine/schema";
import { calculate } from "@/lib/engine/mortgage";

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = calculatorInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        // Flattened field errors are safe to surface to the client.
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const result = calculate(normalizeCalculatorInput(parsed.data));
  return NextResponse.json({ result });
}

/** Reject non-POST methods explicitly for a clearer client contract. */
export function GET(): NextResponse {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 },
  );
}
