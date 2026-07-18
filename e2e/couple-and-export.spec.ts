import { test, expect } from "@playwright/test";

/**
 * Couple/partner mode and the report/CSV export.
 *
 * Single-mode behaviour is covered (and pinned to $11,808.08) in
 * calculate-and-compare.spec.ts; these tests exercise the household toggle, the
 * per-partner take-home split, and the export actions. Engine-verified couple
 * figures (COUPLE_DEMO: 165k + 135k salaries) come from the couple-mode plan.
 */

test.describe("HomeCost Canada — couple mode", () => {
  test("couple demo produces a household analysis", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("household-couple").click();
    await page.getByTestId("try-demo").click();

    // Household take-home = Partner 1 + Partner 2, taxed per person then summed.
    await expect(page.getByTestId("takehome-monthly")).toHaveText("$18,328.28", {
      timeout: 15_000,
    });

    // Per-partner split renders with each earner's take-home.
    await expect(page.getByTestId("tax-split")).toBeVisible();
    await expect(page.getByTestId("partner-1-takehome")).toHaveText("$119,109.39");
    await expect(page.getByTestId("partner-2-takehome")).toHaveText("$100,829.99");

    // Affordability uses combined income and the million-dollar max is shown.
    await expect(page.getByTestId("affordability-combined-note")).toBeVisible();
    await expect(page.getByTestId("max-home-price")).toBeVisible();
    // Combined income raises affordability into seven figures (GDS-limited ~$1.47M).
    await expect(page.getByTestId("max-home-price")).toHaveText(/\$1,\d{3},\d{3}/);
  });

  test("manual couple flow: toggle, fill both partners, reach analysis", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("household-couple").click();

    // Step 1 → step 2 (income); partner inputs appear only in couple mode.
    await page.getByTestId("wizard-next").click();
    await page.getByLabel("Partner 2 employment income (T4)").fill("90000");

    // Advance through the remaining steps and analyze.
    for (let i = 0; i < 3; i++) await page.getByTestId("wizard-next").click();
    await page.getByTestId("see-analysis").click();

    await expect(page.getByTestId("takehome-monthly")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("tax-split")).toBeVisible();
    await expect(page.getByTestId("partner-1-takehome")).toBeVisible();
    await expect(page.getByTestId("partner-2-takehome")).toBeVisible();

    // A two-earner household differs from the single-mode demo figure.
    await expect(page.getByTestId("takehome-monthly")).not.toHaveText("$11,808.08");
  });
});

test.describe("HomeCost Canada — export", () => {
  test("CSV export downloads a .csv file and the PDF action is offered", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("try-demo").click();
    await expect(page.getByTestId("takehome-monthly")).toBeVisible({ timeout: 15_000 });

    // The PDF export button is present (it calls window.print(); we do not open
    // the print dialog here).
    await expect(page.getByTestId("export-pdf")).toBeVisible();

    // Clicking CSV triggers a browser download with a .csv filename.
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-csv").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});

test.describe("HomeCost Canada — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("demo analysis renders on a phone without horizontal overflow", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("try-demo").click();
    await expect(page.getByTestId("takehome-monthly")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("max-home-price")).toBeVisible();

    // The analysis must fit the viewport width — no sideways scrolling. Poll
    // rather than sampling once: the Recharts ResponsiveContainer charts settle
    // asynchronously, so a single read right after `max-home-price` appears can
    // catch a transient >1px overflow on a slow (single-worker CI) runner.
    await expect
      .poll(
        () =>
          page.evaluate(
            () => document.scrollingElement!.scrollWidth <= window.innerWidth + 1,
          ),
        { timeout: 5000 },
      )
      .toBe(true);
  });
});
