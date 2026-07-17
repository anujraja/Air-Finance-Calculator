# Interview Demo — HomeCost Canada

A pocket guide for demonstrating this project live and talking about it with
confidence.

---

## 90-second demonstration script

> **0:00 — Frame it.** "This is HomeCost Canada, a Canadian mortgage and total
> home-cost calculator. It models the *real* monthly cost of owning a home and
> lets you compare two scenarios side by side. It's an educational demo — not
> financial advice — and that disclaimer is visible throughout."

> **0:15 — Show the default result.** "It loads with a sensible default: a
> $650,000 home, 20% down, 5.25% over 25 years. Scenario A's all-in monthly cost
> is about $3,824 — that's the mortgage payment plus property tax, insurance,
> utilities, and condo fees, and you can see exactly where each dollar goes in
> this breakdown bar."

> **0:35 — The Canadian detail.** "The rate math uses the Canadian convention —
> fixed rates are compounded semi-annually, so the effective monthly rate is
> `(1 + rate/2)^(2/12) − 1`, not a naive rate/12. The amortization chart shows
> the balance falling to zero and interest accumulating over the full term."

> **0:55 — Compare.** "Scenario B is a longer 30-year term at a higher rate.
> The comparison panel calls it immediately: Scenario A costs about $290,000
> less over the life of the mortgage. If I change B's rate, everything
> recalculates live — through a validated serverless endpoint."

> **1:15 — Robustness + save.** "Bad input is handled safely — a negative price
> gives an inline error, not a crash. And I can name and save this comparison to
> reopen later. There's also a Copy summary button for a plain-text export."

> **1:30 — Close.** "Under the hood it's Next.js, TypeScript, a fully
> unit-tested calculation engine that's independent of the UI, and a Playwright
> test for this exact flow."

---

## Five technical decisions I can explain

1. **A UI-independent calculation engine.** All financial math lives in
   `src/lib/engine` and imports nothing from React or Next. Why: correctness is
   the highest risk in a financial tool, so the math is isolated, exhaustively
   unit-tested, and reused verbatim on both client and server. The UI never does
   arithmetic.

2. **One Zod schema, validated on both client and server.** The same
   `calculatorInputSchema` gates the form (instant field errors) and the
   `/api/calculate` route (authoritative). Validation rules can't drift between
   the two, and the engine can never receive unsafe input regardless of caller.

3. **Serverless calculation with a race-safe hook.** `useCalculation` debounces
   input, POSTs to the API, and discards stale responses via a monotonic
   request-id guard plus `AbortController` — so fast typing can never render an
   out-of-date result. It exposes an honest `idle/loading/success/error` state
   machine that drives the loading, error, and "showing last valid result" UI.

4. **Persistence behind a swappable interface.** Saving talks only to a
   `ScenarioStore` interface. The shipped `LocalStorageStore` needs zero infra;
   moving to Postgres is a new class implementing the same interface plus a thin
   route — no UI changes. The README documents the schema and swap steps. This
   shows I can ship today and scale later without a rewrite.

5. **Correct Canadian rate math, with the zero-interest edge case handled.**
   Semi-annual compounding is converted properly, the amortizing-payment formula
   has an explicit `principal / n` branch for a 0% rate, and the yearly schedule
   is simulated month-by-month and asserted to fully amortize. The canonical
   benchmark ($500k @ 5% / 25yr ≈ $2,908.02) is a pinned unit test.

---

## Likely interviewer questions (and my answers)

- **"Why compute on the server at all — isn't the math cheap?"** It is, and the
  client computes instantly for preview. Routing through a validated serverless
  endpoint demonstrates the real architecture: a single source of validation
  truth, an API other clients could call, and a clean seam where heavier
  server-only logic (rate lookups, saved-scenario persistence) would live.

- **"How do you know the numbers are right?"** The engine is pinned to the
  published Canadian benchmark and the schedule is checked to reconcile — final
  balance zero, cumulative principal equal to the original principal. `npm run
  test` runs it all; the reference case is one assertion in `mortgage.test.ts`.

- **"What happens with weird input — negatives, huge numbers, 0%?"** All
  rejected or handled: bounds in the Zod schema (client + server), a zero-rate
  branch, a 100%-down (zero-principal) path, and an amortization cap that also
  bounds the only loop. There are unit tests for each.

- **"Why localStorage instead of a database?"** No safe DB credentials were
  provisioned for this standalone demo, so I shipped a fully working app behind a
  `ScenarioStore` interface and documented the exact Postgres swap. It's a
  deliberate, reversible choice — not a limitation baked into the UI.

- **"Is this financial advice?"** No, and that's intentional. I deliberately left
  out CMHC premium tables, stress-test rules, and tax guidance because those
  require verified primary sources and change over time. It's transparent
  scenario modelling with every assumption stated.

- **"How is it accessible?"** Labelled inputs with `aria-invalid`/`aria-describedby`
  error wiring, a keyboard-dismissible term-explanation tooltip, visible focus
  rings, and the chart ships a screen-reader data table alongside the visual.

---

## Limitations & sensible future improvements

**Current limitations (by design or scope):**
- Constant interest rate — no renewal modelling or variable-rate paths.
- Monthly payments only (no accelerated bi-weekly option).
- Excludes CMHC insurance, land-transfer tax, and closing costs.
- Persistence is per-browser (localStorage), not synced across devices.

**Future improvements, roughly in priority order:**
1. **Postgres persistence** via the documented `ScenarioStore` swap, with saved
   scenarios shareable by URL.
2. **Accelerated payment frequencies** (bi-weekly, weekly) and lump-sum
   prepayments, with the interest saved shown against the base case.
3. **CMHC mortgage-insurance premiums** — but only sourced from CMHC's published
   tables and clearly dated, to stay defensible.
4. **Rate-scenario modelling** — a renewal rate at year N to show payment shock.
5. **Shareable/exportable results** — PDF export and a shareable link in
   addition to the existing Copy summary.
6. **Chart interactivity** — toggle principal-vs-interest stacking and hover
   scrubbing on the amortization curve.
