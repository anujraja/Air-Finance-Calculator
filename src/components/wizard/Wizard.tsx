"use client";

/**
 * Guided onboarding wizard. Collects a full financial profile across five short,
 * grouped steps with a progress indicator, per-step validation, and a one-click
 * demo that prefills everything. Emits the completed profile to the parent.
 */

import { useMemo, useState } from "react";
import {
  profileSchema,
  EMPLOYMENT_TYPES,
  type FinancialProfile,
  type EmploymentType,
} from "@/lib/tax/profile";
import { NumberInput } from "@/components/NumberInput";

interface WizardProps {
  initial: FinancialProfile;
  onComplete: (profile: FinancialProfile) => void;
  onDemo: () => void;
  submitting?: boolean;
  serverError?: string | null;
}

const EMPLOYMENT_LABELS: Record<EmploymentType, { title: string; blurb: string }> = {
  employee: { title: "Employed (T4)", blurb: "Salary or hourly, taxes withheld" },
  self_employed: { title: "Self-employed", blurb: "Contractor, freelancer, gig" },
  business_owner: { title: "Business owner", blurb: "Incorporated business income" },
  mixed: { title: "A mix", blurb: "More than one of these" },
};

/** Field keys validated on each step, to gate the Next button. */
const STEP_FIELDS: (keyof FinancialProfile)[][] = [
  ["employmentType"],
  ["employmentIncome", "selfEmploymentIncome", "otherIncome", "businessIncome"],
  ["rrspDeduction", "currentSavings", "monthlySavings", "monthlyDebtPayments"],
  ["homePrice", "downPaymentTarget", "mortgageRate", "amortizationYears"],
  ["annualPropertyTax", "annualHomeInsurance", "monthlyUtilities", "monthlyCondoFees"],
];

const STEP_META = [
  { eyebrow: "Step 1 of 5", title: "About you", subtitle: "How do you earn your income? This shapes your tax and CPP/EI." },
  { eyebrow: "Step 2 of 5", title: "Your income", subtitle: "Annual amounts before tax. Leave anything that doesn't apply at zero." },
  { eyebrow: "Step 3 of 5", title: "Savings & debts", subtitle: "What you set aside and what you owe each month." },
  { eyebrow: "Step 4 of 5", title: "Your home goal", subtitle: "The home you're aiming for and how you'd finance it." },
  { eyebrow: "Step 5 of 5", title: "Home costs", subtitle: "The recurring costs of owning that home." },
];

