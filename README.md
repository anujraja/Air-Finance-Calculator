# HomeCost Canada

**Ontario tax, home affordability & total home-cost planner (2026)**

A guided planner for anyone — an employee, a contractor, or a one-person
founder — to understand their money in one place: take-home pay after Ontario +
federal tax and CPP/EI, the home price they actually qualify for, how long it
will take to save a down payment, and the full monthly cost of the home they're
eyeing. Answer a few grouped questions (or hit **Demo**) and get a clear,
shareable analysis.

> **Educational demonstration only — not financial, tax, or mortgage advice.**
> Estimates use published 2026 Ontario and federal figures and assume a constant
> interest rate. They exclude CMHC insurance, most credits and benefits, and
> lender-specific rules. Ontario is the only province modelled.

---

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` / `npm run typecheck` | ESLint / strict `tsc --noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright flows (auto-builds & serves on :3100) |
| `npm run check` | lint + typecheck + unit + build |

> Browser tests need Chromium once: `npx playwright install chromium`.

---

## What it does

1. **Onboarding wizard** — five short, grouped steps (about you · income · savings
   & debts · home goal · home costs) with per-step validation, a progress bar,
   comma-grouped clearable inputs, inline hints, and a one-click **Demo** that
   fills everything and jumps to the analysis.
2. **Analysis dashboard**
   - **Income & tax** — federal + Ontario tax, CPP/CPP2, EI, take-home per
     month/year, average and marginal rates, with a visual breakdown.
   - **Business** (if you have incorporated income) — corporate small-business
     tax and what's retained.
   - **Affordability** — the maximum home price you'd qualify for using lender
     GDS/TDS ratios and the federal stress test, and whether your target fits.
   - **Down-payment plan** — how long to reach your goal, with a projection chart
     and the monthly amount needed to hit it in five years.
   - **Your target home** — monthly mortgage, total monthly cost, total interest,
     a payment breakdown, and a yearly amortization chart.
3. **Mortgage comparison** — a deep-dive tool to compare two mortgage scenarios
   side by side (monthly and lifetime differences), seeded from your profile.

---

## Architecture

```
src/
  lib/
    engine/            # UI-independent mortgage math (Canadian semi-annual convention)
    tax/               # UI-independent Ontario 2026 tax & finance engine
      constants.ts     #   every 2026 figure, with sources
      incomeTax.ts     #   federal + Ontario tax, CPP/CPP2, EI, surtax, health premium
      corporate.ts     #   CCPC small-business vs general corporate tax
      affordability.ts #   income → max home price (GDS/TDS + stress test)
      savings.ts       #   down-payment goal timeline
      profile.ts       #   unified Zod schema + analyzeProfile orchestrator
    persistence/       # ScenarioStore interface (+ localStorage impl)
    useCalculation.ts  # mortgage-compare hook (validate → debounce → API)
  app/
    api/calculate/     # serverless mortgage endpoint (Zod-validated)
    api/analyze/       # serverless full-profile analysis endpoint
    page.tsx           # wizard ↔ analysis orchestration
  components/          # wizard/, analysis/, and shared UI
e2e/                   # Playwright flows + screenshot capture
```

**Design principle:** every calculation lives in `src/lib/engine` and
`src/lib/tax`, free of any React/Next import, so the math is unit-testable in
isolation and reused identically on the client and in the serverless routes. The
UI never does arithmetic.

---

## The numbers (2026, sourced)

All figures live in [`src/lib/tax/constants.ts`](src/lib/tax/constants.ts) with
source links. Highlights:

- **Federal** brackets 14 / 20.5 / 26 / 29 / 33%; BPA $16,452 (phasing to $14,829
  for top-bracket incomes); lowest rate 14%.
- **Ontario** brackets 5.05 / 9.15 / 11.16 / 12.16 / 13.16%; BPA $12,989; surtax
  20% over $5,818 + 36% over $7,445; Ontario Health Premium.
- **CPP** YMPE $74,600, YAMPE $85,000 — employee 5.95% + CPP2 4% (max $4,646.45);
  self-employed pays both halves. **EI** MIE $68,900 at 1.63% (max $1,123.07).
- **Corporate** small-business rate 11.2% (fed 9% + ON 2.2%, eff. July 1 2026) up
  to $500k; 26.5% general above.
- **Mortgage** Canadian semi-annual compounding:
  `monthlyRate = (1 + annualRate/2)^(2/12) − 1`, standard amortizing payment with
  an explicit zero-rate branch. **Affordability** GDS 39% / TDS 44%, qualifying at
  `max(contract rate + 2%, 5.25%)`.

**Verification.** The engine is pinned by unit tests to hand-computed references:
$100,000 T4 → **$73,996 take-home**; the classic $500k @ 5% / 25yr mortgage →
**$2,908.02/month**. The amortization schedule is checked to fully pay off.

---

## Assumptions & scope (stated, not hidden)

- Constant interest rate; monthly (not accelerated) payments.
- Property tax/insurance entered annually, spread evenly by 12.
- Personal credits beyond the basic personal amount, and most benefits, are not
  modelled. CPP credit-vs-deduction split follows CRA rules; the mixed
  employment/self-employment split is a documented approximation.
- **Deliberately out of scope** (would need verified primary sources / would be
  advice): CMHC premium tables, qualification/stress-test edge rules beyond the
  headline ratios, land-transfer tax, and personal salary-vs-dividend integration.

---

## Testing

- **Unit (Vitest, 98 tests):** the mortgage engine, the tax engine (reference
  take-home cases, CPP/EI maximums, surtax, health premium, BPA phase-out),
  corporate tax, affordability, savings, both Zod schemas, the persistence store,
  and both API routes.
- **Browser (Playwright, 5 flows):** demo → full analysis; manual wizard
  step-through; wizard validation; opening the mortgage comparison; and
  comma-grouped, clearable number entry.
- **Screenshots:** `npx playwright test screenshots` writes the wizard and
  analysis at 1280 / 768 / 390 / 320 into `./screenshots`.

---

## Persistence & deployment

The wizard profile is saved to `localStorage` so a return visit starts where you
left off. Named-scenario storage sits behind a backend-agnostic `ScenarioStore`
interface ([`src/lib/persistence`](src/lib/persistence)); the README's Postgres
notes below show the swap.

<details>
<summary>Postgres swap (schema + steps)</summary>

```sql
create table profiles (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  profile    jsonb not null,   -- validated FinancialProfile
  saved_at   timestamptz not null default now()
);
```

Implement `PostgresStore implements ScenarioStore`, re-validate with the Zod
schema server-side before writing, and swap the store construction. Connection
strings go in `DATABASE_URL` (env only; `.env*` is git-ignored, and no secrets
are committed).
</details>

**Vercel:** standard Next.js App Router — import the repo, keep defaults
(`next build`); `/api/calculate` and `/api/analyze` run as serverless functions.

---

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript (strict, `noUncheckedIndexedAccess`)
· Tailwind CSS v4 · Zod · Recharts · Vitest · Playwright.
