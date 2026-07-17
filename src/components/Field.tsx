"use client";

/**
 * Labelled numeric input with accessible error wiring. The label is always
 * associated with the control; when an error is present it is exposed via
 * aria-invalid + aria-describedby and announced politely.
 */

import { useId } from "react";
import { InfoTip } from "./InfoTip";

interface FieldProps {
  label: string;
  value: number | string;
  onChange: (value: string) => void;
  error?: string;
  /** Prefix adornment, e.g. "$". */
  prefix?: string;
  /** Suffix adornment, e.g. "%" or "years". */
  suffix?: string;
  step?: string;
  min?: number;
  max?: number;
  explanation?: React.ReactNode;
  inputMode?: "numeric" | "decimal";
}

export function Field({
  label,
  value,
  onChange,
  error,
  prefix,
  suffix,
  step = "any",
  min,
  max,
  explanation,
  inputMode = "decimal",
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center text-sm font-medium text-ink">
        {label}
        {explanation ? <InfoTip label={label}>{explanation}</InfoTip> : null}
      </label>
      <div
        className={`flex items-center rounded-lg border bg-surface px-3 transition-colors focus-within:border-accent ${
          error ? "border-danger" : "border-line-strong"
        }`}
      >
        {prefix ? (
          <span aria-hidden className="mr-1 select-none text-sm text-ink-faint">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          type="number"
          inputMode={inputMode}
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="w-full bg-transparent py-2.5 font-mono text-[15px] tabular-nums text-ink outline-none placeholder:text-ink-faint [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {suffix ? (
          <span aria-hidden className="ml-1 select-none text-sm text-ink-faint">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
