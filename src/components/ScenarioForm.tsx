"use client";

/**
 * The full input form for a single scenario. Controlled entirely by the parent;
 * emits partial updates via onChange. Field-level errors (from client or server
 * validation) are threaded in by name.
 */

import type { CalculatorInput } from "@/lib/engine/schema";
import type { FieldErrors } from "@/lib/useCalculation";
import { Field } from "./Field";
import { InfoTip } from "./InfoTip";

interface ScenarioFormProps {
  value: CalculatorInput;
  onChange: (patch: Partial<CalculatorInput>) => void;
  fieldErrors: FieldErrors;
}

/** Coerce a raw input string to a number, tolerating an empty field as 0. */
function num(raw: string): number {
  if (raw.trim() === "") return 0;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function firstError(errors: FieldErrors, key: string): string | undefined {
  return errors[key]?.[0];
}

/**
 * Convert the down-payment value when the user switches between % and $ so the
 * dollar amount stays the same (e.g. 20% of $650k ↔ $130,000), rather than
 * silently reinterpreting the number.
 */
function convertDownPayment(value: CalculatorInput, to: CalculatorInput["downPaymentType"]): number {
  if (value.downPaymentType === to) return value.downPaymentValue;
  if (to === "dollar") {
    return Math.round((value.downPaymentValue / 100) * value.homePrice);
  }
  // dollar → percent
  return value.homePrice > 0
    ? Math.round((value.downPaymentValue / value.homePrice) * 10000) / 100
    : 0;
}

export function ScenarioForm({ value, onChange, fieldErrors }: ScenarioFormProps) {
  return (
    <div className="flex flex-col gap-5">
      <Field
        label="Home price"
        prefix="$"
        value={value.homePrice}
        min={0}
        onChange={(v) => onChange({ homePrice: num(v) })}
        error={firstError(fieldErrors, "homePrice")}
        explanation="The purchase price of the home before any down payment."
      />

      {/* Down payment: dollar / percent toggle + value */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center text-sm font-medium text-ink">
            Down payment
            <InfoTip label="down payment">
              The cash you pay upfront. A larger down payment reduces the loan
              principal and the interest you pay over time.
            </InfoTip>
          </span>
          <div
            role="group"
            aria-label="Down payment unit"
            className="flex overflow-hidden rounded-md border border-line-strong text-xs"
          >
            {(["percent", "dollar"] as const).map((type) => {
              const active = value.downPaymentType === type;
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    onChange({
                      downPaymentType: type,
                      downPaymentValue: convertDownPayment(value, type),
                    })
                  }
                  className={`px-2.5 py-1 font-medium transition-colors ${
                    active
                      ? "bg-accent text-white"
                      : "bg-surface text-ink-soft hover:bg-surface-2"
                  }`}
                >
                  {type === "percent" ? "%" : "$"}
                </button>
              );
            })}
          </div>
        </div>
        <Field
          label={value.downPaymentType === "percent" ? "Down payment percentage" : "Down payment amount"}
          hideLabel
          prefix={value.downPaymentType === "dollar" ? "$" : undefined}
          suffix={value.downPaymentType === "percent" ? "%" : undefined}
          value={value.downPaymentValue}
          min={0}
          onChange={(v) => onChange({ downPaymentValue: num(v) })}
          error={firstError(fieldErrors, "downPaymentValue")}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Interest rate"
          suffix="%"
          value={value.annualInterestRatePercent}
          min={0}
          step="0.01"
          onChange={(v) => onChange({ annualInterestRatePercent: num(v) })}
          error={firstError(fieldErrors, "annualInterestRatePercent")}
          explanation="Nominal annual rate. In Canada, fixed rates are compounded semi-annually, which this calculator accounts for."
        />
        <Field
          label="Amortization"
          suffix="yrs"
          value={value.amortizationYears}
          min={1}
          max={40}
          step="1"
          inputMode="numeric"
          onChange={(v) => onChange({ amortizationYears: Math.round(num(v)) })}
          error={firstError(fieldErrors, "amortizationYears")}
          explanation="The total number of years to fully repay the mortgage. Longer terms lower the monthly payment but increase total interest."
        />
      </div>

      <div className="h-px bg-line" />

      <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
        Other ownership costs
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Property tax"
          prefix="$"
          suffix="/yr"
          value={value.annualPropertyTax}
          min={0}
          onChange={(v) => onChange({ annualPropertyTax: num(v) })}
          error={firstError(fieldErrors, "annualPropertyTax")}
          explanation="Annual municipal property tax. Divided evenly across 12 months here."
        />
        <Field
          label="Home insurance"
          prefix="$"
          suffix="/yr"
          value={value.annualHomeInsurance}
          min={0}
          onChange={(v) => onChange({ annualHomeInsurance: num(v) })}
          error={firstError(fieldErrors, "annualHomeInsurance")}
          explanation="Your estimated annual home-insurance premium. This is your own estimate, not a quote."
        />
        <Field
          label="Utilities"
          prefix="$"
          suffix="/mo"
          value={value.monthlyUtilities}
          min={0}
          onChange={(v) => onChange({ monthlyUtilities: num(v) })}
          error={firstError(fieldErrors, "monthlyUtilities")}
          explanation="Monthly estimate for heat, hydro, water, and similar."
        />
        <Field
          label="Condo / maintenance"
          prefix="$"
          suffix="/mo"
          value={value.monthlyCondoFees}
          min={0}
          onChange={(v) => onChange({ monthlyCondoFees: num(v) })}
          error={firstError(fieldErrors, "monthlyCondoFees")}
          explanation="Monthly condo fees or a maintenance set-aside for a freehold home."
        />
      </div>
    </div>
  );
}
