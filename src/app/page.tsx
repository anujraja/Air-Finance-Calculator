"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  DEFAULT_PROFILE,
  DEMO_PROFILE,
  COUPLE_DEMO,
  analyzeProfile,
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

/**
 * Get the analysis for a profile. The serverless route (`/api/analyze`) is the
 * primary path — it re-validates input and runs the same engine on the server.
 * Because that engine is pure and isomorphic, we fall back to computing locally
 * if the network or the function is ever unavailable, so the user always gets a
 * result. The profile is validated by the caller before it reaches here.
 */
async function requestAnalysis(profile: FinancialProfile): Promise<ProfileAnalysis> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (res.ok) {
      const body = (await res.json()) as { analysis?: ProfileAnalysis };
      if (body?.analysis) return body.analysis;
    }
  } catch {
    /* fall through to the local engine */
  }
  return analyzeProfile(profile);
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
    // Validate on the client so we never submit bad data and can show a clear
    // message instead of a failed request.
    const parsed = profileSchema.safeParse(next);
    if (!parsed.success) {
      setError("Some entries need a second look — please check the highlighted fields.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await requestAnalysis(parsed.data);
      setProfile(parsed.data);
      setAnalysis(result);
      setView("analysis");
      setShowCompare(false);
      try {
        window.localStorage.setItem(PROFILE_KEY, JSON.stringify(parsed.data));
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
            <section className="mx-auto mb-12 max-w-2xl text-center">
              <p
                className="reveal mb-5 inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-xs font-medium text-ink-soft shadow-sm"
                style={{ "--i": 0 } as CSSProperties}
              >
                <span className="relative flex h-1.5 w-1.5" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                Interactive assessment · Solo or with a partner · Ontario 2026
              </p>
              <h1
                className="reveal font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl"
                style={{ "--i": 1 } as CSSProperties}
              >
                See exactly what you can{" "}
                <span className="font-bold text-accent underline decoration-accent/30 decoration-4 underline-offset-[6px]">
                  afford
                </span>
                .
              </h1>
              <p
                className="reveal mx-auto mt-5 max-w-xl text-base text-ink-soft sm:text-lg"
                style={{ "--i": 2 } as CSSProperties}
              >
                Take a five-minute assessment — on your own or with a partner — and get a clear,
                personalized read on your take-home pay, the home price you qualify for, how long to
                save your down payment, and your full monthly cost — all built on 2026 Ontario tax
                rules.
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

            {/* What the assessment reveals — "services" grid */}
            <section aria-labelledby="reveals-h" className="mx-auto mb-12 w-full max-w-5xl">
              <div
                className="reveal mb-6 text-center"
                style={{ "--i": 4 } as CSSProperties}
              >
                <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  Your financial picture
                </p>
                <h2
                  id="reveals-h"
                  className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
                >
                  What this assessment reveals
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-sm text-ink-soft">
                  Four connected insights, calculated from your answers.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    glyph: (
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    ),
                    title: "Take-home pay",
                    body:
                      "Your federal and Ontario tax, plus CPP, CPP2 and EI — net pay broken out monthly and yearly.",
                  },
                  {
                    glyph: (
                      <>
                        <path d="M3 11l9-7 9 7" />
                        <path d="M5 10v10h14V10" />
                        <path d="M9 20v-6h6v6" />
                      </>
                    ),
                    title: "What you can afford",
                    body:
                      "The home price you qualify for under GDS and TDS limits, tested against the mortgage stress test.",
                  },
                  {
                    glyph: (
                      <>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </>
                    ),
                    title: "Down-payment timeline",
                    body:
                      "How long it takes to reach your down-payment goal, and the monthly amount to hit it within five years.",
                  },
                  {
                    glyph: (
                      <>
                        <path d="M3 21h18" />
                        <path d="M5 21V8l7-5 7 5v13" />
                        <path d="M9 21v-6h6v6" />
                      </>
                    ),
                    title: "Full monthly cost",
                    body:
                      "Mortgage plus property tax, insurance, utilities and condo fees — your real all-in monthly number.",
                  },
                ].map((card, i) => (
                  <article
                    key={card.title}
                    className="reveal group rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
                    style={{ "--i": 5 + i } as CSSProperties}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-ink transition-colors group-hover:bg-accent group-hover:text-white"
                        aria-hidden
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-5 w-5"
                        >
                          {card.glyph}
                        </svg>
                      </span>
                      <span className="font-display text-xs font-semibold text-ink-faint">
                        0{i + 1}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-base font-semibold text-ink">
                      {card.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{card.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <Wizard
              initial={profile}
              onComplete={run}
              onDemo={(mode) => run(mode === "couple" ? COUPLE_DEMO : DEMO_PROFILE)}
              onClearError={() => setError(null)}
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
                title="Compare two mortgage scenarios"
                titleId="compare-h"
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
          <div className="mt-6 flex flex-col gap-4 border-t border-line-strong pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-ink-soft">
              Built by Anuj Raja <span aria-hidden="true">🇨🇦 🇮🇳</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://anujraja.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent"
              >
                anujraja.com
              </a>
              <a
                href="https://github.com/anujraja"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent"
              >
                GitHub
              </a>
            </div>
          </div>
          <p className="mt-4 text-xs text-ink-faint">
            Next.js · TypeScript · a fully tested calculation engine.
          </p>
        </div>
      </footer>
    </div>
  );
}
