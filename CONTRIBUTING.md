# Contributing to HomeCost Canada

Thanks for your interest! This is an educational demo, but it's held to
production standards — contributions are welcome.

## Getting started

```bash
npm install
npm run dev                        # http://localhost:3000
npx playwright install chromium    # once, for browser tests
```

## Before you open a PR

Run the full gate locally — CI runs the same thing:

```bash
npm run check        # lint + strict typecheck + unit tests + production build
npm run test:e2e     # Playwright flows (auto-builds and serves on :3100)
```

## House rules

1. **The UI never does arithmetic.** All math lives in `src/lib/engine` and
   `src/lib/tax` — pure TypeScript with no React/Next imports, unit-tested in
   isolation, and shared identically by the client and the serverless routes.
2. **Every 2026 figure is sourced.** Tax and affordability constants live in
   [`src/lib/tax/constants.ts`](src/lib/tax/constants.ts) with source links.
   Don't add unsourced numbers.
3. **Tests accompany behavior.** New engine logic needs unit tests (Vitest);
   new user-facing flows need a Playwright test. Reference values should be
   hand-computed, not copied from the engine's own output.
4. **Accessibility matters.** Keyboard focus, labels, and WCAG AA contrast are
   maintained in both themes — including the pure-black dark theme.
5. **Scope honestly.** This is not financial advice, and features that would
   require it (CMHC premium tables, salary-vs-dividend planning, etc.) are
   deliberately out of scope — see the README.

## Reporting issues

Open a GitHub issue with reproduction steps (or a failing test — even better).
For calculation discrepancies, include the input profile and the source you're
checking against.
