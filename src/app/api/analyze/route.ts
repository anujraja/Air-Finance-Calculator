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
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
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
