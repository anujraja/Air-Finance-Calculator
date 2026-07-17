"use client";

/**
 * Renders the results for one scenario, handling every state honestly:
 * - client validation errors → a notice pointing back to the form
 * - network/service error → an error card
 * - first-load loading → a skeleton
 * - loading with a prior result → the prior result with a subtle "updating" cue
 * - success → full results (summary, breakdown, chart)
 */

import type { CalculationState } from "@/lib/useCalculation";
import { ResultsSummary } from "./ResultsSummary";
import { MonthlyBreakdown } from "./MonthlyBreakdown";
import { AmortizationChart } from "./AmortizationChart";

function Skeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-hidden>
      <div className="h-24 rounded-xl bg-surface-2" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-surface-2" />
        ))}
      </div>
      <div className="h-40 rounded-xl bg-surface-2" />
    </div>
  );
}

export function ResultsPanel({ state }: { state: CalculationState }) {
  const { status, result, hasClientErrors, errorMessage } = state;

  if (hasClientErrors && !result) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong bg-surface-2 px-4 py-10 text-center">
        <p className="text-sm text-ink-soft">
          Enter valid values to see results. Highlighted fields need attention.
        </p>
      </div>
    );
  }

  if (errorMessage && !result) {
    return (
      <div role="alert" className="rounded-xl border border-danger/40 bg-danger-soft px-4 py-8 text-center">
        <p className="text-sm font-medium text-danger">{errorMessage}</p>
      </div>
    );
  }

  if (status === "loading" && !result) {
    return <Skeleton />;
  }

  if (!result) {
    return <Skeleton />;
  }

  return (
    <div className="relative flex flex-col gap-8">
      {(status === "loading" || hasClientErrors) && (
        <span
          className="absolute right-0 top-0 text-xs font-medium text-ink-faint"
          aria-live="polite"
        >
          {hasClientErrors ? "Showing last valid result" : "Updating…"}
        </span>
      )}
      <ResultsSummary result={result} />
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Where your monthly cost goes
        </h3>
        <MonthlyBreakdown result={result} />
      </div>
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Mortgage balance over time
        </h3>
        <AmortizationChart result={result} />
      </div>
    </div>
  );
}
