"use client";

/**
 * Generic horizontal stacked bar with an itemized legend. Reused by the tax and
 * cost breakdowns so every distribution reads the same way.
 */

import { formatCAD, formatPercent } from "@/lib/engine/format";

export interface BarSegment {
  key: string;
  label: string;
  amount: number;
  color: string;
}

export function StatBar({ segments, ariaLabel }: { segments: BarSegment[]; ariaLabel: string }) {
  const visible = segments.filter((s) => s.amount > 0);
  const total = visible.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex h-4 w-full overflow-hidden rounded-full bg-surface-2 shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)] ring-1 ring-inset ring-line"
        role="img"
        aria-label={ariaLabel}
      >
        {visible.map((s) => (
          <div
            key={s.key}
            className="h-full transition-[width] duration-500 ease-out first:rounded-l-full last:rounded-r-full [box-shadow:inset_-1px_0_0_rgba(255,255,255,0.35)] last:shadow-none"
            style={{ width: `${total > 0 ? (s.amount / total) * 100 : 0}%`, backgroundColor: s.color }}
          />
        ))}
      </div>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
        {visible.map((s) => (
          <div
            key={s.key}
            className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-surface-2"
          >
            <dt className="flex items-center gap-2.5 text-ink-soft">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[3px] ring-2 ring-inset ring-white/25"
                style={{ backgroundColor: s.color }}
                aria-hidden
              />
              {s.label}
            </dt>
            <dd className="font-mono tabular-nums text-ink">
              {formatCAD(s.amount)}
              <span className="ml-1.5 text-xs font-medium text-ink-faint">
                {formatPercent(total > 0 ? s.amount / total : 0)}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