export function Wizard({ initial, onComplete, onDemo, submitting, serverError }: WizardProps) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<FinancialProfile>(initial);
  const [showErrors, setShowErrors] = useState(false);

  const fieldErrors = useMemo(() => {
    const parsed = profileSchema.safeParse(draft);
    return parsed.success ? {} : parsed.error.flatten().fieldErrors;
  }, [draft]);

  const set = (patch: Partial<FinancialProfile>) => setDraft((prev) => ({ ...prev, ...patch }));
  const err = (key: keyof FinancialProfile): string | undefined =>
    showErrors ? fieldErrors[key]?.[0] : undefined;

  const stepHasErrors = STEP_FIELDS[step]!.some((k) => fieldErrors[k]?.length);
  const isLast = step === STEP_META.length - 1;

  function next() {
    if (stepHasErrors) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (isLast) {
      onComplete(draft);
    } else {
      setStep((s) => s + 1);
    }
  }

  function back() {
    setShowErrors(false);
    setStep((s) => Math.max(s - 1, 0));
  }

  const meta = STEP_META[step]!;
  const progress = ((step + 1) / STEP_META.length) * 100;

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-ink-faint">
          <span>{meta.eyebrow}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-md)] sm:p-8">
        <header className="mb-6">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">{meta.title}</h2>
          <p className="mt-1.5 text-sm text-ink-soft">{meta.subtitle}</p>
        </header>

        <div className="rise" key={step}>
          {step === 0 && (
            <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <legend className="sr-only">Employment type</legend>
              {EMPLOYMENT_TYPES.map((type) => {
                const active = draft.employmentType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={active}
                    onClick={() => set({ employmentType: type })}
                    className={`flex flex-col items-start gap-0.5 rounded-xl border p-4 text-left transition-all ${
                      active
                        ? "border-accent bg-accent-soft/60 ring-1 ring-accent"
                        : "border-line-strong bg-surface hover:border-accent/50"
                    }`}
                  >
                    <span className="font-medium text-ink">{EMPLOYMENT_LABELS[type].title}</span>
                    <span className="text-xs text-ink-soft">{EMPLOYMENT_LABELS[type].blurb}</span>
                  </button>
                );
              })}
              <p className="col-span-full mt-1 flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-soft">
                <span aria-hidden>📍</span>
                Ontario, 2026 tax year. Other provinces aren&apos;t modelled yet.
              </p>
            </fieldset>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <NumberInput
                label="Employment income (T4)"
                prefix="$"
                suffix="/yr"
                value={draft.employmentIncome}
                placeholder="85,000"
                onChange={(v) => set({ employmentIncome: v })}
                error={err("employmentIncome")}
                hint="Gross salary or wages before deductions."
              />
              <NumberInput
                label="Self-employment / contract income"
                prefix="$"
                suffix="/yr"
                value={draft.selfEmploymentIncome}
                placeholder="0"
                onChange={(v) => set({ selfEmploymentIncome: v })}
                error={err("selfEmploymentIncome")}
                hint="Net income after business expenses. You pay both halves of CPP on this."
              />
              <NumberInput
                label="Other income"
                prefix="$"
                suffix="/yr"
                value={draft.otherIncome}
                placeholder="0"
                onChange={(v) => set({ otherIncome: v })}
                error={err("otherIncome")}
                hint="Interest, taxable investment income, etc."
              />
              <NumberInput
                label="Incorporated business income"
                prefix="$"
                suffix="/yr"
                value={draft.businessIncome}
                placeholder="0"
                onChange={(v) => set({ businessIncome: v })}
                error={err("businessIncome")}
                hint="Active income kept in your corporation (taxed at the small-business rate)."
              />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <NumberInput
                label="RRSP contribution"
                prefix="$"
                suffix="/yr"
                value={draft.rrspDeduction}
                placeholder="5,000"
                onChange={(v) => set({ rrspDeduction: v })}
                error={err("rrspDeduction")}
                hint="Lowers your taxable income."
              />
              <NumberInput
                label="Current savings toward a home"
                prefix="$"
                value={draft.currentSavings}
                placeholder="25,000"
                onChange={(v) => set({ currentSavings: v })}
                error={err("currentSavings")}
                hint="What you've already set aside for a down payment."
              />
              <NumberInput
                label="Monthly amount you can save"
                prefix="$"
                suffix="/mo"
                value={draft.monthlySavings}
                placeholder="1,200"
                onChange={(v) => set({ monthlySavings: v })}
                error={err("monthlySavings")}
                hint="Used to estimate how long until you hit your down-payment goal."
              />
              <NumberInput
                label="Other monthly debt payments"
                prefix="$"
                suffix="/mo"
                value={draft.monthlyDebtPayments}
                placeholder="400"
                onChange={(v) => set({ monthlyDebtPayments: v })}
                error={err("monthlyDebtPayments")}
                hint="Car, student loans, credit cards. Affects what you can borrow."
              />
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <NumberInput
                label="Target home price"
                prefix="$"
                value={draft.homePrice}
                placeholder="650,000"
                onChange={(v) => set({ homePrice: v })}
                error={err("homePrice")}
                hint="The home you're modelling. We'll also show what you can afford."
              />
              <NumberInput
                label="Down-payment goal"
                prefix="$"
                value={draft.downPaymentTarget}
                placeholder="130,000"
                onChange={(v) => set({ downPaymentTarget: v })}
                error={err("downPaymentTarget")}
                hint="20% of the price avoids CMHC insurance. On $650k that's $130,000."
              />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <NumberInput
                  label="Mortgage rate"
                  suffix="%"
                  group={false}
                  value={draft.mortgageRate}
                  placeholder="4.75"
                  onChange={(v) => set({ mortgageRate: v })}
                  error={err("mortgageRate")}
                />
                <NumberInput
                  label="Amortization"
                  suffix="yrs"
                  group={false}
                  decimals={0}
                  value={draft.amortizationYears}
                  placeholder="25"
                  onChange={(v) => set({ amortizationYears: Math.round(v) })}
                  error={err("amortizationYears")}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <NumberInput
                label="Property tax"
                prefix="$"
                suffix="/yr"
                value={draft.annualPropertyTax}
                placeholder="4,200"
                onChange={(v) => set({ annualPropertyTax: v })}
                error={err("annualPropertyTax")}
              />
              <NumberInput
                label="Home insurance"
                prefix="$"
                suffix="/yr"
                value={draft.annualHomeInsurance}
                placeholder="1,500"
                onChange={(v) => set({ annualHomeInsurance: v })}
                error={err("annualHomeInsurance")}
              />
              <NumberInput
                label="Utilities"
                prefix="$"
                suffix="/mo"
                value={draft.monthlyUtilities}
                placeholder="250"
                onChange={(v) => set({ monthlyUtilities: v })}
                error={err("monthlyUtilities")}
              />
              <NumberInput
                label="Condo / maintenance"
                prefix="$"
                suffix="/mo"
                value={draft.monthlyCondoFees}
                placeholder="0"
                onChange={(v) => set({ monthlyCondoFees: v })}
                error={err("monthlyCondoFees")}
              />
            </div>
          )}
        </div>

        {stepHasErrors && showErrors && (
          <p role="alert" className="mt-4 text-sm font-medium text-danger">
            Please fix the highlighted fields to continue.
          </p>
        )}
        {serverError && (
          <p role="alert" className="mt-4 text-sm font-medium text-danger">
            {serverError}
          </p>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink disabled:invisible"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={next}
            disabled={submitting}
            data-testid={isLast ? "see-analysis" : "wizard-next"}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting ? "Analyzing…" : isLast ? "See my analysis →" : "Continue →"}
          </button>
        </div>
      </div>

      {/* Demo shortcut */}
      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={onDemo}
          data-testid="try-demo"
          className="text-sm font-medium text-accent underline decoration-accent/30 underline-offset-4 transition-colors hover:decoration-accent"
        >
          Or skip ahead — fill everything with demo values
        </button>
      </div>
    </div>
  );
}
