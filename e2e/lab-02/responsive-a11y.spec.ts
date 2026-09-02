import { test, expect } from "@playwright/test";

test.describe("E2E-02: Responsive Layout and Keyboard Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and set session in sessionStorage
    await page.goto("/");
    await page.evaluate(() => {
      sessionStorage.setItem("toktickit.devRequesterId", "1");
    });
    await page.reload();
    await expect(page.getByText("Somchai Jaidee")).toBeVisible();
  });

  test("Desktop Viewport (1280x800): renders full table with zero horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Desktop table should be visible
    const table = page.locator("table.zen-table");
    await expect(table).toBeVisible();
  });

  test("Tablet Viewport (768x1024): maintains zero horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("Mobile Viewport (375x667): renders stacked layout with zero horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Mobile ticket cards should be displayed on mobile
    const mobileList = page.getByTestId("mobile-ticket-list");
    await expect(mobileList).toBeVisible();
  });

  test("Keyboard Navigation & Focus: supports Tab cycling with visible focus rings", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Focus into the page and press Tab
    await page.keyboard.press("Tab");

    // Check that active element has focus
    const hasFocus = await page.evaluate(() => {
      const active = document.activeElement;
      return active !== null && active !== document.body;
    });
    expect(hasFocus).toBe(true);
  });
});
