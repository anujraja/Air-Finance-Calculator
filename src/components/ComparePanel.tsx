"use client";

/**
 * Scenario A vs B comparison summary. Shows the monthly and lifetime
 * differences (B relative to A) and calls out which scenario is cheaper.
 * A negative delta (B costs less) is framed positively.
 */

import type { CalculationResult } from "@/lib/engine/types";
import type { ScenarioComparison } from "@/lib/engine/compare";
import { formatCAD, formatSignedCAD } from "@/lib/engine/format";

function DeltaCard({
  label,
  delta,
  testId,
}: {
  label: string;
  delta: number;
  testId?: string;
}) {
  // B cheaper (delta < 0) → positive framing; B pricier → cautionary.
  const tone = delta < 0 ? "text-accent" : delta > 0 ? "text-danger" : "text-ink-soft";
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</span>
      <span data-testid={testId} className={`font-mono text-xl font-semibold tabular-nums ${tone}`}>
        {delta === 0 ? "No change" : formatSignedCAD(delta)}
      </span>
      <span className="text-xs text-ink-faint">Scenario B vs A</span>
    </div>
  );
}

export function ComparePanel({
  resultA,
  resultB,
  comparison,
}: {
  resultA: CalculationResult;
  resultB: CalculationResult;
  comparison: ScenarioComparison;
}) {
  const verdict =
    comparison.cheaperLifetime === null
      ? "Both scenarios cost the same over the amortization period."
      : `Scenario ${comparison.cheaperLifetime} costs ${formatCAD(
          Math.abs(comparison.totalPaidDelta),
        )} less over the life of the mortgage.`;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-accent/25 bg-accent-soft/50 px-5 py-4">
        <p className="text-sm font-medium text-accent-ink" data-testid="compare-verdict">
          {verdict}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <DeltaCard label="Monthly cost" delta={comparison.monthlyCostDelta} testId="delta-monthly" />
        <DeltaCard label="Total interest" delta={comparison.totalInterestDelta} testId="delta-interest" />
        <DeltaCard label="Total paid" delta={comparison.totalPaidDelta} testId="delta-total" />
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div className="flex justify-between border-t border-line pt-2">
          <span className="text-ink-soft">A — monthly</span>
          <span className="font-mono tabular-nums text-ink">{formatCAD(resultA.totalMonthlyCost)}</span>
        </div>
        <div className="flex justify-between border-t border-line pt-2">
          <span className="text-ink-soft">B — monthly</span>
          <span className="font-mono tabular-nums text-ink">{formatCAD(resultB.totalMonthlyCost)}</span>
        </div>
      </div>
    </div>
  );
}
