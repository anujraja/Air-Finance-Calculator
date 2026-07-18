"use client";

import type { IncomeTaxResult } from "@/lib/tax/incomeTax";
import { formatCAD, formatPercent } from "@/lib/engine/format";
import { StatBar } from "./StatBar";
import { InfoTip } from "@/components/InfoTip";

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${strong ? "" : "text-sm"}`}>
      <span className={strong ? "font-medium text-ink" : "text-ink-soft"}>{label}</span>
      <span className={`font-mono tabular-nums ${strong ? "font-semibold text-ink" : "text-ink"}`}>{value}</span>
    </div>
  );
}

export function TaxBreakdownCard({ result }: { result: IncomeTaxResult }) {
  const segments = [
    { key: "takehome", label: "Take-home", amount: result.afterTaxIncome, color: "var(--cat-principal)" },
    { key: "fed", label: "Federal tax", amount: result.federalTax, color: "var(--cat-interest)" },
    { key: "on", label: "Ontario tax", amount: result.ontarioTax, color: "var(--cat-tax)" },
    { key: "cpp", label: "CPP", amount: result.cpp, color: "var(--cat-insurance)" },
    { key: "ei", label: "EI", amount: result.ei, color: "var(--cat-condo)" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-accent/20 bg-accent-soft/40 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-accent-ink/70">Take-home / mo</p>
          <p data-testid="takehome-monthly" className="mt-1 font-mono text-lg font-semibold tracking-tight tabular-nums text-accent-ink sm:text-2xl">
            {formatCAD(result.monthlyAfterTax)}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface-2/50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Take-home / yr</p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-tight tabular-nums sm:text-2xl text-ink">
            {formatCAD(result.afterTaxIncome)}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface-2/50 p-3">
          <p className="flex items-center text-xs font-medium uppercase tracking-wide text-ink-faint">
            Average rate
            <InfoTip label="average tax rate">
              Total income tax divided by your gross income — your overall tax burden.
            </InfoTip>
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-tight tabular-nums sm:text-2xl text-ink">
            {formatPercent(result.averageTaxRate)}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface-2/50 p-3">
          <p className="flex items-center text-xs font-medium uppercase tracking-wide text-ink-faint">
            Marginal rate
            <InfoTip label="marginal tax rate">
              The tax on your next dollar of income — useful for RRSP and raise decisions.
            </InfoTip>
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-tight tabular-nums sm:text-2xl text-ink">
            {formatPercent(result.marginalTaxRate)}
          </p>
        </div>
      </div>

      <StatBar
        segments={segments}
        ariaLabel={`Of ${formatCAD(result.grossIncome)} gross income, ${formatCAD(
          result.afterTaxIncome,
        )} is take-home.`}
      />

      <div className="rounded-xl border border-line bg-surface-2/40 px-4 py-2">
        <Line label="Gross income" value={formatCAD(result.grossIncome)} strong />
        <Line label="Federal tax" value={`− ${formatCAD(result.federalTax)}`} />
        <Line
          label="Ontario tax (incl. surtax + health premium)"
          value={`− ${formatCAD(result.ontarioTax)}`}
        />
        <Line label="CPP contributions" value={`− ${formatCAD(result.cpp)}`} />
        <Line label="EI premiums" value={`− ${formatCAD(result.ei)}`} />
        <div className="mt-1 border-t border-line pt-1">
          <Line label="After-tax income" value={formatCAD(result.afterTaxIncome)} strong />
        </div>
      </div>
    </div>
  );
}
