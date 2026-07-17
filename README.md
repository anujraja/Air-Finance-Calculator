# HomeCost Canada

**Canadian Mortgage & Total Home-Cost Calculator**

A transparent scenario-modelling tool for the true monthly and lifetime cost of
owning a home in Canada. Enter a purchase price, down payment, rate, and
amortization alongside taxes, insurance, utilities, and condo fees; see the
all-in monthly cost, a full amortization schedule, and a side-by-side comparison
of two scenarios — with every assumption shown in the open.

> **Educational demonstration only — not financial advice.** Results are
> estimates based on the inputs you provide and a constant interest rate. They
> exclude CMHC mortgage insurance, closing costs, renewal rate changes, and
> qualification/stress-test rules.

---

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000
```

### All commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright browser tests (auto-builds & serves on :3100) |
| `npm run check` | lint + typecheck + unit tests + build, in sequence |

> `npm run test:e2e` needs browsers once: `npx playwright install chromium`.

---

## Architecture

```
src/
  lib/
    engine/                 # Pure calculation engine — no React/Next imports
      mortgage.ts           #   Canadian rate conversion, payment, schedule, totals
      schema.ts             #   Zod validation + normalization + defaults
      compare.ts            #   Scenario A vs B deltas
      format.ts             #   CAD / percent formatting (en-CA)
      types.ts              #   Domain types
      *.test.ts             #   Vitest unit tests (co-located)
    persistence/            # Storage behind a swappable interface
      types.ts              #   ScenarioStore contract
      localStorageStore.ts  #   Shipped implementation (browser localStorage)
    useCalculation.ts       # React hook: validate → debounce → POST → state machine
    summary.ts              # Plain-text summary builder ("Copy summary")
  app/
    api/calculate/route.ts  # Serverless POST endpoint (Zod-validated)
    page.tsx                # Orchestrates two scenarios + comparison
    layout.tsx, globals.css # Fonts, design tokens
  components/               # Presentational + interactive UI
e2e/                        # Playwright specs + screenshot capture
```

### Design principle: a UI-independent engine

All financial math lives in `src/lib/engine` and imports nothing from React or
Next. That makes it trivially unit-testable, reusable on both the server (the API
route) and the client (live preview), and safe to reason about in isolation. The
UI never does arithmetic — it only renders results the engine returns.

### Data flow

1. `page.tsx` holds the raw input for Scenario A and Scenario B.
2. `useCalculation(input)` validates client-side with the shared Zod schema
   (instant field errors, no wasted requests), debounces, then `POST`s valid
   input to `/api/calculate`.
3. The route **re-validates with the same schema** and runs the engine — the
   engine can never receive unsafe input regardless of caller.
4. Stale responses are discarded via a request-id guard + `AbortController`, so
   rapid edits always render the latest result.
5. `compareScenarios(a, b)` derives the monthly and lifetime differences.

---

## The mortgage formula

Canadian fixed-rate mortgages are compounded **semi-annually, not in advance**.
To apply a nominal annual rate to a monthly payment we first find the
semi-annual compounding factor, then take its `2/12` power:

```
monthlyRate = (1 + annualRate / 2) ^ (2 / 12) − 1
```

The level monthly payment uses the standard amortizing-loan (annuity) formula,
with the zero-interest case handled as straight-line repayment:

```
payment = principal · r / (1 − (1 + r)^−n)        (r > 0)
payment = principal / n                            (r = 0)
```

where `r = monthlyRate` and `n = amortizationYears × 12`.

**Verification.** The canonical Canadian benchmark — **$500,000 at 5% over 25
years ≈ $2,908.02/month** — is asserted as a unit test
(`src/lib/engine/mortgage.test.ts`). The yearly schedule is simulated month by
month and is checked to fully amortize (final balance = 0, cumulative principal =
original principal).

---

## Assumptions & scope (stated, not hidden)

- Interest rate is **constant** for the full amortization (no renewal changes).
- Property tax and insurance are entered annually and divided evenly by 12.
- Payments are monthly (not accelerated bi-weekly).
- **Deliberately out of scope** (would require verified primary sources and would
  turn this into advice): CMHC mortgage-insurance premium tables, mortgage
  qualification and stress-test rules, land-transfer tax, closing costs, and any
  tax or insurance guidance. The tool is transparent scenario modelling only.

### Input bounds (`src/lib/engine/schema.ts`)

| Field | Rule |
| --- | --- |
| Home price | `> 0`, ≤ $100,000,000 |
| Down payment | ≥ 0; ≤ 100% (percent) or ≤ home price (dollar) |
| Interest rate | 0–25% |
| Amortization | whole number, 1–40 years |
| Taxes / insurance / utilities / fees | ≥ 0, capped |

Invalid, missing, negative, and unrealistic values are rejected on both the
client and the server with a field-specific message.

---

## Testing

- **Unit (Vitest):** the engine (rate conversion, payment, schedule, totals,
  edge cases including 0% and 100%-down), the Zod schema, scenario comparison,
  the localStorage store (including corrupt-data recovery), the summary builder,
  and the API route (200 / 422 / 400 / 405). Run `npm run test`.
- **Browser (Playwright):** the critical calculate-and-compare flow — load,
  verify both scenarios compute via the API, edit an input and watch the delta
  update, trigger a validation error, and save a named scenario. Run
  `npm run test:e2e`.
- **Screenshots:** `npx playwright test screenshots` writes full-page PNGs at
  1280 / 768 / 390 / 320 into `./screenshots`.

---

## Persistence (localStorage today, Postgres-ready)

Saved scenarios are stored in the browser via `LocalStorageStore`, which
implements the backend-agnostic `ScenarioStore` interface
(`src/lib/persistence/types.ts`). The app depends only on that interface, so
moving to Postgres requires **no UI changes** — just a new implementation and a
thin API route.

<details>
<summary>Postgres swap (schema + steps)</summary>

```sql
create table scenarios (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  scenario_a  jsonb not null,   -- validated CalculatorInput
  scenario_b  jsonb not null,
  saved_at    timestamptz not null default now()
);
```

1. Add a `PostgresScenarioStore implements ScenarioStore` that calls API routes
   (`/api/scenarios` GET/POST/DELETE) instead of localStorage.
2. In those routes, re-validate `scenario_a` / `scenario_b` with
   `calculatorInputSchema` before writing (never trust the client).
3. Swap the `new LocalStorageStore()` construction in
   `src/components/SavedScenarios.tsx` for the Postgres store.

Connection strings belong in environment variables (`DATABASE_URL`), never in
the repo. No credentials are committed here; `.env*` is git-ignored.

</details>

---

## Deployment (Vercel)

The app is a standard Next.js App Router project and deploys to Vercel with no
configuration: import the repo, keep the defaults (`next build`), and deploy. The
`/api/calculate` route runs as a serverless function. If Postgres is added, set
`DATABASE_URL` in the Vercel project's environment variables.

---

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript (strict, `noUncheckedIndexedAccess`)
· Tailwind CSS v4 · Zod · Recharts · Vitest · Playwright.
