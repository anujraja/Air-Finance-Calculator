# Engineering quality evidence

This report describes what is verified in the repository. It is not a claim of
financial, tax, mortgage, legal, lender, or regulatory accuracy.

## Verified snapshot

Verified locally on 2026-07-21 against commit `a966285eee6da936995014098df3be371adfc8f5`:

- **130 Vitest unit tests** in 14 test files.
- **17 Playwright tests**: 13 functional browser flows and four screenshot
  captures.
- ESLint, strict TypeScript checking, the unit suite, the browser suite, and a
  production build completed successfully.

Counts are a test-run snapshot, not a coverage percentage or a promise that a
future revision will have the same count. The commands below are the source of
truth for rerunning them.

## What the tests exercise

The pure engine tests pin Canadian semi-annual mortgage compounding, a known
payment reference, a zero-rate loan, a fully-paid-off amortization schedule,
100% down payment, invalid down-payment boundaries, recurring-cost rollups,
and scenario comparisons. The Ontario estimate tests cover income-bracket
calculation, basic-personal-amount phase-out, CPP/EI maxima, surtax, health
premium, self-employment behaviour, corporate-rate bands, affordability stress
rate selection, debt pressure, and savings-goal edge cases.

Profile tests verify both household modes. In couple mode, the two people are
calculated separately for income tax, then their take-home is combined for the
household view and their gross income is used for affordability. This is an
implementation behaviour, not tax advice or a lender qualification decision.

Route tests verify valid, malformed, oversized, invalid, and unsupported
requests for both server endpoints. The browser suite verifies the wizard,
validation feedback, solo and couple analysis, comparison, copy action, and
the local-engine fallback after a forced `/api/analyze` 500 response.

## Export and responsive evidence

CSV generation is pure and unit-tested for RFC-4180-style escaping, stable
header/row layout, raw numeric values, single-person and couple sections,
optional corporate rows, and a dated filename. A browser test confirms that
the user can download a `.csv` file.

The PDF control invokes the browser print flow. The browser suite verifies the
control is available; it intentionally does not automate an operating-system
print dialog or assert a rendered PDF file. That boundary remains a known gap.

The functional responsive test exercises a 390 px analysis viewport and polls
for no horizontal page overflow. Screenshot tests capture wizard and analysis
states at 1280, 768, 390, and 320 px. They are documentation captures, not
visual-diff assertions, and do not replace manual accessibility or cross-browser
review.

## CI gates and local reruns

GitHub Actions runs on pull requests and pushes to `main`, using Node 22 and
`npm ci`. It executes:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install --with-deps chromium
CI=true npm run test:e2e
```

Locally, after `npm install`, run the same checks without Linux dependency
installation:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

For a single gate, `npm run check` runs lint, typecheck, unit tests, and the
production build. On a failed browser run, CI retains `playwright-report/` and
`test-results/` for seven days; those contain the HTML report and any retry
trace, failure screenshot, or retained video.

## Intentional limits and out of scope

- Ontario 2026 estimates only; no assurance of currency, completeness, or
  suitability for a particular person.
- No CMHC premium tables, land-transfer tax, lender-specific underwriting,
  credit checks, benefit calculations, most personal credits, accelerated
  payment modelling, or personal salary/dividend integration.
- Partner 2 supports personal income inputs; incorporated business income is
  modelled only for the primary applicant.
- No test-coverage threshold, financial-data certification, production
  monitoring, load testing, cross-browser matrix, PDF-file-content assertion,
  or pixel-diff visual regression gate.

These limits are explicit so the project demonstrates software-engineering
practice without overstating the authority of its estimates.
