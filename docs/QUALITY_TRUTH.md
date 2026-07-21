# Quality truth handoff

**Verified on:** 2026-07-21  
**Repository state:** `a966285eee6da936995014098df3be371adfc8f5` on `main`

| Claim | Verified state |
| --- | --- |
| Unit tests | 130 passing Vitest tests in 14 files |
| Browser tests | 17 passing Playwright tests: 13 functional flows + 4 screenshot captures |
| Static gates | ESLint and `tsc --noEmit` pass |
| Production build | `next build` passes |
| CI | Runs lint, typecheck, units, build, and Chromium Playwright on PRs and pushes to `main` |
| Failure diagnostics | CI retains Playwright HTML report and test-result artifacts for 7 days after a failed browser run |
| Solo and couple behaviour | Implemented and tested; couple mode computes each person's income-tax result before household aggregation |
| Local fallback | Browser-tested by forcing `/api/analyze` to return HTTP 500 |
| CSV export | Pure generator unit-tested and browser download tested |
| PDF export | Browser print action is exposed; generated PDF content is not automatedly asserted |
| Responsive evidence | 390 px no-horizontal-overflow assertion plus 1280/768/390/320 screenshot captures |

## Do not claim

Do not describe this application or its tests as financial, tax, mortgage,
legal, lender-grade, regulatory, certified, or coverage-complete. It is an
Ontario-only educational demonstration with the limitations documented in the
[engineering-quality report](ENGINEERING_QUALITY.md).

## Rerun source of truth

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```
