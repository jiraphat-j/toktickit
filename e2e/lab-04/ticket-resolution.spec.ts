import { test, expect } from "@playwright/test";
import { PrismaClient } from "../../server/node_modules/@prisma/client/index.js";

const prisma = new PrismaClient();

test.describe("Lab 4 E2E: Ticket Resolution Workflow & Resolution Gate Enforcement (Issue #64 / E2E-02)", () => {
  let ticket2Id: number;
  let ticket3Id: number;

  test.beforeAll(async () => {
    // 1. Ensure test users are active with known password
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

    // 2. Prepare ticket TKT-2026-000002 for gate testing (0 actions, IN_PROGRESS)
    const ticket2 = await prisma.ticket.findUnique({
      where: { ticketNumber: "TKT-2026-000002" },
    });
    if (ticket2) {
      ticket2Id = ticket2.id;
      await prisma.actionTaken.deleteMany({ where: { ticketId: ticket2.id } });
      await prisma.ticket.update({
        where: { id: ticket2.id },
        data: {
          currentStatus: "IN_PROGRESS",
          problemAppearsResolved: false,
        },
      });
    }

    // 3. Prepare ticket TKT-2026-000003 for advisory testing (0 actions, IN_PROGRESS)
    const ticket3 = await prisma.ticket.findUnique({
      where: { ticketNumber: "TKT-2026-000003" },
    });
    if (ticket3) {
      ticket3Id = ticket3.id;
      await prisma.actionTaken.deleteMany({ where: { ticketId: ticket3.id } });
      await prisma.ticket.update({
        where: { id: ticket3.id },
        data: {
          currentStatus: "IN_PROGRESS",
          problemAppearsResolved: false,
        },
      });
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    if (ticket3Id) {
      await prisma.ticket.update({
        where: { id: ticket3Id },
        data: {
          currentStatus: "IN_PROGRESS",
          problemAppearsResolved: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    await page.goto("/");
  });

  test("RES-E2E-01: Resolution Gate blocks resolution when 0 Actions Taken exist, and unlocks when action is logged (AC-06, AC-07, BR-13)", async ({ page }) => {
    // 1. Login as IT Staff
    await page.getByLabel(/email address/i).fill("thanaporn.b@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("button", { name: "Ticket Queue" })).toBeVisible();

    // 2. Navigate to Ticket Queue and open TKT-2026-000002
    await page.getByRole("button", { name: "Ticket Queue" }).click();
    await page.getByRole("button", { name: "Open ticket TKT-2026-000002" }).click();
    await expect(page.locator('[data-testid="staff-ticket-detail"]')).toBeVisible();

    // 3. Verify Resolution Gate: 0 actions -> Resolve button disabled + warning banner visible
    const resolveBtn = page.locator('[data-testid="transition-to-resolved"]');
    await expect(resolveBtn).toBeVisible();
    await expect(resolveBtn).toBeDisabled();

    const warningBanner = page.locator('[data-testid="resolution-gate-warning"]');
    await expect(warningBanner).toBeVisible();
    await expect(warningBanner).toContainText("Resolution Gate");
    await expect(warningBanner).toContainText("At least 1 Action Taken must be logged before resolving this ticket");

    // 4. Log Action Taken
    await page.locator('[data-testid="log-action-btn"]').click();
    const modal = page.locator('[data-testid="action-modal"]');
    await expect(modal).toBeVisible();

    await page.locator('[data-testid="action-description-input"]').fill("Replaced faulty network cable and re-crimped RJ45 jack.");
    await page.locator('[data-testid="action-result-input"]').fill("Gigabit Ethernet connection restored with zero packet loss.");
    await page.locator('[data-testid="submit-action-btn"]').click();
    await expect(modal).not.toBeVisible();

    // 5. Verify Resolution Gate is unlocked: Warning banner gone, Resolve button enabled
    await expect(warningBanner).not.toBeVisible();
    await expect(resolveBtn).toBeEnabled();

    // 6. Execute transition to RESOLVED
    await resolveBtn.click();

    // 7. Verify status successfully transitioned to RESOLVED
    const successBanner = page.locator('[data-testid="action-success-banner"]');
    await expect(successBanner).toBeVisible();
    await expect(successBanner).toContainText("Status transitioned to RESOLVED.");

    const statusBadge = page.locator('.zen-status-resolved');
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toHaveText("RESOLVED");
  });

  test("RES-E2E-02: Backend API enforces Resolution Gate rejecting bypass attempts with 400 Bad Request (WF-02, BR-13)", async ({ page }) => {
    // 1. Login as IT Staff
    await page.getByLabel(/email address/i).fill("thanaporn.b@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("button", { name: "Ticket Queue" })).toBeVisible();

    // 2. Direct API bypass attempt to transition TKT-2026-000003 (0 actions) to RESOLVED
    const response = await page.request.patch(`http://localhost:3000/api/tickets/${ticket3Id}/status`, {
      data: {
        status: "RESOLVED",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("RESOLUTION_GATE_FAILED");
    expect(body.error.message).toContain("Action Taken");
  });

  test("RES-E2E-03: Requester advisory indicator does not alter ticket status (AC-08, BR-14)", async ({ page }) => {
    // 1. Login as Requester Somchai (who owns TKT-2026-000003)
    await page.getByLabel(/email address/i).fill("somchai.j@kmutt.ac.th");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("button", { name: "My Tickets" })).toBeVisible();

    // 2. Open My Tickets and view TKT-2026-000003
    await page.getByRole("button", { name: "My Tickets" }).click();
    const ticketRow = page.locator('tr:has-text("TKT-2026-000003")').first();
    await expect(ticketRow).toBeVisible();
    await ticketRow.locator(".zen-table-link").first().click();

    // 3. Click Mark Problem as Resolved button
    const advisoryBtn = page.locator('[data-testid="toggle-problem-resolved-btn"]');
    await expect(advisoryBtn).toBeVisible();
    await expect(advisoryBtn).toHaveText(/Mark Problem as Resolved/i);

    const togglePromise = page.waitForResponse((r) => r.url().includes("resolve-indication") && r.status() === 200);
    await advisoryBtn.click();
    await togglePromise;

    await expect(advisoryBtn).toHaveText(/Undo Problem Resolved/i);
    await expect(page.locator('[data-testid="problem-resolved-badge"]')).toBeVisible();

    // 4. Verify ticket status remains IN_PROGRESS (NOT RESOLVED)
    await expect(page.getByTestId("ticket-status")).toHaveText("IN_PROGRESS");

    // 5. Sign out and login as IT Staff to verify staff sees the indicator while status stays IN_PROGRESS
    await page.getByRole("button", { name: "Sign Out" }).click();

    await page.getByLabel(/email address/i).fill("thanaporn.b@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    await page.getByRole("button", { name: "Ticket Queue" }).click();
    await page.getByRole("button", { name: "Open ticket TKT-2026-000003" }).click();

    // Verify indicator is visible in staff detail but status is still IN_PROGRESS
    await expect(page.locator('[data-testid="staff-resolved-indicator"]')).toBeVisible();
    await expect(page.locator('.zen-status-in-progress')).toBeVisible();
  });
});
