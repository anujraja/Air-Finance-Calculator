"use client";

import type { IncomeTaxResult } from "@/lib/tax/incomeTax";
import type { HouseholdTotals } from "@/lib/tax/profile";
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

/**
 * Compact per-person income-tax split, rendered only in couple mode. Each column
 * mirrors the household ledger idiom (a bordered surface-2 tile) so the two
 * partners read side by side without introducing a new visual language.
 */
function PartnerColumn({
  heading,
  result,
  takehomeTestId,
}: {
  heading: string;
  result: IncomeTaxResult;
  takehomeTestId: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/40 px-4 py-2">
      <p className="border-b border-line py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {heading}
      </p>
      <Line label="Gross income" value={formatCAD(result.grossIncome)} />
      <Line label="Total income tax" value={`− ${formatCAD(result.totalIncomeTax)}`} />
      <div className="mt-1 border-t border-line pt-1">
        <div className="flex items-center justify-between py-1.5">
          <span className="font-medium text-ink">Take-home</span>
          <span
            data-testid={takehomeTestId}
            className="font-mono font-semibold tabular-nums text-ink"
          >
            {formatCAD(result.afterTaxIncome)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TaxBreakdownCard({
  result,
  partner,
  household,
}: {
  result: IncomeTaxResult;
  partner?: IncomeTaxResult | null;
  household?: HouseholdTotals | null;
}) {
  const isCouple = Boolean(partner && household);

  // In couple mode the top tiles summarise the household; the per-partner split
  // below carries each individual's numbers. In single mode everything mirrors
  // the sole person's result exactly (byte-for-byte unchanged).
  const monthly = isCouple ? household!.monthlyAfterTax : result.monthlyAfterTax;
  const yearly = isCouple ? household!.afterTaxIncome : result.afterTaxIncome;
  const avgRate = isCouple ? household!.averageTaxRate : result.averageTaxRate;

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
          <p className="text-xs font-medium uppercase tracking-wide text-accent-ink/70">
            {isCouple ? "Household take-home / mo" : "Take-home / mo"}
          </p>
          <p data-testid="takehome-monthly" className="mt-1 font-mono text-lg font-semibold tracking-tight tabular-nums text-accent-ink sm:text-2xl">
            {formatCAD(monthly)}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface-2/50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            {isCouple ? "Household take-home / yr" : "Take-home / yr"}
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-tight tabular-nums sm:text-2xl text-ink">
            {formatCAD(yearly)}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface-2/50 p-3">
          <p className="flex items-center text-xs font-medium uppercase tracking-wide text-ink-faint">
            {isCouple ? "Household average rate" : "Average rate"}
            <InfoTip label="average tax rate">
              Total income tax divided by your gross income — your overall tax burden.
            </InfoTip>
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-tight tabular-nums sm:text-2xl text-ink">
            {formatPercent(avgRate)}
          </p>
        </div>
        {isCouple ? (
          <div className="rounded-lg border border-line bg-surface-2/50 p-3">
            <p className="flex items-center text-xs font-medium uppercase tracking-wide text-ink-faint">
              Combined gross
              <InfoTip label="combined gross income">
                Both partners&apos; gross income added together — the figure lenders use for
                affordability.
              </InfoTip>
            </p>
            <p className="mt-1 font-mono text-lg font-semibold tracking-tight tabular-nums sm:text-2xl text-ink">
              {formatCAD(household!.grossIncome)}
            </p>
          </div>
        ) : (
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
        )}
      </div>

      {isCouple && (
        <div data-testid="tax-split" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PartnerColumn heading="Partner 1" result={result} takehomeTestId="partner-1-takehome" />
          <PartnerColumn heading="Partner 2" result={partner!} takehomeTestId="partner-2-takehome" />
        </div>
      )}

      <StatBar
        segments={segments}
        ariaLabel={`Of ${formatCAD(result.grossIncome)} gross income, ${formatCAD(
          result.afterTaxIncome,
        )} is take-home.`}
      />

      <div className="rounded-xl border border-line bg-surface-2/40 px-4 py-2">
        {isCouple && (
          <p className="border-b border-line py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Partner 1 breakdown
          </p>
        )}
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
