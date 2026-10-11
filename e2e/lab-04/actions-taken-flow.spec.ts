import { test, expect } from "@playwright/test";
import { PrismaClient } from "../../server/node_modules/@prisma/client/index.js";

const prisma = new PrismaClient();

test.describe("Lab 4 E2E: Actions Taken Lifecycle & Role Visibility Flow (Issue #64 / E2E-01)", () => {
  let ticket1Id: number;

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

    // 2. Prepare test ticket TKT-2026-000001
    const ticket1 = await prisma.ticket.findUnique({
      where: { ticketNumber: "TKT-2026-000001" },
    });
    if (ticket1) {
      ticket1Id = ticket1.id;
      // Clean up existing actions taken for pristine test lifecycle
      await prisma.actionTaken.deleteMany({ where: { ticketId: ticket1.id } });
      await prisma.ticket.update({
        where: { id: ticket1.id },
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
    await page.goto("/");
  });

  test("ACT-E2E-01: IT Staff logs in, views ticket detail, and opens Log Action Taken modal with auto-performer", async ({ page }) => {
    // 1. Login as IT Staff
    await page.getByLabel(/email address/i).fill("thanaporn.b@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("button", { name: "Ticket Queue" })).toBeVisible();

    // 2. Navigate to Ticket Queue and open TKT-2026-000001
    await page.getByRole("button", { name: "Ticket Queue" }).click();
    await expect(page.locator('[data-testid="staff-ticket-queue"]')).toBeVisible();

    // Click the open ticket button
    await page.getByRole("button", { name: "Open ticket TKT-2026-000001" }).click();

    // 3. Inspect Staff Ticket Detail
    await expect(page.locator('[data-testid="staff-ticket-detail"]')).toBeVisible();
    await expect(page.locator('[data-testid="actions-taken-panel"]')).toBeVisible();

    // 4. Click Log Action Taken button
    const logActionBtn = page.locator('[data-testid="log-action-btn"]');
    await expect(logActionBtn).toBeVisible();
    await logActionBtn.click();

    // 5. Verify Modal opens with auto-attributed performer
    const modal = page.locator('[data-testid="action-modal"]');
    await expect(modal).toBeVisible();
    await expect(page.locator('[data-testid="modal-title"]')).toHaveText("Log Action Taken");

    const performerInput = page.locator('[data-testid="action-performer-input"]');
    await expect(performerInput).toHaveValue(/Thanaporn Boontarikmas/i);
    await expect(performerInput).toBeDisabled();

    // Close modal
    await page.getByRole("button", { name: "Close" }).click();
    await expect(modal).not.toBeVisible();
  });

  test("ACT-E2E-02: Form validation enforces description, result, and conditional follow-up note", async ({ page }) => {
    // 1. Login as IT Staff
    await page.getByLabel(/email address/i).fill("thanaporn.b@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    // 2. Open Ticket Detail
    await page.getByRole("button", { name: "Ticket Queue" }).click();
    await page.getByRole("button", { name: "Open ticket TKT-2026-000001" }).click();
    await expect(page.locator('[data-testid="staff-ticket-detail"]')).toBeVisible();

    // 3. Open Modal
    await page.locator('[data-testid="log-action-btn"]').click();
    const modal = page.locator('[data-testid="action-modal"]');
    await expect(modal).toBeVisible();

    // 4. Try submitting empty form
    await page.locator('[data-testid="submit-action-btn"]').click();
    await expect(page.locator('[data-testid="description-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="result-error"]')).toBeVisible();

    // 5. Fill description but check follow-up without note
    await page.locator('[data-testid="action-description-input"]').fill("Diagnosed database deadlock issue.");
    await page.locator('[data-testid="action-result-input"]').fill("Identified locking queries.");
    await page.locator('[data-testid="action-followup-checkbox"]').check();

    await page.locator('[data-testid="submit-action-btn"]').click();
    await expect(page.locator('[data-testid="followup-note-error"]')).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: "Close" }).click();
  });

  test("ACT-E2E-03: Full create and edit lifecycle for Action Taken by IT Staff", async ({ page }) => {
    // 1. Login as IT Staff
    await page.getByLabel(/email address/i).fill("thanaporn.b@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    // 2. Open Ticket Detail
    await page.getByRole("button", { name: "Ticket Queue" }).click();
    await page.getByRole("button", { name: "Open ticket TKT-2026-000001" }).click();
    await expect(page.locator('[data-testid="staff-ticket-detail"]')).toBeVisible();

    // 3. Create Action Taken
    await page.locator('[data-testid="log-action-btn"]').click();
    await page.locator('[data-testid="action-description-input"]').fill("Inspected mail routing daemon and analyzed SMTP gateway logs.");
    await page.locator('[data-testid="action-result-input"]').fill("Found TLS handshake timeout on port 587 and updated cipher suite configuration.");
    await page.locator('[data-testid="action-followup-checkbox"]').check();
    await page.locator('[data-testid="action-followup-note-input"]').fill("Verify next morning outbound queue volume.");
    await page.locator('[data-testid="action-attachment-notes-input"]').fill("smtp-relay-trace.log");

    await page.locator('[data-testid="submit-action-btn"]').click();
    await expect(page.locator('[data-testid="action-modal"]')).not.toBeVisible();

    // 4. Verify Action Taken appears in table
    const table = page.locator('[data-testid="actions-table"]');
    await expect(table).toBeVisible();
    await expect(table).toContainText("Inspected mail routing daemon");
    await expect(table).toContainText("Found TLS handshake timeout");
    await expect(table).toContainText("Thanaporn Boontarikmas");
    await expect(table).toContainText("Required");
    await expect(table).toContainText("Verify next morning outbound queue volume.");
    await expect(table).toContainText("smtp-relay-trace.log");

    // 5. Edit the Action Taken
    const editBtn = page.locator('[data-testid^="edit-action-btn-"]').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    await expect(page.locator('[data-testid="modal-title"]')).toHaveText("Edit Action Taken");
    await page.locator('[data-testid="action-result-input"]').fill("TLS handshake cipher suite updated and successfully verified with test outbound dispatch.");
    await page.locator('[data-testid="submit-action-btn"]').click();
    await expect(page.locator('[data-testid="action-modal"]')).not.toBeVisible();

    // 6. Verify updated result in table
    await expect(table).toContainText("successfully verified with test outbound dispatch.");

    // Sign out
    await page.getByRole("button", { name: "Sign Out" }).click();
  });

  test("ACT-E2E-04: Authorization boundary prevents Requester from creating or editing actions (BR-10, AC-03)", async ({ page }) => {
    // 1. Login as Requester
    await page.getByLabel(/email address/i).fill("suda.s@kmutt.ac.th");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("button", { name: "My Tickets" })).toBeVisible();

    // 2. Requester has no access to staff queue or action logging buttons
    await expect(page.getByRole("button", { name: "Ticket Queue" })).not.toBeVisible();
    await expect(page.locator('[data-testid="log-action-btn"]')).not.toBeVisible();

    // 3. Direct API attempt to create an action taken by Requester is rejected with 403 Forbidden
    const response = await page.request.post(`http://localhost:3000/api/tickets/${ticket1Id}/actions-taken`, {
      data: {
        description: "Requester unauthorized action attempt",
        result: "Should fail with 403",
      },
    });
    expect(response.status()).toBe(403);
  });
});
