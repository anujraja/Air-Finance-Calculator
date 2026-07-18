"use client";

import type { CSSProperties } from "react";
import type { FinancialProfile, ProfileAnalysis } from "@/lib/tax/profile";
import { buildAnalysisSummary } from "@/lib/tax/analysisSummary";
import { formatCAD, formatPercent } from "@/lib/engine/format";
import { Card, SectionTitle } from "@/components/Card";
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
        className="reveal mb-8 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-md)] sm:flex-row sm:items-center sm:justify-between sm:p-8"
        style={{ "--i": 0 } as React.CSSProperties}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Your snapshot</p>
          <h1 className="mt-1 font-display text-3xl text-ink sm:text-4xl">
            {formatCAD(incomeTax.monthlyAfterTax)}
            <span className="ml-2 align-baseline text-base font-normal text-ink-soft">take-home / month</span>
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {formatPercent(incomeTax.averageTaxRate)} average tax rate ·{" "}
            {formatPercent(incomeTax.marginalTaxRate)} on your next dollar · Ontario 2026
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CopySummaryButton getText={() => buildAnalysisSummary(profile, analysis)} />
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Edit answers
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink-faint transition-colors hover:text-ink"
          >
            Start over
          </button>
        </div>
      </div>

      {/* Income & tax */}
      <section aria-labelledby="tax-h" className="reveal mb-10" style={{ "--i": 1 } as CSSProperties}>
        <SectionTitle eyebrow="Income & tax" title={<span id="tax-h">Where your income goes</span>} />
        <Card>
          <TaxBreakdownCard result={incomeTax} />
        </Card>
      </section>

      {/* Business */}
      {corporate && (
        <section aria-labelledby="corp-h" className="reveal mb-10" style={{ "--i": 2 } as CSSProperties}>
          <SectionTitle eyebrow="Business" title={<span id="corp-h">Your corporation</span>} />
          <Card>
            <CorporateCard result={corporate} />
          </Card>
        </section>
      )}

      {/* Affordability + Savings */}
      <div className="reveal mb-10 grid grid-cols-1 gap-8 lg:grid-cols-2" style={{ "--i": 3 } as CSSProperties}>
        <section aria-labelledby="afford-h">
          <SectionTitle eyebrow="Affordability" title={<span id="afford-h">What you can afford</span>} />
          <Card className="h-full">
            <AffordabilityCard result={affordability} targetHomePrice={profile.homePrice} />
          </Card>
        </section>
        <section aria-labelledby="save-h">
          <SectionTitle eyebrow="Down payment" title={<span id="save-h">Your savings plan</span>} />
          <Card className="h-full">
            <SavingsCard
              result={savings}
              target={profile.downPaymentTarget}
              currentSavings={profile.currentSavings}
            />
          </Card>
        </section>
      </div>

      {/* Target-home mortgage */}
      <section aria-labelledby="mtg-h" className="reveal mb-10" style={{ "--i": 4 } as CSSProperties}>
        <SectionTitle
          eyebrow="Your target home"
          title={<span id="mtg-h">The {formatCAD(profile.homePrice)} mortgage</span>}
        />
        <Card>
          <div className="flex flex-col gap-8">
            <ResultsSummary result={mortgage} />
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                Where your monthly cost goes
              </h3>
              <MonthlyBreakdown result={mortgage} />
            </div>
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                Mortgage balance over time
              </h3>
              <AmortizationChart result={mortgage} />
            </div>
          </div>
        </Card>
      </section>

      <p className="rounded-xl border border-line bg-surface-2 px-5 py-4 text-sm text-ink-soft">
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
