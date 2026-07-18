"use client";

/**
 * Accessible inline term explanation. Renders a small "?" trigger that reveals
 * a plain-language definition on hover and keyboard focus. The definition is
 * associated with the trigger via aria-describedby so screen readers announce
 * it, and it is dismissible with Escape.
 */

import { useId, useState, useRef, useEffect, useLayoutEffect } from "react";

export function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // Keep the (centered) tooltip inside the viewport: if it would overflow the
  // left or right edge, nudge it back by the overflow amount plus an 8px margin.
  useLayoutEffect(() => {
    if (!open || !tipRef.current) {
      setShift(0);
      return;
    }
    const rect = tipRef.current.getBoundingClientRect();
    const margin = 8;
    let next = 0;
    if (rect.right > window.innerWidth - margin) next = window.innerWidth - margin - rect.right;
    else if (rect.left < margin) next = margin - rect.left;
    if (next !== 0) setShift((s) => s + next);
  }, [open]);

  return (
    <span ref={wrapRef} className="relative inline-flex items-center align-middle">
      <button
        type="button"
        aria-label={`What is ${label}?`}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="relative ml-1 grid h-4 w-4 place-items-center rounded-full border border-line-strong text-[10px] font-semibold text-ink-soft transition-colors after:absolute after:-inset-1 after:content-[''] hover:border-accent hover:text-accent"
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          ref={tipRef}
          role="tooltip"
          style={{ transform: `translateX(calc(-50% + ${shift}px))` }}
          className="absolute bottom-full left-1/2 z-30 mb-2 w-60 max-w-[calc(100vw-1rem)] rounded-lg border border-line bg-surface p-3 text-xs leading-relaxed text-ink-soft shadow-[var(--shadow-md)]"
          onMouseEnter={() => setOpen(true)}
        >
          {children}
        </span>
      )}
    </span>
  );
}
