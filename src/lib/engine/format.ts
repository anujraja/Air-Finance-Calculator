/**
 * Canadian-locale formatting helpers. Centralized so every surface (summary,
 * chart tooltips, comparison table, copied text) formats money and percentages
 * identically.
 */

const cadCurrency = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 2,
});

const cadCurrencyWhole = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-CA", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

/** Format a dollar amount as CAD, e.g. `$2,908.02`. */
export function formatCAD(value: number): string {
  return cadCurrency.format(Number.isFinite(value) ? value : 0);
}

/** Format a dollar amount as CAD with no cents, e.g. `$520,000`. */
export function formatCADWhole(value: number): string {
  return cadCurrencyWhole.format(Number.isFinite(value) ? value : 0);
}

/** Format a 0–1 ratio as a percentage, e.g. `0.2` → `20.0%`. */
export function formatPercent(ratio: number): string {
  return percentFormatter.format(Number.isFinite(ratio) ? ratio : 0);
}

/** Format a signed dollar delta with an explicit sign, e.g. `+$412.55`. */
export function formatSignedCAD(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatCAD(Math.abs(value))}`;
}
