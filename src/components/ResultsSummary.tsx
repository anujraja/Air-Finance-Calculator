"use client";

/**
 * Headline results for one scenario: the total monthly housing cost, the
 * mortgage payment, and the key lifetime figures. Built to read cleanly during
 * a live demo — one dominant number, supporting figures in a tidy grid.
 */

import type { CalculationResult } from "@/lib/engine/types";
import { formatCAD, formatPercent } from "@/lib/engine/format";
import { InfoTip } from "./InfoTip";

function Stat({
  label,
  value,
  sub,
  emphasis,
  testId,
}: {
  label: React.ReactNode;
  value: string;
  sub?: string;
  emphasis?: boolean;
  testId?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="flex items-center text-xs font-medium uppercase tracking-wide text-ink-faint">
        {label}
      </dt>
      <dd
        data-testid={testId}
        className={`font-mono tabular-nums ${
          emphasis ? "text-2xl font-semibold tracking-tight text-ink sm:text-3xl" : "text-lg text-ink"
        }`}
      >
        {value}
      </dd>
      {sub ? <p className="text-xs text-ink-soft">{sub}</p> : null}
    </div>
  );
}

export function ResultsSummary({ result }: { result: CalculationResult }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent-soft/80 to-accent-soft/30 p-6 shadow-[var(--shadow-sm)]">
        <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-accent" />
        <dl className="flex flex-col gap-1.5">
          <dt className="flex items-center text-xs font-semibold uppercase tracking-[0.12em] text-accent-ink">
            Total estimated monthly cost
            <InfoTip label="total monthly cost">
              Mortgage payment plus monthly property tax, insurance, utilities,
              and condo/maintenance fees. This is the all-in monthly figure.
            </InfoTip>
          </dt>
          <dd
            data-testid="total-monthly-cost"
            className="font-mono text-4xl font-semibold tracking-tight tabular-nums text-accent-ink sm:text-5xl"
          >
            {formatCAD(result.totalMonthlyCost)}
          </dd>
          <p className="text-xs text-accent-ink/70">per month, all costs included</p>
        </dl>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6">
        <Stat
          label="Monthly mortgage"
          value={formatCAD(result.monthlyMortgagePayment)}
          emphasis
          testId="monthly-mortgage"
        />
        <Stat
          label="Loan principal"
          value={formatCAD(result.principal)}
          sub={`${formatPercent(result.downPaymentRatio)} down`}
          emphasis
        />
        <Stat label="Property tax / mo" value={formatCAD(result.monthlyPropertyTax)} />
        <Stat label="Insurance / mo" value={formatCAD(result.monthlyInsurance)} />
        <Stat
          label={
            <span className="flex items-center">
              Total interest
              <InfoTip label="total interest">
                The sum of all interest paid over the full amortization period,
                assuming the rate stays constant.
              </InfoTip>
            </span>
          }
          value={formatCAD(result.totalInterest)}
          testId="total-interest"
        />
        <Stat label="Total amount paid" value={formatCAD(result.totalPaid)} testId="total-paid" />
      </dl>
    </div>
  );
}
