"use client";

import type { CSSProperties } from "react";
import type { FinancialProfile, ProfileAnalysis } from "@/lib/tax/profile";
import { buildAnalysisSummary } from "@/lib/tax/analysisSummary";
import { formatCAD, formatCADWhole, formatPercent } from "@/lib/engine/format";
import { Card } from "@/components/Card";
import { CopySummaryButton } from "@/components/CopySummaryButton";
import { ResultsSummary } from "@/components/ResultsSummary";
import { MonthlyBreakdown } from "@/components/MonthlyBreakdown";
import { AmortizationChart } from "@/components/AmortizationChart";
import { TaxBreakdownCard } from "./TaxBreakdownCard";
import { AffordabilityCard } from "./AffordabilityCard";
import { SavingsCard } from "./SavingsCard";
import { CorporateCard } from "./CorporateCard";

interface DashboardProps {
  profile: FinancialProfile;
  analysis: ProfileAnalysis;
  onEdit: () => void;
  onRestart: () => void;
}

export function AnalysisDashboard({ profile, analysis, onEdit, onRestart }: DashboardProps) {
  const { incomeTax, affordability, savings, mortgage, corporate } = analysis;

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Headline */}
      <div
        className="reveal relative mb-8 flex flex-col gap-4 overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-md)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent/40 before:to-transparent after:pointer-events-none after:absolute after:-right-16 after:-top-20 after:h-56 after:w-56 after:rounded-full after:bg-accent/5 after:blur-2xl sm:flex-row sm:items-center sm:justify-between sm:p-8"
        style={{ "--i": 0 } as React.CSSProperties}
      >
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            Your snapshot
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
            {formatCAD(incomeTax.monthlyAfterTax)}
            <span className="ml-2 align-baseline text-base font-normal text-ink-soft">take-home / month</span>
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-ink-soft">
            <span className="font-medium text-ink">{formatPercent(incomeTax.averageTaxRate)}</span> average tax rate
            <span className="text-ink-faint" aria-hidden>·</span>
            <span className="font-medium text-ink">{formatPercent(incomeTax.marginalTaxRate)}</span> on your next dollar
            <span className="text-ink-faint" aria-hidden>·</span>
            <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-soft">
              Ontario 2026
            </span>
          </p>
        </div>
        <div className="relative flex flex-wrap items-center gap-2">
          <CopySummaryButton getText={() => buildAnalysisSummary(profile, analysis)} />
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium text-ink shadow-[var(--shadow-sm)] transition-all hover:-translate-y-px hover:border-accent hover:text-accent hover:shadow-[var(--shadow-md)]"
          >
            Edit answers
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
          >
            Start over
          </button>
        </div>
      </div>

      {/* Income & tax */}
      <section aria-labelledby="tax-h" className="reveal mb-8" style={{ "--i": 1 } as CSSProperties}>
        <Card eyebrow="Income & tax" title="Where your income goes" titleId="tax-h">
          <TaxBreakdownCard result={incomeTax} />
        </Card>
      </section>

      {/* Business */}
      {corporate && (
        <section aria-labelledby="corp-h" className="reveal mb-8" style={{ "--i": 2 } as CSSProperties}>
          <Card eyebrow="Business" title="Your corporation" titleId="corp-h">
            <CorporateCard result={corporate} />
          </Card>
        </section>
      )}

      {/* Affordability + Savings */}
      <div className="reveal mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2" style={{ "--i": 3 } as CSSProperties}>
        <Card
          as="section"
          aria-labelledby="afford-h"
          eyebrow="Affordability"
          title="What you can afford"
          titleId="afford-h"
          className="h-full"
        >
          <AffordabilityCard result={affordability} targetHomePrice={profile.homePrice} />
        </Card>
        <Card
          as="section"
          aria-labelledby="save-h"
          eyebrow="Down payment"
          title="Your savings plan"
          titleId="save-h"
          className="h-full"
        >
          <SavingsCard
            result={savings}
            target={profile.downPaymentTarget}
            currentSavings={profile.currentSavings}
          />
        </Card>
      </div>

      {/* Target-home mortgage */}
      <section aria-labelledby="mtg-h" className="reveal mb-8" style={{ "--i": 4 } as CSSProperties}>
        <Card eyebrow="Your target home" title={`The ${formatCADWhole(profile.homePrice)} mortgage`} titleId="mtg-h">
          <div className="flex flex-col gap-8">
            <ResultsSummary result={mortgage} />
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                <span className="h-3 w-0.5 rounded-full bg-accent/50" aria-hidden />
                Where your monthly cost goes
              </h3>
              <MonthlyBreakdown result={mortgage} />
            </div>
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                <span className="h-3 w-0.5 rounded-full bg-accent/50" aria-hidden />
                Mortgage balance over time
              </h3>
              <AmortizationChart result={mortgage} />
            </div>
          </div>
        </Card>
      </section>

      <p className="rounded-xl border border-line bg-surface-2 px-5 py-4 text-sm leading-relaxed text-ink-soft shadow-[var(--shadow-sm)]">
        <strong className="font-semibold text-ink">
          Educational demonstration only — not financial, tax, or mortgage advice.
        </strong>{" "}
        Estimates use published 2026 Ontario and federal figures and assume a constant interest rate.
        They exclude CMHC insurance, credits and benefits beyond the basic personal amount, and your
        lender&apos;s specific rules. Always consult a licensed professional.
      </p>
    </div>
  );
}
