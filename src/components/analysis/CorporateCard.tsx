"use client";

import type { CorporateTaxResult } from "@/lib/tax/corporate";
import { formatCAD, formatPercent } from "@/lib/engine/format";

export function CorporateCard({ result }: { result: CorporateTaxResult }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Active income</p>
          <p className="font-mono text-xl font-semibold tabular-nums text-ink">
            {formatCAD(result.activeBusinessIncome)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Corporate tax</p>
          <p className="font-mono text-xl font-semibold tabular-nums text-ink">
            {formatCAD(result.totalCorporateTax)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Effective rate</p>
          <p className="font-mono text-xl font-semibold tabular-nums text-ink">
            {formatPercent(result.averageRate)}
          </p>
        </div>
      </div>
      <p className="rounded-lg bg-surface-2 px-4 py-3 text-sm text-ink-soft">
        Retained in the corporation after tax:{" "}
        <span className="font-mono font-semibold text-ink">{formatCAD(result.afterTaxRetained)}</span>.
        Small-business income (first $500k) is taxed at 11.2%; income above that at the 26.5% general
        rate. Paying yourself a salary or dividends is taxed separately in your personal return.
      </p>
    </div>
  );
}
