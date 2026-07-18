/**
 * Serverless analysis endpoint. `POST /api/analyze` validates a full financial
 * profile with the shared Zod schema and returns the combined analysis (income
 * tax, affordability, savings, mortgage, and optional corporate tax).
 * Vercel-compatible; runs on the default Node runtime.
 */

import { NextResponse } from "next/server";
import { profileSchema, analyzeProfile } from "@/lib/tax/profile";

const MAX_BODY_BYTES = 8_192;

export async function POST(request: Request): Promise<NextResponse> {
  // Read the raw body and enforce the size cap on the actual bytes, so a
  // chunked request without a content-length header can't bypass the limit.
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    return NextResponse.json({ analysis: analyzeProfile(parsed.data) });
  } catch {
    return NextResponse.json({ error: "Unable to complete the analysis." }, { status: 500 });
  }
}

export function GET(): NextResponse {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 });
}
