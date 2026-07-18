"use client";

import type { CorporateTaxResult } from "@/lib/tax/corporate";
import { formatCAD, formatPercent } from "@/lib/engine/format";

export function CorporateCard({ result }: { result: CorporateTaxResult }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface-2/50 p-3 transition-colors hover:border-line-strong">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Active income</p>
          <p className="mt-1 font-mono text-xl font-semibold tracking-tight tabular-nums text-ink">
            {formatCAD(result.activeBusinessIncome)}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface-2/50 p-3 transition-colors hover:border-line-strong">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Corporate tax</p>
          <p className="mt-1 font-mono text-xl font-semibold tracking-tight tabular-nums text-ink">
            {formatCAD(result.totalCorporateTax)}
          </p>
        </div>
        <div className="col-span-2 rounded-lg border border-accent/20 bg-accent-soft/40 p-3 sm:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-accent-ink/70">Effective rate</p>
          <p className="mt-1 font-mono text-xl font-semibold tracking-tight tabular-nums text-accent-ink">
            {formatPercent(result.averageRate)}
          </p>
        </div>
      </div>
      <p className="rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm leading-relaxed text-ink-soft">
        Retained in the corporation after tax:{" "}
        <span className="font-mono font-semibold text-ink">{formatCAD(result.afterTaxRetained)}</span>.
        Small-business income (first $500k) is taxed at 11.2%; income above that at the 26.5% general
        rate. Paying yourself a salary or dividends is taxed separately in your personal return.
      </p>
    </div>
  );
}
