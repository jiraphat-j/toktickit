import { test, expect } from "@playwright/test";
import { PrismaClient } from "../../server/node_modules/@prisma/client/index.js";

const prisma = new PrismaClient();

test.describe("Lab 4 E2E: Role Dashboards, Metrics & Drill-Downs (Issue #64 / E2E-03)", () => {
  test.beforeAll(async () => {
    // Ensure test users are active with known password
    const refUser = await prisma.user.findUnique({ where: { email: "suda.s@kmutt.ac.th" } });
    if (refUser) {
      await prisma.user.updateMany({
        where: { email: "thanaporn.b@toktickit.local" },
        data: { isActive: true, mustChangePassword: false, passwordHash: refUser.passwordHash },
      });
      await prisma.user.updateMany({
        where: { email: "somchai.j@kmutt.ac.th" },
        data: { isActive: true, mustChangePassword: false, passwordHash: refUser.passwordHash },
      });
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
  });

  test("DASH-E2E-01: IT Staff dashboard displays metrics, breakdowns, recent activity, and supports drill-down to queue (AC-10, AC-11, BR-17, BR-18)", async ({ page }) => {
    // 1. Login as IT Staff
    await page.getByLabel(/email address/i).fill("thanaporn.b@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("button", { name: "Ticket Queue" })).toBeVisible();

    // 2. Open Staff Dashboard
    const dashboardTab = page.getByRole("button", { name: "Dashboard" });
    await expect(dashboardTab).toBeVisible();
    await dashboardTab.click();

    // 3. Verify Staff Dashboard container and header
    const dashboard = page.locator('[data-testid="staff-dashboard"]');
    await expect(dashboard).toBeVisible();
    await expect(page.locator("h2")).toContainText("IT Staff Operational Dashboard");

    // 4. Verify 4 operational metric cards
    const cardUnassigned = page.locator('[data-testid="card-unassigned"]');
    const cardMyTickets = page.locator('[data-testid="card-my-tickets"]');
    const cardCriticalHigh = page.locator('[data-testid="card-high-priority"]');
    const cardMyActions = page.locator('[data-testid="card-my-actions"]');

    await expect(cardUnassigned).toBeVisible();
    await expect(cardMyTickets).toBeVisible();
    await expect(cardCriticalHigh).toBeVisible();
    await expect(cardMyActions).toBeVisible();

    // Verify numerical values are rendered
    await expect(cardUnassigned.locator('[data-testid="count-unassigned"]')).not.toBeEmpty();

    // 5. Verify breakdown sections and recent tickets table
    await expect(page.getByRole("heading", { name: /Ticket Status Breakdown/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Recently Updated Tickets/i })).toBeVisible();

    // 6. Drill-down: Click "View Unassigned Queue →" on card-unassigned
    const drillDownBtn = cardUnassigned.getByRole("button", { name: /View Unassigned Queue/i });
    await drillDownBtn.click();

    // Verify navigation landed on Ticket Queue
    await expect(page.locator('[data-testid="staff-ticket-queue"]')).toBeVisible();

    // 7. Return to Dashboard and test header navigation drill-down
    await dashboardTab.click();
    await expect(dashboard).toBeVisible();

    const queueHeaderBtn = dashboard.getByRole("button", { name: /Ticket Queue →/i });
    await queueHeaderBtn.click();
    await expect(page.locator('[data-testid="staff-ticket-queue"]')).toBeVisible();
  });

  test("DASH-E2E-02: Requester dashboard displays personal metrics, attention tickets, and drill-downs with backend data isolation (AC-09, AC-11, BR-16)", async ({ page }) => {
    // 1. Login as Requester Somchai
    await page.getByLabel(/email address/i).fill("somchai.j@kmutt.ac.th");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("button", { name: "My Tickets" })).toBeVisible();

    // 2. Open Requester Dashboard
    const dashboardTab = page.getByRole("button", { name: "Dashboard" });
    await expect(dashboardTab).toBeVisible();
    await dashboardTab.click();

    // 3. Verify Requester Dashboard container and personalized greeting
    const dashboard = page.locator('[data-testid="requester-dashboard"]');
    await expect(dashboard).toBeVisible();
    await expect(dashboard).toContainText("My Support Dashboard");
    await expect(dashboard).toContainText("Somchai Jaidee");

    // 4. Verify 4 requester metric cards
    const cardOpen = page.locator('[data-testid="card-open-tickets"]');
    const cardWaiting = page.locator('[data-testid="card-waiting-requester"]');
    const cardUpdated = page.locator('[data-testid="card-recently-updated"]');
    const cardResolved = page.locator('[data-testid="card-recently-resolved"]');

    await expect(cardOpen).toBeVisible();
    await expect(cardWaiting).toBeVisible();
    await expect(cardUpdated).toBeVisible();
    await expect(cardResolved).toBeVisible();

    // 5. Drill-down: Click Open Tickets card to navigate to My Tickets
    await cardOpen.click();
    await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();

    // 6. Return to Dashboard and test "+ Create New Ticket" button
    await dashboardTab.click();
    await expect(dashboard).toBeVisible();

    const createBtn = dashboard.getByRole("button", { name: /Create New Ticket/i });
    await createBtn.click();
    await expect(page.getByRole("heading", { name: "New Support Ticket" })).toBeVisible();

    // 7. Security & Data Isolation: Verify Requester cannot access Staff Dashboard API
    const forbiddenRes = await page.request.get("http://localhost:3000/api/dashboard/staff");
    expect(forbiddenRes.status()).toBe(403);
    const body = await forbiddenRes.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  test("DASH-E2E-03: Responsive layout verification across Desktop, Tablet, and Mobile viewports with zero horizontal overflow (AC-13, RESP-01)", async ({ page }) => {
    // 1. Login as IT Staff
    await page.getByLabel(/email address/i).fill("thanaporn.b@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("button", { name: "Ticket Queue" })).toBeVisible();

    await page.getByRole("button", { name: "Dashboard" }).click();
    await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible();

    const viewports = [
      { name: "Desktop", width: 1280, height: 800 },
      { name: "Tablet", width: 768, height: 1024 },
      { name: "Mobile", width: 375, height: 667 },
    ];

    // Check Staff Dashboard responsiveness and zero overflow across viewports
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(200);

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasOverflow, `IT Staff Dashboard horizontal overflow detected on ${vp.name} (${vp.width}px)`).toBe(false);

      // Verify metric cards remain visible
      await expect(page.locator('[data-testid="card-unassigned"]')).toBeVisible();
    }

    // 2. Switch to Requester Somchai and verify Requester Dashboard responsiveness
    await page.getByRole("button", { name: "Sign Out" }).click();
    await page.getByLabel(/email address/i).fill("somchai.j@kmutt.ac.th");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("button", { name: "My Tickets" })).toBeVisible();

    await page.getByRole("button", { name: "Dashboard" }).click();
    await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible();

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(200);

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasOverflow, `Requester Dashboard horizontal overflow detected on ${vp.name} (${vp.width}px)`).toBe(false);

      // Verify metric cards remain visible
      await expect(page.locator('[data-testid="card-open-tickets"]')).toBeVisible();
    }
  });
});
