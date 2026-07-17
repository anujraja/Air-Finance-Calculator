import { test, expect } from "@playwright/test";

/**
 * Critical browser flow: load the calculator, confirm both scenarios calculate
 * via the serverless API, edit a scenario and see the comparison update, run a
 * validation-error path, and save a named scenario.
 */

test.describe("HomeCost Canada — calculate and compare", () => {
  test("calculates both scenarios and shows a comparison verdict", async ({ page }) => {
    await page.goto("/");

    // Scenario A default: $650k, 20% down, 5.25% / 25yr → $3,098.77 mortgage.
    await expect(page.getByTestId("monthly-mortgage").first()).toHaveText("$3,098.77", {
      timeout: 15_000,
    });

    // Scenario A total interest for a $520k principal at 5.25% / 25yr.
    await expect(page.getByTestId("total-interest").first()).toHaveText("$409,632.11");

    // A comparison verdict is present (B has a longer term + higher rate → A cheaper).
    await expect(page.getByTestId("compare-verdict")).toContainText("Scenario A costs");
  });

  test("updates the comparison when an input changes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("monthly-mortgage").first()).toHaveText("$3,098.77", {
      timeout: 15_000,
    });

    const before = await page.getByTestId("delta-monthly").textContent();

    // Change Scenario B's interest rate to something extreme and expect the delta to move.
    const rateB = page.getByLabel("Interest rate", { exact: true }).nth(1);
    await rateB.fill("9");

    await expect(page.getByTestId("delta-monthly")).not.toHaveText(before ?? "", {
      timeout: 15_000,
    });
  });

  test("handles invalid input safely", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("monthly-mortgage").first()).toHaveText("$3,098.77", {
      timeout: 15_000,
    });

    // Negative home price in Scenario A must surface an inline error, not crash.
    const homePriceA = page.getByLabel("Home price", { exact: true }).first();
    await homePriceA.fill("-100");
    await expect(page.getByText("Home price must be greater than 0.")).toBeVisible();
  });

  test("preserves the dollar value when toggling down-payment units", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("monthly-mortgage").first()).toHaveText("$3,098.77", {
      timeout: 15_000,
    });

    // Scenario A default is 20% of $650,000 → $520,000 principal.
    // Switching % → $ must keep the $130,000 down payment (principal unchanged),
    // not reinterpret "20" as $20.
    await page
      .locator("article, div")
      .filter({ hasText: "Scenario A" })
      .first();
    const dollarToggleA = page.getByRole("button", { name: "$" }).first();
    await dollarToggleA.click();

    await expect(page.getByTestId("monthly-mortgage").first()).toHaveText("$3,098.77");
  });

  test("saves a named scenario", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("monthly-mortgage").first()).toHaveText("$3,098.77", {
      timeout: 15_000,
    });

    await page.getByLabel("Scenario name").fill("My comparison");
    await page.getByTestId("save-scenario").click();

    await expect(page.getByTestId("saved-list")).toContainText("My comparison");
  });
});
