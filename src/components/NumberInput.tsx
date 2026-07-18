"use client";

/**
 * Accessible numeric input with live thousands-grouping.
 *
 * Fixes two real UX problems with a plain `<input type=number>`:
 * 1. You can fully clear the field and type a new value — a `0` no longer
 *    sticks and block you (the field shows empty with a placeholder instead).
 * 2. Large amounts show grouping separators as you type ($1,250,000) with the
 *    caret preserved, so values are readable while being entered.
 *
 * The component is controlled by a numeric `value` and emits a `number`. It
 * stores an internal display string so an empty field can coexist with a
 * numeric value of 0.
 */

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { InfoTip } from "./InfoTip";

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  /** Group the integer part with commas (default true). Off for rates/years. */
  group?: boolean;
  /** Max decimal places to keep while typing (default 2). */
  decimals?: number;
  explanation?: React.ReactNode;
  hideLabel?: boolean;
}

function groupInteger(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Clean a raw string to digits + a single decimal point, capped decimals. */
function clean(raw: string, decimals: number): string {
  let s = raw.replace(/[^\d.]/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
    const [i, d] = s.split(".");
    s = `${i}.${(d ?? "").slice(0, decimals)}`;
  }
  return s;
}

/** Format a cleaned numeric string with grouping. */
function formatCleaned(cleaned: string, group: boolean): string {
  if (cleaned === "") return "";
  const [intPart, decPart] = cleaned.split(".");
  const groupedInt = group ? groupInteger(intPart ?? "") : (intPart ?? "");
  return decPart !== undefined ? `${groupedInt}.${decPart}` : groupedInt;
}

/** Count digit characters in a string (used to preserve the caret). */
function countDigits(s: string): number {
  return (s.match(/\d/g) ?? []).length;
}

/** Caret index in `formatted` after `digitsBefore` digits. */
function caretAfterDigits(formatted: string, digitsBefore: number): number {
  if (digitsBefore <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i]!)) {
      seen++;
      if (seen === digitsBefore) return i + 1;
    }
  }
  return formatted.length;
}

export function NumberInput({
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
  prefix,
  suffix,
  group = true,
  decimals = 2,
  explanation,
  hideLabel = false,
}: NumberInputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [display, setDisplay] = useState("");
  const pendingCaret = useRef<number | null>(null);

  // Sync the display from the numeric value when not actively editing. This is a
  // deliberate external-value sync (e.g. demo prefill or loading a saved
  // profile); while focused the user's own draft string is the source of truth.
  useEffect(() => {
    if (focused) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplay(value === 0 ? "" : formatCleaned(clean(String(value), decimals), group));
  }, [value, focused, group, decimals]);

  // Restore the caret after a grouped reformat.
  useLayoutEffect(() => {
    if (pendingCaret.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    }
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const rawCaret = el.selectionStart ?? el.value.length;
    const digitsBeforeCaret = countDigits(el.value.slice(0, rawCaret));
    const cleaned = clean(el.value, decimals);
    const formatted = formatCleaned(cleaned, group);
    setDisplay(formatted);
    pendingCaret.current = caretAfterDigits(formatted, digitsBeforeCaret);

    const num = cleaned === "" || cleaned === "." ? 0 : Number(cleaned);
    onChange(Number.isNaN(num) ? 0 : num);
  }

  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  // Fold the visual unit (prefix/suffix, which are aria-hidden) into the
  // accessible name so screen-reader users know they're entering dollars, a
  // percentage, years, etc.
  const unit =
    suffix === "%"
      ? "percent"
      : suffix === "/yr"
        ? "dollars per year"
        : suffix === "/mo"
          ? "dollars per month"
          : suffix === "yrs"
            ? "years"
            : prefix === "$"
              ? "dollars"
              : "";
  const accessibleName = unit ? `${label}, in ${unit}` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`flex items-center ${hideLabel ? "sr-only" : ""}`}>
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {explanation && !hideLabel ? <InfoTip label={label}>{explanation}</InfoTip> : null}
      </div>
      <div
        className={`flex items-center rounded-lg border bg-surface px-3 shadow-[var(--shadow-sm)] transition-all duration-200 focus-within:border-accent focus-within:shadow-[0_0_0_2px_var(--accent)] ${
          error ? "border-danger" : "border-line-strong hover:border-ink-faint"
        }`}
      >
        {prefix ? (
          <span aria-hidden className="mr-1 select-none text-sm text-ink-faint">
            {prefix}
          </span>
        ) : null}
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={display}
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label={accessibleName}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="no-focus-ring w-full rounded bg-transparent py-2.5 font-mono text-[15px] tabular-nums text-ink outline-none placeholder:text-ink-faint focus-visible:outline-none"
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
      ) : hint ? (
        <p id={hintId} className="text-xs text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
