"use client";

import { useState } from "react";

/**
 * Copies a plain-text summary to the clipboard with transient feedback. Uses the
 * async Clipboard API where available and falls back to a hidden-textarea
 * `execCommand("copy")` when it isn't (insecure contexts, missing focus,
 * permission denied), so the copy reliably succeeds across browsers.
 */
function legacyCopy(text: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function CopySummaryButton({ getText }: { getText: () => string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  async function copy() {
    const text = getText();
    let ok = false;
    try {
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) ok = legacyCopy(text);
    setState(ok ? "copied" : "error");
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
      {state === "copied" ? "Copied ✓" : state === "error" ? "Couldn’t copy" : "Copy summary"}
    </button>
  );
}
