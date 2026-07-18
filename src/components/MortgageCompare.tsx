"use client";

/**
 * Two-scenario mortgage comparison. Each scenario calculates live through the
 * serverless /api/calculate endpoint (via useCalculation). Seeded from the
 * caller so it can start from the user's profile.
 */

import { useMemo, useState } from "react";
import type { CalculatorInput } from "@/lib/engine/schema";
import { compareScenarios } from "@/lib/engine/compare";
import { useCalculation } from "@/lib/useCalculation";
import { Card } from "./Card";
import { ScenarioForm } from "./ScenarioForm";
import { ResultsPanel } from "./ResultsPanel";
import { ComparePanel } from "./ComparePanel";

function Badge({ letter }: { letter: "A" | "B" }) {
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

export function MortgageCompare({ initialA, initialB }: { initialA: CalculatorInput; initialB: CalculatorInput }) {
  const [inputA, setInputA] = useState<CalculatorInput>(initialA);
  const [inputB, setInputB] = useState<CalculatorInput>(initialB);
  const stateA = useCalculation(inputA);
  const stateB = useCalculation(inputB);

  const comparison = useMemo(
    () => (stateA.result && stateB.result ? compareScenarios(stateA.result, stateB.result) : null),
    [stateA.result, stateB.result],
  );

  const patchA = (patch: Partial<CalculatorInput>) => setInputA((p) => ({ ...p, ...patch }));
  const patchB = (patch: Partial<CalculatorInput>) => setInputB((p) => ({ ...p, ...patch }));

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-5 flex items-center gap-2.5">
            <Badge letter="A" />
            <h3 className="font-display text-lg text-ink">Scenario A</h3>
          </div>
          <ScenarioForm value={inputA} onChange={patchA} fieldErrors={stateA.fieldErrors} />
        </Card>
        <Card>
          <div className="mb-5 flex items-center gap-2.5">
            <Badge letter="B" />
            <h3 className="font-display text-lg text-ink">Scenario B</h3>
          </div>
          <ScenarioForm value={inputB} onChange={patchB} fieldErrors={stateB.fieldErrors} />
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 font-display text-lg text-ink">How they compare</h3>
        {comparison && stateA.result && stateB.result ? (
          <ComparePanel resultA={stateA.result} resultB={stateB.result} comparison={comparison} />
        ) : (
          <p className="py-6 text-center text-sm text-ink-faint">
            Enter valid values in both scenarios to see the difference.
          </p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card as="article" aria-label="Scenario A results">
          <div className="mb-6 flex items-center gap-2.5">
            <Badge letter="A" />
            <h3 className="font-display text-lg text-ink">Scenario A</h3>
          </div>
          <ResultsPanel state={stateA} />
        </Card>
        <Card as="article" aria-label="Scenario B results">
          <div className="mb-6 flex items-center gap-2.5">
            <Badge letter="B" />
            <h3 className="font-display text-lg text-ink">Scenario B</h3>
          </div>
          <ResultsPanel state={stateB} />
        </Card>
      </div>
    </div>
  );
}
