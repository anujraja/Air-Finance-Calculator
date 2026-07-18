# Interview Demo — HomeCost Canada

A pocket guide for demoing this project and talking about it with confidence.
It's an Ontario 2026 tax + affordability + home-cost planner: answer a few
questions, get a full financial picture.

---

## 90-second demonstration script

> **0:00 — Frame it.** "HomeCost Canada helps a normal person — an employee, a
> contractor, or a one-person founder — see their whole money picture: take-home
> pay after tax, the home they can afford, how long to save a down payment, and
> the real monthly cost of that home. It's an educational demo built on 2026
> Ontario tax rules, and that's stated throughout."

> **0:15 — The flow.** "You answer five short grouped steps — how you earn,
> your income, savings and debts, your home goal, and its costs. Inputs format
> with commas as you type and validate inline. But to keep this quick, I'll hit
> **Demo**, which fills realistic values and runs the analysis."

> **0:30 — Income & tax.** "Here's the analysis. This person nets about $8,300 a
> month. The breakdown shows federal tax, Ontario tax — including the surtax and
> health premium — CPP, and EI, with their average rate and their marginal rate,
> the tax on the next dollar. The math handles the tricky parts: semi-annual CPP,
> the CPP credit-versus-deduction split, and Ontario's surtax."

> **0:50 — Business + affordability.** "They also have incorporated income, so
> there's a corporate card at the small-business rate. Affordability is the part
> people care about: using lender GDS/TDS ratios and the federal stress test, we
> show the maximum home price they'd qualify for — and flag honestly that their
> $780k target is above it."

> **1:10 — Savings + mortgage.** "The savings plan says they'll hit their
> down-payment goal in about four and a half years, with a projection chart. And
> the target-home section gives the full mortgage: monthly payment, total
> interest, where each dollar goes, and the amortization curve."

> **1:25 — Depth + trust.** "There's also a two-scenario mortgage comparison, a
> Copy-summary export, and it's fully responsive down to 320px. Under the hood
> it's Next.js, TypeScript, a tax engine that's independent of the UI and
> verified to the cent, and a Playwright test for this exact flow."

---

## Five technical decisions I can explain

1. **A UI-independent calculation core, verified to the cent.** All math lives in
   `src/lib/engine` (mortgage) and `src/lib/tax` (income/corporate/affordability/
   savings), free of any React import. It's pinned by unit tests to hand-computed
   references — $100k T4 → $73,996 take-home; $500k @ 5%/25yr → $2,908.02/mo — so
   correctness is provable and reusable on client and server alike.

2. **Getting the hard Canadian tax details right.** Semi-annual mortgage
   compounding, the CPP base-credit vs enhancement-deduction split, self-employed
   paying both CPP halves, the Ontario surtax computed *after* non-refundable
   credits, and the health premium on taxable income — these are exactly the
   things a naive calculator gets wrong, and each is unit-tested.

3. **One Zod schema, validated on client and server.** The same `profileSchema`
   gates the wizard (instant per-step errors) and the `/api/analyze` route
   (authoritative). Rules can't drift; the engine never sees unsafe input.

4. **A number input that actually behaves.** `NumberInput` keeps an internal
   display string so a field can be fully cleared (a `0` no longer sticks), shows
   thousands separators live while preserving the caret, and folds its unit into
   the accessible name. It fixed a real "can't clear the 0" bug.

5. **Ship-today persistence with a scale-later seam.** The profile saves to
   localStorage; named storage sits behind a `ScenarioStore` interface with a
   documented Postgres swap — no UI changes required. Deliberate and reversible.

---

## Likely interviewer questions (and my answers)

- **"How do I know the tax numbers are right?"** Every 2026 figure is in one
  sourced constants file, and the engine is pinned to hand-computed benchmarks in
  the tests. I verified $100k and $250k cases by hand against published
  calculators — they match to the dollar, including the surtax.

- **"Why only Ontario / only 2026?"** A deliberate scope choice: correctness over
  breadth. The engine is structured as province/year constants, so adding a
  province is a data change, not a rewrite. I'd rather ship one jurisdiction
  that's exactly right than ten that are roughly wrong.

- **"Isn't this financial advice?"** No, and that's intentional. I left out CMHC
  tables, salary-vs-dividend integration, and benefit credits because they need
  verified primary sources or cross the line into advice. Every assumption is
  shown and the disclaimer is everywhere.

- **"Why a serverless route if the math is pure?"** It's the real architecture: a
  single validation source of truth, an API other clients could call, and a clean
  seam for server-only work (persistence, rate lookups). The client also gets
  instant feedback where it matters.

- **"What was the hardest part?"** The CPP credit-versus-deduction split and
  making the affordability solver converge — property tax depends on the home
  price, which depends on the mortgage, so it's a fixed-point iteration that has
  to provably terminate.

---

## Limitations & sensible future improvements

**Limitations (by design or scope):**
- Ontario + 2026 only; constant interest rate; monthly payments.
- Personal credits beyond the BPA and most benefits aren't modelled.
- The mixed employment/self-employment CPP split is a documented approximation.
- Persistence is per-browser (localStorage).

**Future improvements, roughly prioritized:**
1. **More provinces / tax years** as constant tables, with a year/province picker.
2. **Salary-vs-dividend optimizer** for incorporated founders (personal +
   corporate integration).
3. **RRSP/FHSA/TFSA modelling** — show the tax saved and the optimal contribution.
4. **Postgres persistence** with shareable, named plans via URL.
5. **Accelerated mortgage payments** and lump-sum prepayments.
6. **More accessibility polish** — richer live-region messaging and a full
   screen-reader pass on the charts.
