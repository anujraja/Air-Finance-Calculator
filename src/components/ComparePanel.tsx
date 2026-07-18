"use client";

/**
 * Scenario A vs B comparison. Leads with a plain-language verdict, then a clear
 * three-column table (A · B · Difference) for the figures that matter, with the
 * cheaper side highlighted so the takeaway is unmistakable.
 */

import type { CalculationResult } from "@/lib/engine/types";
import type { ScenarioComparison } from "@/lib/engine/compare";
import { formatCAD, formatSignedCAD } from "@/lib/engine/format";

interface Row {
  label: string;
  a: number;
  b: number;
  delta: number;
  /** Lower is better for cost rows. */
  testId?: string;
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
  const rows: Row[] = [
    {
      label: "Monthly housing cost",
      a: resultA.totalMonthlyCost,
      b: resultB.totalMonthlyCost,
      delta: comparison.monthlyCostDelta,
      testId: "delta-monthly",
    },
    {
      label: "Mortgage payment",
      a: resultA.monthlyMortgagePayment,
      b: resultB.monthlyMortgagePayment,
      delta: comparison.monthlyPaymentDelta,
    },
    {
      label: "Total interest",
      a: resultA.totalInterest,
      b: resultB.totalInterest,
      delta: comparison.totalInterestDelta,
      testId: "delta-interest",
    },
    {
      label: "Total amount paid",
      a: resultA.totalPaid,
      b: resultB.totalPaid,
      delta: comparison.totalPaidDelta,
      testId: "delta-total",
    },
  ];

  const winner = comparison.cheaperLifetime;
  const verdict =
    winner === null
      ? "Both scenarios cost the same over the amortization period."
      : `Scenario ${winner} saves ${formatCAD(Math.abs(comparison.totalPaidDelta))} over the life of the mortgage`;

  return (
    <div className="flex flex-col gap-5">
      {/* Verdict banner */}
      <div className="relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-accent-soft/80 to-accent-soft/30 px-5 py-4 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:justify-between">
        <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-accent" />
        <p className="text-base font-semibold text-accent-ink" data-testid="compare-verdict">
          {verdict}
          {winner !== null ? "." : ""}
        </p>
        {winner !== null && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white shadow-[var(--shadow-sm)]">
            Scenario {winner} wins
          </span>
        )}
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="py-2 pr-4 font-medium text-ink-faint"> </th>
              <th scope="col" className="px-3 py-2 text-right font-semibold text-ink">
                <span className="inline-flex items-center gap-1.5">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] font-semibold text-white shadow-[var(--shadow-sm)]">A</span>
                  Scenario A
                </span>
              </th>
              <th scope="col" className="px-3 py-2 text-right font-semibold text-ink">
                <span className="inline-flex items-center gap-1.5">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-gold-soft text-[11px] font-semibold text-gold ring-1 ring-gold/25">B</span>
                  Scenario B
                </span>
              </th>
              <th scope="col" className="pl-3 py-2 text-right font-semibold text-ink">Difference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const aWins = row.delta > 0; // B − A > 0 → A is lower/cheaper
              const bWins = row.delta < 0;
              return (
                <tr key={row.label} className="border-b border-line/60 transition-colors hover:bg-surface-2/60">
                  <th scope="row" className="py-3 pr-4 text-left font-medium text-ink-soft">
                    {row.label}
                  </th>
                  <td
                    className={`px-3 py-3 text-right font-mono tabular-nums ${
                      aWins ? "font-semibold text-accent" : "text-ink"
                    }`}
                  >
                    {formatCAD(row.a)}
                  </td>
                  <td
                    className={`px-3 py-3 text-right font-mono tabular-nums ${
                      bWins ? "font-semibold text-accent" : "text-ink"
                    }`}
                  >
                    {formatCAD(row.b)}
                  </td>
                  <td
                    data-testid={row.testId}
                    className={`pl-3 py-3 text-right font-mono tabular-nums ${
                      row.delta === 0 ? "text-ink-faint" : row.delta < 0 ? "text-accent" : "text-danger"
                    }`}
                  >
                    {row.delta === 0 ? "—" : formatSignedCAD(row.delta)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink-faint">
        Difference is Scenario B minus Scenario A. Green means Scenario B costs less;
        red means it costs more.
      </p>
    </div>
  );
}
