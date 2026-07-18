"use client";

import type { AffordabilityResult } from "@/lib/tax/affordability";
import { formatCAD, formatCADWhole } from "@/lib/engine/format";
import { InfoTip } from "@/components/InfoTip";

export function AffordabilityCard({
  result,
  targetHomePrice,
}: {
  result: AffordabilityResult;
  targetHomePrice: number;
}) {
  const canAfford = targetHomePrice <= result.maxHomePrice;
  const gap = Math.abs(targetHomePrice - result.maxHomePrice);

  return (
    <div className="flex flex-col gap-5">
      <div className="relative overflow-hidden rounded-xl border border-accent/20 bg-gradient-to-br from-accent-soft/70 to-accent-soft/30 p-5 shadow-[var(--shadow-sm)] after:pointer-events-none after:absolute after:-right-10 after:-top-12 after:h-40 after:w-40 after:rounded-full after:bg-accent/10 after:blur-2xl">
        <p className="relative flex items-center text-xs font-semibold uppercase tracking-wide text-accent-ink">
          Maximum home price you likely qualify for
          <InfoTip label="maximum home price">
            Based on lender GDS/TDS ratios and the federal stress test (qualifying at{" "}
            {result.qualifyingRate}%). Your actual approval depends on the lender and credit.
          </InfoTip>
        </p>
        <p data-testid="max-home-price" className="relative mt-1 font-mono text-4xl font-semibold tracking-tight tabular-nums text-accent-ink sm:text-5xl">
          {formatCADWhole(result.maxHomePrice)}
        </p>
        <p className="relative mt-1.5 text-xs text-accent-ink/70">
          with a {formatCADWhole(result.maxMortgage)} mortgage · qualifying at {result.qualifyingRate}%
        </p>
      </div>

      <div
        className={`rounded-lg border px-4 py-3 text-sm font-medium ${
          canAfford
            ? "border-accent/30 bg-accent-soft/40 text-accent-ink"
            : "border-danger/30 bg-danger-soft text-danger"
        }`}
      >
        {canAfford
          ? `Your ${formatCADWhole(targetHomePrice)} target is within reach — about ${formatCADWhole(gap)} of headroom.`
          : `Your ${formatCADWhole(targetHomePrice)} target is about ${formatCADWhole(gap)} above what you'd qualify for today.`}
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-line bg-surface-2/50 p-3 transition-colors hover:border-line-strong">
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Max monthly housing</dt>
          <dd className="mt-1 font-mono text-lg tabular-nums text-ink">{formatCAD(result.maxMonthlyHousing)}</dd>
        </div>
        <div className="rounded-lg border border-line bg-surface-2/50 p-3 transition-colors hover:border-line-strong">
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Max mortgage payment</dt>
          <dd className="mt-1 font-mono text-lg tabular-nums text-ink">{formatCAD(result.maxMonthlyMortgage)}</dd>
        </div>
        <div className="rounded-lg border border-line bg-surface-2/50 p-3 transition-colors hover:border-line-strong">
          <dt className="flex items-center text-xs font-medium uppercase tracking-wide text-ink-faint">
            Limited by
            <InfoTip label="GDS and TDS">
              GDS caps housing costs at 39% of gross income; TDS caps all debt payments at 44%.
              The lower limit governs.
            </InfoTip>
          </dt>
          <dd className="mt-1 text-lg text-ink">
            {result.limitedBy === "GDS" ? "Housing costs (GDS)" : "Total debts (TDS)"}
          </dd>
        </div>
        <div className="rounded-lg border border-line bg-surface-2/50 p-3 transition-colors hover:border-line-strong">
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Qualifying rate</dt>
          <dd className="mt-1 font-mono text-lg tabular-nums text-ink">{result.qualifyingRate}%</dd>
        </div>
      </dl>
    </div>
  );
}
