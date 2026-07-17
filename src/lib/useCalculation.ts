"use client";

/**
 * React hook that turns a raw input into a calculation result via the
 * serverless `/api/calculate` endpoint.
 *
 * Flow:
 * 1. Validate the input client-side with the shared Zod schema. Invalid input
 *    never hits the network — field errors surface instantly.
 * 2. Debounce valid input, then POST it to the API. The server re-validates
 *    with the same schema and returns the authoritative result.
 * 3. Stale responses are ignored via a monotonically increasing request id and
 *    an AbortController, so rapid edits can't render an out-of-date result.
 *
 * Exposes a small status machine (`idle | loading | success | error`) so the UI
 * can render loading, success, and failure states honestly.
 */

import { useEffect, useRef, useState } from "react";
import { calculatorInputSchema, type CalculatorInput } from "@/lib/engine/schema";
import type { CalculationResult } from "@/lib/engine/types";

export type CalcStatus = "idle" | "loading" | "success" | "error";

export interface FieldErrors {
  [field: string]: string[] | undefined;
}

export interface CalculationState {
  status: CalcStatus;
  result: CalculationResult | null;
  fieldErrors: FieldErrors;
  /** True while the client-side schema rejects the current input. */
  hasClientErrors: boolean;
  /** Human-readable message when the request itself failed. */
  errorMessage: string | null;
}

const DEBOUNCE_MS = 250;

export function useCalculation(input: CalculatorInput): CalculationState {
  const [state, setState] = useState<CalculationState>({
    status: "idle",
    result: null,
    fieldErrors: {},
    hasClientErrors: false,
    errorMessage: null,
  });

  const requestId = useRef(0);

  useEffect(() => {
    // 1. Client-side validation gate. Synchronous setState here is intentional:
    // this hook synchronizes React state with an external system (the API), and
    // invalid input must short-circuit before any request is made.
    const parsed = calculatorInputSchema.safeParse(input);
    if (!parsed.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState((prev) => ({
        ...prev,
        status: "error",
        fieldErrors: parsed.error.flatten().fieldErrors,
        hasClientErrors: true,
        errorMessage: null,
      }));
      return;
    }

    const id = ++requestId.current;
    const controller = new AbortController();
    setState((prev) => ({
      ...prev,
      status: "loading",
      fieldErrors: {},
      hasClientErrors: false,
      errorMessage: null,
    }));

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/calculate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsed.data),
          signal: controller.signal,
        });

        if (id !== requestId.current) return; // superseded

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setState({
            status: "error",
            result: null,
            fieldErrors: body.fieldErrors ?? {},
            hasClientErrors: false,
            errorMessage: body.error ?? "The calculation service returned an error.",
          });
          return;
        }

        const body = (await res.json()) as { result: CalculationResult };
        if (id !== requestId.current) return;
        setState({
          status: "success",
          result: body.result,
          fieldErrors: {},
          hasClientErrors: false,
          errorMessage: null,
        });
      } catch {
        if (controller.signal.aborted || id !== requestId.current) return;
        setState({
          status: "error",
          result: null,
          fieldErrors: {},
          hasClientErrors: false,
          errorMessage:
            "Could not reach the calculation service. Check your connection and try again.",
        });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [input]);

  return state;
}
