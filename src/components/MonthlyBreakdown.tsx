"use client";

/**
 * "Where your monthly payment goes" — a horizontal stacked bar plus an itemized
 * legend. Segments below a small threshold still appear in the legend so no
 * cost is hidden. Purely presentational; derives its parts from the result.
 */

import type { CalculationResult } from "@/lib/engine/types";
import { formatCAD, formatPercent } from "@/lib/engine/format";

interface Segment {
  key: string;
  label: string;
  amount: number;
  color: string;
}

export function MonthlyBreakdown({ result }: { result: CalculationResult }) {
  const segments: Segment[] = [
    { key: "mortgage", label: "Mortgage", amount: result.monthlyMortgagePayment, color: "var(--cat-principal)" },
    { key: "tax", label: "Property tax", amount: result.monthlyPropertyTax, color: "var(--cat-tax)" },
    { key: "insurance", label: "Insurance", amount: result.monthlyInsurance, color: "var(--cat-insurance)" },
    { key: "utilities", label: "Utilities", amount: result.monthlyUtilities, color: "var(--cat-utilities)" },
    { key: "condo", label: "Condo / maint.", amount: result.monthlyCondoFees, color: "var(--cat-condo)" },
  ].filter((s) => s.amount > 0);

  const total = result.totalMonthlyCost;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex h-4 w-full overflow-hidden rounded-full bg-surface-2 shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)] ring-1 ring-line"
        role="img"
        aria-label={`Monthly cost breakdown totalling ${formatCAD(total)}`}
      >
        {segments.map((s) => (
          <div
            key={s.key}
            className="h-full transition-[width] duration-500"
            style={{ width: `${total > 0 ? (s.amount / total) * 100 : 0}%`, backgroundColor: s.color }}
          />
        ))}
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-3 border-b border-line/50 py-1 text-sm last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
            <dt className="flex items-center gap-2 text-ink-soft">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[3px] ring-1 ring-black/5" style={{ backgroundColor: s.color }} aria-hidden />
              {s.label}
            </dt>
            <dd className="font-mono tabular-nums text-ink">
              {formatCAD(s.amount)}
              <span className="ml-1.5 text-xs text-ink-faint">
                {formatPercent(total > 0 ? s.amount / total : 0)}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
