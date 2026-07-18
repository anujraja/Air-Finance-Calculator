"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  DEFAULT_PROFILE,
  DEMO_PROFILE,
  profileSchema,
  type FinancialProfile,
  type ProfileAnalysis,
} from "@/lib/tax/profile";
import type { CalculatorInput } from "@/lib/engine/schema";
import { Wizard } from "@/components/wizard/Wizard";
import { AnalysisDashboard } from "@/components/analysis/AnalysisDashboard";
import { MortgageCompare } from "@/components/MortgageCompare";
import { SectionTitle } from "@/components/Card";
import { ThemeToggle } from "@/components/ThemeToggle";

const PROFILE_KEY = "homecost-canada.profile.v1";

async function requestAnalysis(profile: FinancialProfile): Promise<ProfileAnalysis> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error("analysis failed");
  const body = (await res.json()) as { analysis: ProfileAnalysis };
  return body.analysis;
}

/** Seed the two mortgage-compare scenarios from the profile. */
function seedScenarios(profile: FinancialProfile): { a: CalculatorInput; b: CalculatorInput } {
  const a: CalculatorInput = {
    homePrice: profile.homePrice,
    downPaymentType: "dollar",
    downPaymentValue: Math.min(profile.downPaymentTarget, profile.homePrice),
    annualInterestRatePercent: profile.mortgageRate,
    amortizationYears: profile.amortizationYears,
    annualPropertyTax: profile.annualPropertyTax,
    annualHomeInsurance: profile.annualHomeInsurance,
    monthlyUtilities: profile.monthlyUtilities,
    monthlyCondoFees: profile.monthlyCondoFees,
  };
  const b: CalculatorInput = { ...a, amortizationYears: Math.min(profile.amortizationYears + 5, 40) };
  return { a, b };
}

export default function Home() {
  const [view, setView] = useState<"wizard" | "analysis">("wizard");
  const [profile, setProfile] = useState<FinancialProfile>(DEFAULT_PROFILE);
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  // Restore a previously saved profile as the wizard's starting point.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const parsed = profileSchema.safeParse(JSON.parse(raw));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed.success) setProfile(parsed.data);
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  async function run(next: FinancialProfile) {
    setSubmitting(true);
    setError(null);
    try {
      const result = await requestAnalysis(next);
      setProfile(next);
      setAnalysis(result);
      setView("analysis");
      setShowCompare(false);
      try {
        window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("We couldn't complete the analysis. Please check your entries and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const seeds = useMemo(() => seedScenarios(profile), [profile]);

  return (
    <div className="paper-grain flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setView("wizard")}
            className="flex items-center gap-3 text-left"
          >
            <span
              className="grid h-9 w-9 place-items-center rounded-lg bg-accent font-display text-lg font-semibold text-white"
              aria-hidden
            >
              H
            </span>
            <div className="leading-tight">
              <p className="font-display text-base font-semibold text-ink">HomeCost Canada</p>
              <p className="hidden text-xs text-ink-soft sm:block">
                Tax, affordability &amp; home-cost planner · Ontario 2026
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-line-strong bg-surface px-3 py-1 text-[11px] font-medium text-ink-soft sm:inline">
              Educational demo — not advice
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {view === "wizard" && (
          <>
            <section className="mx-auto mb-10 max-w-2xl text-center">
              <p
                className="reveal mb-4 inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-xs font-medium text-ink-soft"
                style={{ "--i": 0 } as CSSProperties}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                Ontario · 2026 tax year
              </p>
              <h1
                className="reveal font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-6xl"
                style={{ "--i": 1 } as CSSProperties}
              >
                Know what you can{" "}
                <span className="italic text-accent">really</span> afford.
              </h1>
              <p
                className="reveal mx-auto mt-5 max-w-xl text-base text-ink-soft sm:text-lg"
                style={{ "--i": 2 } as CSSProperties}
              >
                Answer a few questions and get a clear picture of your take-home pay, the home price
                you qualify for, how long to save your down payment, and your full monthly cost —
                built on 2026 Ontario tax rules.
              </p>
              <ul
                className="reveal mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-ink-soft"
                style={{ "--i": 3 } as CSSProperties}
              >
                {["Take-home pay", "What you can afford", "Down-payment timeline", "Full monthly cost"].map(
                  (pill) => (
                    <li
                      key={pill}
                      className="rounded-full border border-line bg-surface-2 px-3 py-1"
                    >
                      {pill}
                    </li>
                  ),
                )}
              </ul>
            </section>
            <Wizard
              initial={profile}
              onComplete={run}
              onDemo={() => run(DEMO_PROFILE)}
              submitting={submitting}
              serverError={error}
            />
          </>
        )}

        {view === "analysis" && analysis && (
          <>
            <AnalysisDashboard
              profile={profile}
              analysis={analysis}
              onEdit={() => setView("wizard")}
              onRestart={() => {
                setProfile(DEFAULT_PROFILE);
                setAnalysis(null);
                setView("wizard");
              }}
            />

            {/* Mortgage scenario comparison */}
            <section aria-labelledby="compare-h" className="mx-auto mt-4 w-full max-w-5xl">
              <SectionTitle
                eyebrow="Go deeper"
                title={<span id="compare-h">Compare two mortgage scenarios</span>}
              >
                <button
                  type="button"
                  onClick={() => setShowCompare((v) => !v)}
                  data-testid="toggle-compare"
                  className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  {showCompare ? "Hide comparison" : "Open comparison"}
                </button>
              </SectionTitle>
              {showCompare && (
                <div className="rise">
                  <MortgageCompare initialA={seeds.a} initialB={seeds.b} />
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-line bg-surface-2">
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-ink-soft sm:px-6">
          <p className="max-w-3xl">
            <strong className="font-semibold text-ink">
              Educational demonstration only — not financial, tax, or mortgage advice.
            </strong>{" "}
            Built with 2026 Ontario and federal figures. Estimates exclude CMHC insurance, most
            credits and benefits, and lender-specific rules. Always consult a licensed professional.
          </p>
          <p className="mt-4 text-xs text-ink-faint">
            Next.js · TypeScript · a fully tested calculation engine.
          </p>
        </div>
      </footer>
    </div>
  );
}
