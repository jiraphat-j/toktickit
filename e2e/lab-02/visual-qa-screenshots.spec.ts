import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const ARTIFACTS_DIR = path.resolve(process.cwd(), "artifacts/lab-02/screenshots");

// Ensure directories exist
const DIRS = [
  path.join(ARTIFACTS_DIR, "create-ticket"),
  path.join(ARTIFACTS_DIR, "my-tickets"),
  path.join(ARTIFACTS_DIR, "ticket-detail"),
];

for (const dir of DIRS) {
  fs.mkdirSync(dir, { recursive: true });
}

test.describe("Visual QA: Automated Screenshot Capture", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      sessionStorage.setItem("toktickit.devRequesterId", "1");
    });
    await page.reload();
    await expect(page.getByText("Somchai Jaidee")).toBeVisible();
  });

  test("Capture all 11 required visual QA screenshots", async ({ page }) => {
    // -----------------------------------------------------------------------
    // 1. Create Ticket Screenshots
    // -----------------------------------------------------------------------
    await page.getByRole("button", { name: "Create Ticket", exact: true }).click();
    await expect(page.getByText("New Support Ticket")).toBeVisible();

    // 01-initial.png
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "create-ticket/01-initial.png"),
      fullPage: true,
    });

    // 02-validation.png (trigger validation without input)
    await page.getByRole("button", { name: "Submit Ticket", exact: true }).click();
    await expect(page.getByText("Summary is required")).toBeVisible();
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "create-ticket/02-validation.png"),
      fullPage: true,
    });

    // 03-submitting.png & 04-success.png
    await page.getByLabel(/summary/i).fill("Visual QA Automated Test Ticket");
    await page.getByLabel(/category/i).selectOption({ index: 1 });
    await page.getByLabel(/related system/i).selectOption({ index: 1 });
    await page.getByLabel(/^description/i).fill("Detailed description for visual QA screenshot capture verification.");
    await page.getByRole("radio", { name: "HIGH" }).check();

    // Intercept submit to capture busy state
    let unblockRoute: () => void;
    const routeHold = new Promise<void>((resolve) => {
      unblockRoute = resolve;
    });

    await page.route("**/api/tickets", async (route) => {
      if (route.request().method() === "POST") {
        await routeHold;
        await route.continue();
      } else {
        await route.continue();
      }
    });

    await page.getByRole("button", { name: "Submit Ticket", exact: true }).click();
    await expect(page.getByRole("button", { name: /submitting/i })).toBeVisible();
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "create-ticket/03-submitting.png"),
      fullPage: true,
    });

    unblockRoute!();
    await page.waitForTimeout(300);
    await page.unroute("**/api/tickets");

    // 04-success.png
    await expect(page.getByText("Ticket Created Successfully!")).toBeVisible();
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "create-ticket/04-success.png"),
      fullPage: true,
    });

    // 05-api-failure.png (mock 500 failure and verify preserved form values)
    await page.getByRole("button", { name: "Create Another Ticket", exact: true }).click();
    await page.getByLabel(/summary/i).fill("Preserved Summary on Server Error");
    await page.getByLabel(/category/i).selectOption({ index: 1 });
    await page.getByLabel(/related system/i).selectOption({ index: 1 });
    await page.getByLabel(/^description/i).fill("This description must stay preserved after backend failure.");

    await page.route("**/api/tickets", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            error: { code: "INTERNAL_SERVER_ERROR", message: "Database connection failed temporarily." },
          }),
        });
      } else {
        await route.continue();
      }
    });
    await page.getByRole("button", { name: "Submit Ticket", exact: true }).click();
    await expect(page.locator(".zen-alert-danger")).toBeVisible();
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "create-ticket/05-api-failure.png"),
      fullPage: true,
    });
    await page.unroute("**/api/tickets");

    // -----------------------------------------------------------------------
    // 2. My Tickets Screenshots
    // -----------------------------------------------------------------------
    await page.getByRole("button", { name: "My Tickets", exact: true }).click();
    await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
    await page.waitForTimeout(500);

    // 01-table-desktop.png (1280x800)
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "my-tickets/01-table-desktop.png"),
      fullPage: true,
    });

    // 02-cards-mobile.png (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "my-tickets/02-cards-mobile.png"),
      fullPage: true,
    });

    // Restore Desktop Viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // 03-empty-state.png (mock 0 tickets ever)
    await page.route("**/api/tickets*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [],
          meta: { page: 1, limit: 8, total: 0, totalPages: 1 },
        }),
      });
    });
    await page.reload();
    await expect(page.getByTestId("empty-state")).toBeVisible();
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "my-tickets/03-empty-state.png"),
      fullPage: true,
    });
    await page.unroute("**/api/tickets*");

    // 04-no-results.png (filter returns 0 matches)
    await page.reload();
    await page.waitForTimeout(500);
    const searchInput = page.getByPlaceholder("Search Ticket # or Summary...");
    await searchInput.fill("ZZZZ_NON_EXISTENT_QUERY_SEARCH");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("no-results-state")).toBeVisible();
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "my-tickets/04-no-results.png"),
      fullPage: true,
    });

    // -----------------------------------------------------------------------
    // 3. Ticket Detail Screenshots
    // -----------------------------------------------------------------------
    await searchInput.clear();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);

    // Click first ticket in table
    await page.locator(".zen-table-link").first().click();
    await expect(page.getByTestId("ticket-detail-screen")).toBeVisible();

    // 01-detail-desktop.png
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "ticket-detail/01-detail-desktop.png"),
      fullPage: true,
    });

    // 02-attachment-lifecycle.png (open soft removal modal or capture section)
    const removeBtn = page.getByRole("button", { name: /^remove /i }).first();
    if (await removeBtn.count() > 0) {
      await removeBtn.click();
      await expect(page.getByTestId("removal-modal")).toBeVisible();
      await page.getByLabel(/removal reason/i).fill("Screenshot documentation: File superseded by updated version.");
    }
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "ticket-detail/02-attachment-lifecycle.png"),
      fullPage: true,
    });
  });
});
