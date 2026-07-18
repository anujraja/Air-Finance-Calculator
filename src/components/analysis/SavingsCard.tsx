"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SavingsResult } from "@/lib/tax/savings";
import { formatCAD, formatCADWhole } from "@/lib/engine/format";

export function SavingsCard({
  result,
  target,
  currentSavings,
}: {
  result: SavingsResult;
  target: number;
  currentSavings: number;
}) {
  // Downsample the monthly projection to ~yearly points for a clean chart.
  const step = Math.max(1, Math.floor(result.projection.length / 48));
  const data = result.projection
    .filter((_, i) => i % step === 0 || i === result.projection.length - 1)
    .map((p) => ({ month: p.month, year: +(p.month / 12).toFixed(1), balance: p.balance }));

  const headline = result.alreadyMet
    ? "Goal already reached 🎉"
    : result.monthsToGoal === null
      ? "Not reachable yet"
      : `${result.years} yr ${result.months} mo`;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-accent/20 bg-accent-soft/40 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-accent-ink/70">Time to goal</p>
          <p data-testid="time-to-goal" className="mt-1 font-mono text-2xl font-semibold tabular-nums text-accent-ink">
            {headline}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface-2/50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Down-payment goal</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-ink">{formatCADWhole(target)}</p>
        </div>
        <div className="col-span-2 rounded-lg border border-line bg-surface-2/50 p-3 sm:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">To hit it in 5 yrs</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-ink">
            {formatCAD(result.requiredMonthlyForFiveYears)}<span className="text-sm text-ink-faint">/mo</span>
          </p>
        </div>
      </div>

      {result.monthsToGoal === null ? (
        <p className="rounded-lg border border-dashed border-line-strong bg-surface-2 px-4 py-6 text-center text-sm text-ink-soft">
          With no monthly contribution and no return, this goal won&apos;t be reached. Increase your
          monthly savings to see a timeline.
        </p>
      ) : (
        <figure className="m-0 rounded-xl border border-line bg-surface-2/40 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px] ring-2 ring-inset ring-white/25"
              style={{ backgroundColor: "var(--cat-principal)" }}
              aria-hidden
            />
            Projected balance
          </div>
          <div
            className="h-52 w-full"
            role="img"
            aria-label={`Savings growing from ${formatCAD(currentSavings)} to the ${formatCAD(
              target,
            )} goal over about ${result.years} years and ${result.months} months.`}
          >
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
          <figcaption className="mt-2 border-t border-line pt-2 text-xs text-ink-faint">
            Assumes a 3% annual return on savings, compounded monthly.
          </figcaption>
        </figure>
      )}
    </div>
  );
}
