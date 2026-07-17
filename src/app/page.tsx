"use client";

import { useMemo, useState } from "react";
import { DEFAULT_INPUT, type CalculatorInput } from "@/lib/engine/schema";
import { compareScenarios } from "@/lib/engine/compare";
import { buildSummary } from "@/lib/summary";
import { useCalculation } from "@/lib/useCalculation";
import type { SavedScenario } from "@/lib/persistence/types";
import { Card, SectionTitle } from "@/components/Card";
import { ScenarioForm } from "@/components/ScenarioForm";
import { ResultsPanel } from "@/components/ResultsPanel";
import { ComparePanel } from "@/components/ComparePanel";
import { SavedScenarios } from "@/components/SavedScenarios";
import { CopySummaryButton } from "@/components/CopySummaryButton";

/** Scenario B starts as a meaningfully different comparison (longer term, higher rate). */
const DEFAULT_INPUT_B: CalculatorInput = {
  ...DEFAULT_INPUT,
  annualInterestRatePercent: 5.75,
  amortizationYears: 30,
  downPaymentType: "percent",
  downPaymentValue: 10,
};

function ScenarioBadge({ letter }: { letter: "A" | "B" }) {
  return (
    <span
      className={`grid h-7 w-7 place-items-center rounded-full font-mono text-sm font-semibold ${
        letter === "A" ? "bg-accent text-white" : "bg-gold-soft text-gold"
      }`}
      aria-hidden
    >
      {letter}
    </span>
  );
}

export default function Home() {
  const [inputA, setInputA] = useState<CalculatorInput>(DEFAULT_INPUT);
  const [inputB, setInputB] = useState<CalculatorInput>(DEFAULT_INPUT_B);

  const stateA = useCalculation(inputA);
  const stateB = useCalculation(inputB);

  const comparison = useMemo(
    () => (stateA.result && stateB.result ? compareScenarios(stateA.result, stateB.result) : null),
    [stateA.result, stateB.result],
  );

  const patchA = (patch: Partial<CalculatorInput>) => setInputA((prev) => ({ ...prev, ...patch }));
  const patchB = (patch: Partial<CalculatorInput>) => setInputB((prev) => ({ ...prev, ...patch }));

  function handleLoad(saved: SavedScenario) {
    setInputA(saved.scenarioA);
    setInputB(saved.scenarioB);
  }

  const summaryText = () =>
    stateA.result
      ? buildSummary({
          inputA,
          resultA: stateA.result,
          inputB,
          resultB: stateB.result ?? undefined,
          comparison: comparison ?? undefined,
        })
      : "";

  return (
    <div className="paper-grain flex min-h-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              className="grid h-9 w-9 place-items-center rounded-lg bg-accent font-display text-lg font-semibold text-white"
              aria-hidden
            >
              H
            </span>
            <div className="leading-tight">
              <p className="font-display text-base font-semibold text-ink">HomeCost Canada</p>
              <p className="hidden text-xs text-ink-soft sm:block">
                Mortgage &amp; total home-cost calculator
              </p>
            </div>
          </div>
          <span className="rounded-full border border-line-strong bg-surface px-3 py-1 text-[11px] font-medium text-ink-soft">
            Educational demo — not financial advice
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero */}
        <section className="rise mb-10 max-w-2xl">
          <h1 className="font-display text-3xl leading-tight text-ink sm:text-5xl">
            See the true cost of a home, before you commit.
          </h1>
          <p className="mt-4 text-base text-ink-soft sm:text-lg">
            Model a Canadian mortgage with the correct semi-annual compounding, roll in
            taxes, insurance, and fees, and compare two scenarios side by side — with every
            assumption shown in the open.
          </p>
        </section>

        {/* Inputs */}
        <section aria-labelledby="inputs-heading" className="mb-12">
          <SectionTitle
            eyebrow="Step 1"
            title={<span id="inputs-heading">Enter your two scenarios</span>}
          >
            <CopySummaryButton getText={summaryText} />
          </SectionTitle>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <div className="mb-5 flex items-center gap-2.5">
                <ScenarioBadge letter="A" />
                <h3 className="font-display text-lg text-ink">Scenario A</h3>
              </div>
              <ScenarioForm value={inputA} onChange={patchA} fieldErrors={stateA.fieldErrors} />
            </Card>
            <Card>
              <div className="mb-5 flex items-center gap-2.5">
                <ScenarioBadge letter="B" />
                <h3 className="font-display text-lg text-ink">Scenario B</h3>
              </div>
              <ScenarioForm value={inputB} onChange={patchB} fieldErrors={stateB.fieldErrors} />
            </Card>
          </div>
        </section>

        {/* Comparison */}
        <section aria-labelledby="compare-heading" className="mb-12">
          <SectionTitle
            eyebrow="Step 2"
            title={<span id="compare-heading">How they compare</span>}
          />
          {comparison && stateA.result && stateB.result ? (
            <Card>
              <ComparePanel
                resultA={stateA.result}
                resultB={stateB.result}
                comparison={comparison}
              />
            </Card>
          ) : (
            <Card>
              <p className="py-6 text-center text-sm text-ink-faint">
                Enter valid values in both scenarios to see the difference.
              </p>
            </Card>
          )}
        </section>

        {/* Detailed results */}
        <section aria-labelledby="results-heading" className="mb-12">
          <SectionTitle
            eyebrow="Step 3"
            title={<span id="results-heading">Full breakdown</span>}
          />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card as="article" aria-label="Scenario A results">
              <div className="mb-6 flex items-center gap-2.5">
                <ScenarioBadge letter="A" />
                <h3 className="font-display text-lg text-ink">Scenario A</h3>
              </div>
              <ResultsPanel state={stateA} />
            </Card>
            <Card as="article" aria-label="Scenario B results">
              <div className="mb-6 flex items-center gap-2.5">
                <ScenarioBadge letter="B" />
                <h3 className="font-display text-lg text-ink">Scenario B</h3>
              </div>
              <ResultsPanel state={stateB} />
            </Card>
          </div>
        </section>

        {/* Saved scenarios */}
        <section aria-labelledby="save-heading" className="mb-6">
          <SectionTitle
            eyebrow="Step 4"
            title={<span id="save-heading">Save &amp; reopen</span>}
          />
          <Card>
            <SavedScenarios scenarioA={inputA} scenarioB={inputB} onLoad={handleLoad} />
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-surface-2">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-ink-soft sm:px-6">
          <p className="max-w-3xl">
            <strong className="font-semibold text-ink">
              Educational demonstration only — not financial advice.
            </strong>{" "}
            Results are estimates based on the assumptions you enter and a constant interest
            rate. They exclude CMHC mortgage insurance, closing costs, rate changes at renewal,
            and qualification or stress-test rules. Always consult a licensed mortgage professional.
          </p>
          <p className="mt-4 text-xs text-ink-faint">
            Built with Next.js, TypeScript, and a fully tested calculation engine.
          </p>
        </div>
      </footer>
    </div>
  );
}
