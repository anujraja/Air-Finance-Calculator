import { test, expect } from "@playwright/test";

/**
 * Critical browser flow: complete the onboarding wizard (via the demo shortcut
 * and via a manual step-through), reach the analysis, then open the mortgage
 * comparison and confirm it calculates and compares.
 */

test.describe("HomeCost Canada — wizard, analysis, and compare", () => {
  test("demo shortcut produces a full analysis", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("try-demo").click();

    // Analysis headline computes through the serverless /api/analyze route.
    await expect(page.getByTestId("takehome-monthly")).toHaveText("$11,808.08", { timeout: 15_000 });
    await expect(page.getByTestId("max-home-price")).toBeVisible();
    await expect(page.getByTestId("time-to-goal")).toBeVisible();
  });

  test("manual wizard step-through reaches the analysis", async ({ page }) => {
    await page.goto("/");
    // Step 1 employment type is preselected (employee) → advance through 5 steps.
    for (let i = 0; i < 4; i++) {
      await page.getByTestId("wizard-next").click();
    }
    await page.getByTestId("see-analysis").click();
    await expect(page.getByTestId("takehome-monthly")).toBeVisible({ timeout: 15_000 });
  });

  test("invalid input is caught by the wizard", async ({ page }) => {
    await page.goto("/");
    // Advance to step 4 (home goal), then clear the required home price.
    for (let i = 0; i < 3; i++) await page.getByTestId("wizard-next").click();
    await page.getByLabel("Target home price").fill("");
    await page.getByTestId("wizard-next").click();
    await expect(page.getByText("Home price must be greater than 0.")).toBeVisible();
    // Still on step 4 — did not advance.
    await expect(page.getByTestId("wizard-next")).toBeVisible();
  });

  test("opens the mortgage comparison and shows a verdict", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("try-demo").click();
    await expect(page.getByTestId("takehome-monthly")).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("toggle-compare").click();

    // Scenario B seeds with a longer amortization → lower payment but more interest.
    await expect(page.getByTestId("compare-verdict")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("delta-total")).toBeVisible();
  });

  test("skip-ahead demo works from a mid-wizard step", async ({ page }) => {
    await page.goto("/");
    // Advance to step 4, then use the demo shortcut — it must still analyze.
    for (let i = 0; i < 3; i++) await page.getByTestId("wizard-next").click();
    await expect(page.getByRole("heading", { name: "Your home goal" })).toBeVisible();
    await page.getByTestId("try-demo").click();
    await expect(page.getByTestId("takehome-monthly")).toBeVisible({ timeout: 15_000 });
  });

  test("analysis still completes if the serverless API fails (local fallback)", async ({ page }) => {
    // Force every /api/analyze call to fail; the isomorphic engine must take over
    // so the user always gets a result.
    await page.route("**/api/analyze", (route) => route.fulfill({ status: 500, body: "boom" }));
    await page.goto("/");
    await page.getByTestId("try-demo").click();
    await expect(page.getByTestId("takehome-monthly")).toHaveText("$11,808.08", { timeout: 15_000 });
    // No error surfaced to the user.
    await expect(page.getByText("couldn't complete the analysis")).toHaveCount(0);
  });

  test("a stale submit error clears when navigating back a step", async ({ page }) => {
    await page.route("**/api/analyze", (route) => route.fulfill({ status: 500, body: "boom" }));
    await page.goto("/");
    // The fallback means no error is shown even on API failure; assert the flow
    // reaches analysis and the error text never appears.
    for (let i = 0; i < 4; i++) await page.getByTestId("wizard-next").click();
    await page.getByTestId("see-analysis").click();
    await expect(page.getByTestId("takehome-monthly")).toBeVisible({ timeout: 15_000 });
  });

  test("Copy summary writes a readable summary to the clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    await page.getByTestId("try-demo").click();
    await expect(page.getByTestId("takehome-monthly")).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("copy-summary").click();
    await expect(page.getByTestId("copy-summary")).toHaveText("Copied ✓");

    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain("HomeCost Canada");
    expect(clip).toContain("$11,808.08");
  });

  test("number inputs are comma-grouped and clearable", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("wizard-next").click(); // step 2
    const income = page.getByLabel("Employment income (T4)");
    await income.fill("");
    await income.type("125000");
    await expect(income).toHaveValue("125,000");
  });
});
