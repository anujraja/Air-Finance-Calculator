"use client";

/**
 * The full input form for a single mortgage scenario. Controlled by the parent;
 * emits partial updates via onChange. Field-level errors (from client or server
 * validation) are threaded in by name. Uses NumberInput for comma-grouped,
 * clearable entry.
 */

import type { CalculatorInput } from "@/lib/engine/schema";
import type { FieldErrors } from "@/lib/useCalculation";
import { NumberInput } from "./NumberInput";
import { InfoTip } from "./InfoTip";

interface ScenarioFormProps {
  value: CalculatorInput;
  onChange: (patch: Partial<CalculatorInput>) => void;
  fieldErrors: FieldErrors;
}

function firstError(errors: FieldErrors, key: string): string | undefined {
  return errors[key]?.[0];
}

/** Convert the down-payment value when switching between % and $. */
function convertDownPayment(value: CalculatorInput, to: CalculatorInput["downPaymentType"]): number {
  if (value.downPaymentType === to) return value.downPaymentValue;
  if (to === "dollar") return Math.round((value.downPaymentValue / 100) * value.homePrice);
  return value.homePrice > 0
    ? Math.round((value.downPaymentValue / value.homePrice) * 10000) / 100
    : 0;
}

export function ScenarioForm({ value, onChange, fieldErrors }: ScenarioFormProps) {
  return (
    <div className="flex flex-col gap-5">
      <NumberInput
        label="Home price"
        prefix="$"
        value={value.homePrice}
        placeholder="650,000"
        onChange={(v) => onChange({ homePrice: v })}
        error={firstError(fieldErrors, "homePrice")}
        explanation="The purchase price of the home before any down payment."
      />

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
                    onChange({ downPaymentType: type, downPaymentValue: convertDownPayment(value, type) })
                  }
                  className={`px-2.5 py-1 font-medium transition-colors ${
                    active ? "bg-accent text-white" : "bg-surface text-ink-soft hover:bg-surface-2"
                  }`}
                >
                  {type === "percent" ? "%" : "$"}
                </button>
              );
            })}
          </div>
        </div>
        <NumberInput
          label={value.downPaymentType === "percent" ? "Down payment percentage" : "Down payment amount"}
          hideLabel
          prefix={value.downPaymentType === "dollar" ? "$" : undefined}
          suffix={value.downPaymentType === "percent" ? "%" : undefined}
          group={value.downPaymentType === "dollar"}
          value={value.downPaymentValue}
          onChange={(v) => onChange({ downPaymentValue: v })}
          error={firstError(fieldErrors, "downPaymentValue")}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <NumberInput
          label="Interest rate"
          suffix="%"
          group={false}
          value={value.annualInterestRatePercent}
          placeholder="5.25"
          onChange={(v) => onChange({ annualInterestRatePercent: v })}
          error={firstError(fieldErrors, "annualInterestRatePercent")}
          explanation="Nominal annual rate. In Canada, fixed rates are compounded semi-annually, which this calculator accounts for."
        />
        <NumberInput
          label="Amortization"
          suffix="yrs"
          group={false}
          decimals={0}
          value={value.amortizationYears}
          placeholder="25"
          onChange={(v) => onChange({ amortizationYears: Math.round(v) })}
          error={firstError(fieldErrors, "amortizationYears")}
          explanation="The total number of years to fully repay the mortgage. Longer terms lower the monthly payment but increase total interest."
        />
      </div>

      <div className="h-px bg-line" />

      <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">Other ownership costs</p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <NumberInput
          label="Property tax"
          prefix="$"
          suffix="/yr"
          value={value.annualPropertyTax}
          placeholder="4,200"
          onChange={(v) => onChange({ annualPropertyTax: v })}
          error={firstError(fieldErrors, "annualPropertyTax")}
          explanation="Annual municipal property tax. Divided evenly across 12 months here."
        />
        <NumberInput
          label="Home insurance"
          prefix="$"
          suffix="/yr"
          value={value.annualHomeInsurance}
          placeholder="1,500"
          onChange={(v) => onChange({ annualHomeInsurance: v })}
          error={firstError(fieldErrors, "annualHomeInsurance")}
          explanation="Your estimated annual home-insurance premium. This is your own estimate, not a quote."
        />
        <NumberInput
          label="Utilities"
          prefix="$"
          suffix="/mo"
          value={value.monthlyUtilities}
          placeholder="250"
          onChange={(v) => onChange({ monthlyUtilities: v })}
          error={firstError(fieldErrors, "monthlyUtilities")}
          explanation="Monthly estimate for heat, hydro, water, and similar."
        />
        <NumberInput
          label="Condo / maintenance"
          prefix="$"
          suffix="/mo"
          value={value.monthlyCondoFees}
          placeholder="0"
          onChange={(v) => onChange({ monthlyCondoFees: v })}
          error={firstError(fieldErrors, "monthlyCondoFees")}
          explanation="Monthly condo fees or a maintenance set-aside for a freehold home."
        />
      </div>
    </div>
  );
}
