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
    await expect(page.getByTestId("takehome-monthly")).toHaveText("$8,296.35", { timeout: 15_000 });
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

  test("number inputs are comma-grouped and clearable", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("wizard-next").click(); // step 2
    const income = page.getByLabel("Employment income (T4)");
    await income.fill("");
    await income.type("125000");
    await expect(income).toHaveValue("125,000");
  });
});
