import { test, expect } from "@playwright/test";

/**
 * Deterministic screenshot capture for docs and the interview demo. Writes
 * full-page PNGs of both the wizard and the analysis at four viewport widths.
 * Run with: npx playwright test screenshots.
 */

const WIDTHS = [
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-320", width: 320, height: 720 },
];

for (const vp of WIDTHS) {
  test(`screenshots ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/");

    // Wizard landing.
    await expect(page.getByTestId("try-demo")).toBeVisible();
    await page.screenshot({ path: `screenshots/wizard-${vp.name}.png`, fullPage: true });

    // Full analysis (demo prefill).
    await page.getByTestId("try-demo").click();
    await expect(page.getByTestId("takehome-monthly")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(500); // let charts settle
    await page.screenshot({ path: `screenshots/analysis-${vp.name}.png`, fullPage: true });
  });
}
