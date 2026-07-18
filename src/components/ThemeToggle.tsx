"use client";

/**
 * Light/dark theme toggle. The initial theme is set before paint by an inline
 * script in the root layout (no flash); this control reads the current state and
 * flips the `data-theme` attribute + persists the choice.
 */

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read the theme the pre-paint inline script already applied to <html>.
    /* eslint-disable react-hooks/set-state-in-effect */
    setTheme(currentTheme());
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("afc-theme", next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className="grid h-9 w-9 place-items-center rounded-lg border border-line-strong bg-surface text-ink-soft shadow-[var(--shadow-sm)] transition-all duration-200 hover:border-accent hover:text-accent hover:shadow-[var(--shadow-md)] active:translate-y-px"
    >
      {/* Render a stable icon until mounted to avoid a hydration mismatch. */}
      <span aria-hidden className="text-base leading-none">
        {mounted && theme === "dark" ? "☾" : "☀"}
      </span>
    </button>
  );
}
