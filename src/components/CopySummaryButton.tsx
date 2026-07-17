"use client";

import { useState } from "react";

/**
 * Copies a plain-text summary to the clipboard with transient feedback and a
 * graceful fallback when the Clipboard API is unavailable.
 */
export function CopySummaryButton({ getText }: { getText: () => string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  async function copy() {
    const text = getText();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("Clipboard API unavailable");
      }
      setState("copied");
    } catch {
      setState("error");
    }
    setTimeout(() => setState("idle"), 2200);
  }

  return (
    <button
      type="button"
      onClick={copy}
      data-testid="copy-summary"
      aria-live="polite"
      className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
    >
      {state === "copied" ? "Copied ✓" : state === "error" ? "Press ⌘/Ctrl+C" : "Copy summary"}
    </button>
  );
}
