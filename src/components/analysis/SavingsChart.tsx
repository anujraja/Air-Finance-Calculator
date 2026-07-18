"use client";

/**
 * The recharts area chart for the savings projection, split into its own module
 * so `SavingsCard` can load it as a client-only dynamic chunk and keep recharts
 * out of the first-load JS. The surrounding figure/legend/stats stay in
 * `SavingsCard` so only the plotted area is deferred.
 */

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCAD, formatCADWhole } from "@/lib/engine/format";

export interface SavingsChartPoint {
  month: number;
  year: number;
  balance: number;
}

export function SavingsChart({ data, ariaLabel }: { data: SavingsChartPoint[]; ariaLabel: string }) {
  return (
    <div className="h-52 w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
          <defs>
            <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--cat-principal)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--cat-principal)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fill: "var(--ink-faint)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--line)" }}
            unit="y"
          />
          <YAxis
            tick={{ fill: "var(--ink-faint)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(v: number) => formatCADWhole(v)}
          />
          <Tooltip
            formatter={(v) => [formatCAD(Number(v)), "Balance"]}
            labelFormatter={(l) => `Year ${l}`}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "var(--surface)",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="var(--cat-principal)"
            strokeWidth={2}
            fill="url(#savingsFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
