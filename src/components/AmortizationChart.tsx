"use client";

/**
 * Yearly amortization chart: remaining mortgage balance and cumulative interest
 * over the life of the loan. Recharts is used for the visual; an equivalent
 * visually-hidden data table is rendered alongside so the information is fully
 * available to screen-reader and keyboard users.
 */

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CalculationResult } from "@/lib/engine/types";
import { formatCAD, formatCADWhole } from "@/lib/engine/format";

interface TooltipEntry {
  name?: string;
  value?: number;
  color?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: number | string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface p-3 text-xs shadow-[var(--shadow-md)]">
      <p className="mb-1 font-semibold text-ink">Year {label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center justify-between gap-4 font-mono tabular-nums">
          <span className="flex items-center gap-1.5 text-ink-soft">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden />
            {entry.name}
          </span>
          <span className="text-ink">{formatCAD(entry.value ?? 0)}</span>
        </p>
      ))}
    </div>
  );
}

export function AmortizationChart({ result }: { result: CalculationResult }) {
  // Unique per instance: the dashboard and both compare panels each render this
  // chart, so hardcoded gradient ids would collide in the same document.
  const uid = useId();
  const balanceFill = `balanceFill-${uid}`;
  const interestFill = `interestFill-${uid}`;
  const data = [
    { year: 0, balance: result.principal, interest: 0 },
    ...result.schedule.map((row) => ({
      year: row.year,
      balance: row.endingBalance,
      interest: row.cumulativeInterest,
    })),
  ];

  return (
    <figure className="m-0">
      <div
        className="h-64 w-full"
        role="img"
        aria-label={`Line chart of the mortgage balance falling from ${formatCAD(
          result.principal,
        )} to zero over ${result.schedule.length} years, with cumulative interest of ${formatCAD(
          result.totalInterest,
        )} by payoff.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
            <defs>
              <linearGradient id={balanceFill} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--cat-principal)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--cat-principal)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id={interestFill} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--cat-interest)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--cat-interest)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: "var(--ink-faint)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--line)" }}
              label={{ value: "Year", position: "insideBottom", offset: -2, fill: "var(--ink-faint)", fontSize: 11 }}
            />
            <YAxis
              tick={{ fill: "var(--ink-faint)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={68}
              tickFormatter={(v: number) => formatCADWhole(v)}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="balance"
              name="Balance"
              stroke="var(--cat-principal)"
              strokeWidth={2}
              fill={`url(#${balanceFill})`}
            />
            <Area
              type="monotone"
              dataKey="interest"
              name="Cumulative interest"
              stroke="var(--cat-interest)"
              strokeWidth={2}
              fill={`url(#${interestFill})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-full" style={{ backgroundColor: "var(--cat-principal)" }} aria-hidden />
          Remaining balance
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-full" style={{ backgroundColor: "var(--cat-interest)" }} aria-hidden />
          Cumulative interest
        </span>
      </figcaption>

      {/* Screen-reader / no-JS accessible equivalent of the chart. The sr-only
          lives on a block-level wrapper: a bare `sr-only` on the <table> is
          defeated by the table-layout algorithm, which ignores width:1px and
          expands to fit its nowrap content, adding document-level horizontal
          scroll on narrow viewports. The div honours width/height:1px + overflow
          hidden and clips the naturally-sized table. */}
      <div className="sr-only">
        <table>
          <caption>Yearly mortgage balance and cumulative interest</caption>
          <thead>
            <tr>
              <th scope="col">Year</th>
              <th scope="col">Ending balance</th>
              <th scope="col">Cumulative interest</th>
            </tr>
          </thead>
          <tbody>
            {result.schedule.map((row) => (
              <tr key={row.year}>
                <td>{row.year}</td>
                <td>{formatCAD(row.endingBalance)}</td>
                <td>{formatCAD(row.cumulativeInterest)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
