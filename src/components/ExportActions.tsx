"use client";

import type { FinancialProfile, ProfileAnalysis } from "@/lib/tax/profile";
import { buildAnalysisCsv, analysisCsvFilename } from "@/lib/export";

/**
 * Two secondary export actions for the analysis view, styled to match
 * `CopySummaryButton`:
 *  - "Download report (PDF)" opens the browser print dialog (Save as PDF); the
 *    `@media print` rules in globals.css turn the live view into a clean report.
 *  - "Download CSV" builds a raw-number CSV from the pure `buildAnalysisCsv`
 *    helper and downloads it via a Blob + object URL. No library, no new deps.
 */
const buttonClass =
  "inline-flex items-center gap-2 rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-sm font-medium text-ink shadow-[var(--shadow-sm)] transition-all duration-200 hover:border-accent hover:text-accent hover:shadow-[var(--shadow-md)] active:translate-y-px";

export function ExportActions({
  profile,
  analysis,
}: {
  profile: FinancialProfile;
  analysis: ProfileAnalysis;
}) {
  function downloadCsv() {
    // Prepend a UTF-8 BOM so Excel reads accented characters correctly.
    const csv = "﻿" + buildAnalysisCsv(profile, analysis);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = analysisCsvFilename();
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => window.print()}
        data-testid="export-pdf"
        className={buttonClass}
      >
        Download report (PDF)
      </button>
      <button type="button" onClick={downloadCsv} data-testid="export-csv" className={buttonClass}>
        Download CSV
      </button>
    </>
  );
}
