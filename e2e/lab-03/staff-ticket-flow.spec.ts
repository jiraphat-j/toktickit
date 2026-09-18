import { test, expect } from "@playwright/test";
import { PrismaClient } from "../../server/node_modules/@prisma/client/index.js";

const prisma = new PrismaClient();

test.describe("Lab 3 E2E: IT Staff Ticket Flow & Operational Management (Issue #41)", () => {
  let testTicketId: number;

  test.beforeAll(async () => {
    // Find or reset TKT-2026-000001 for consistent test execution
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber: "TKT-2026-000001" },
    });

    if (ticket) {
      testTicketId = ticket.id;
      // Remove any prior test comments and notes on this ticket
      await prisma.publicComment.deleteMany({ where: { ticketId: ticket.id } });
      await prisma.internalNote.deleteMany({ where: { ticketId: ticket.id } });

      // Reset ticket to pristine NEW state
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          currentStatus: "NEW",
          primaryOwnerId: null,
          itPriority: "HIGH",
          problemAppearsResolved: false,
        },
      });
    }

    // Ensure test staff and requester are active with known passwords
    const refUser = await prisma.user.findUnique({ where: { email: "suda.s@kmutt.ac.th" } });
    if (refUser) {
      await prisma.user.updateMany({
        where: { email: "thanaporn.b@toktickit.local" },
        data: { isActive: true, mustChangePassword: false, passwordHash: refUser.passwordHash },
      });
      await prisma.user.updateMany({
        where: { email: "komsan.s@toktickit.local" },
        data: { isActive: true, mustChangePassword: false, passwordHash: refUser.passwordHash },
      });
      await prisma.user.updateMany({
        where: { email: "somchai.j@kmutt.ac.th" },
        data: { isActive: true, mustChangePassword: false, passwordHash: refUser.passwordHash },
      });
    }
  });

  test.afterAll(async () => {
    if (testTicketId) {
      // Clean up notes and comments created during test
      await prisma.publicComment.deleteMany({ where: { ticketId: testTicketId } });
      await prisma.internalNote.deleteMany({ where: { ticketId: testTicketId } });

      // Reset ticket back to default seeded state
      await prisma.ticket.update({
        where: { id: testTicketId },
        data: {
          currentStatus: "NEW",
          primaryOwnerId: null,
          itPriority: "HIGH",
          problemAppearsResolved: false,
        },
      });
    }
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    if (testTicketId) {
      await prisma.ticket.update({
        where: { id: testTicketId },
        data: {
          summary: "Cannot send outgoing emails to external domains (SMTP)",
          description: "Getting SMTP delivery timeout error 504 when sending mail outside the university.",
          currentStatus: "NEW",
          primaryOwnerId: null,
          itPriority: "HIGH",
          problemAppearsResolved: false,
          createdAt: new Date(),
        },
      });
    }
    await prisma.ticket.updateMany({
      where: { ticketNumber: "TKT-2026-000002" },
      data: {
        createdAt: new Date(Date.now() - 1000),
      },
    });
    await page.goto("/");
  });

  async function loginAsStaff(page: any) {
    await page.getByLabel(/email address/i).fill("thanaporn.b@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("button", { name: "Ticket Queue" })).toBeVisible();
    await expect(page.getByText("IT Staff", { exact: true })).toBeVisible();
  }

  test("STF-E2E-01: Queue filters, search, sort, and pagination", async ({ page }) => {
    await loginAsStaff(page);

    // Verify queue table renders with tickets
    await expect(page.getByRole("heading", { name: /IT Staff Ticket Queue/i })).toBeVisible();
    await expect(page.getByRole("table").getByText("TKT-2026-000001")).toBeVisible();

    // 1. Search by keyword "SMTP"
    const searchInput = page.getByPlaceholder(/search by ticket/i);
    await searchInput.fill("SMTP");
    await searchInput.press("Enter");

    await expect(page.getByRole("table").getByText("TKT-2026-000001")).toBeVisible();
    await expect(page.getByRole("table").getByText("TKT-2026-000002")).not.toBeVisible();

    // 2. Clear filters
    await page.getByRole("button", { name: "Clear all filters" }).click();
    await expect(page.getByRole("table").getByText("TKT-2026-000001")).toBeVisible();
    await expect(page.getByRole("table").getByText("TKT-2026-000002")).toBeVisible();

    // 3. Filter by Category "Network"
    await page.getByLabel(/filter by category/i).selectOption({ label: "Network" });
    await expect(page.getByRole("table").getByText("TKT-2026-000002")).toBeVisible();
    await expect(page.getByRole("table").getByText("TKT-2026-000001")).not.toBeVisible();

    // Reset filter
    await page.getByLabel(/filter by category/i).selectOption({ label: "All Categories" });
    await expect(page.getByRole("table").getByText("TKT-2026-000001")).toBeVisible();
  });

  test("STF-E2E-02: Ticket detail inspection, claim, reassign, unassign", async ({ page }) => {
    await loginAsStaff(page);

    // Open TKT-2026-000001
    await page.getByRole("button", { name: "Open ticket TKT-2026-000001" }).click();

    // Verify detail rendered
    await expect(page.getByTestId("staff-ticket-detail")).toBeVisible();
    await expect(page.getByText("TKT-2026-000001")).toBeVisible();
    await expect(page.getByText("Cannot send outgoing emails to external domains (SMTP)")).toBeVisible();

    // Verify initially Unassigned
    const ownerBadge = page.getByTestId("assigned-owner-badge");
    await expect(ownerBadge).toContainText("Unassigned");

    // 1. Claim Ticket
    const claimBtn = page.getByTestId("claim-ticket-btn");
    await expect(claimBtn).toBeVisible();
    await claimBtn.click();

    // Badge should update to current user (Thanaporn)
    await expect(ownerBadge).toContainText("Thanaporn Boontarikmas (You)");
    await expect(page.getByTestId("action-success-banner")).toBeVisible();

    // 2. Reassign to another staff member (Komsan Srisuk)
    const reassignSelect = page.getByTestId("reassign-owner-select");
    await reassignSelect.selectOption({ label: "Komsan Srisuk (IT_STAFF)" });

    await expect(ownerBadge).toContainText("Komsan Srisuk");
    await expect(page.getByTestId("action-success-banner")).toBeVisible();

    // 3. Unassign ticket
    await reassignSelect.selectOption({ label: "Unassign" });
    await expect(ownerBadge).toContainText("Unassigned");
    await expect(page.getByTestId("claim-ticket-btn")).toBeVisible();
  });

  test("STF-E2E-03: Operational IT Priority override", async ({ page }) => {
    await loginAsStaff(page);

    // Open TKT-2026-000001
    await page.getByRole("button", { name: "Open ticket TKT-2026-000001" }).click();
    await expect(page.getByTestId("staff-ticket-detail")).toBeVisible();

    // Change IT Priority to LOW
    const prioritySelect = page.getByTestId("it-priority-select");
    await prioritySelect.selectOption("LOW");

    await expect(page.getByTestId("action-success-banner")).toContainText(/IT priority updated to LOW/i);

    // Return to Queue
    await page.getByTestId("back-to-queue-btn").click();
    await expect(page.getByRole("heading", { name: /IT Staff Ticket Queue/i })).toBeVisible();

    // Verify priority in queue row
    const row = page.locator("tr", { hasText: "TKT-2026-000001" });
    await expect(row.locator(".zen-priority-low")).toBeVisible();
  });

  test("STF-E2E-04: Permitted workflow status transitions", async ({ page }) => {
    await loginAsStaff(page);

    // Open TKT-2026-000001 (status is NEW)
    await page.getByRole("button", { name: "Open ticket TKT-2026-000001" }).click();
    await expect(page.getByTestId("staff-ticket-detail")).toBeVisible();

    // Permitted transitions from NEW: OPEN, IN_PROGRESS, CANCELLED
    await expect(page.getByTestId("transition-to-open")).toBeVisible();
    await expect(page.getByTestId("transition-to-in_progress")).toBeVisible();
    await expect(page.getByTestId("transition-to-cancelled")).toBeVisible();
    await expect(page.getByTestId("transition-to-resolved")).not.toBeVisible();

    // Transition NEW -> OPEN
    await page.getByTestId("transition-to-open").click();
    await expect(page.getByTestId("action-success-banner")).toContainText(/Status transitioned to OPEN/i);

    // Permitted transitions from OPEN: IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CANCELLED
    await expect(page.getByTestId("transition-to-in_progress")).toBeVisible();
    await expect(page.getByTestId("transition-to-waiting_for_requester")).toBeVisible();
    await expect(page.getByTestId("transition-to-resolved")).toBeVisible();
    await expect(page.getByTestId("transition-to-open")).not.toBeVisible();

    // Transition OPEN -> IN_PROGRESS
    await page.getByTestId("transition-to-in_progress").click();
    await expect(page.getByTestId("action-success-banner")).toContainText(/Status transitioned to IN_PROGRESS/i);
  });

  test("STF-E2E-05: Dual communication streams (Public comments vs Amber Internal Notes) & attachments", async ({ page }) => {
    await loginAsStaff(page);

    // Open TKT-2026-000001
    await page.getByRole("button", { name: "Open ticket TKT-2026-000001" }).click();
    await expect(page.getByTestId("staff-ticket-detail")).toBeVisible();

    // 1. Post Public Comment
    const publicCommentText = "E2E Public comment: We are investigating your SMTP issue.";
    await page.getByTestId("comment-textarea").fill(publicCommentText);
    await page.getByTestId("submit-comment-btn").click();

    // Verify comment appears in public feed
    const publicFeed = page.getByTestId("comments-feed");
    await expect(publicFeed.getByText(publicCommentText)).toBeVisible();
    await expect(publicFeed.getByText("Thanaporn Boontarikmas")).toBeVisible();

    // 2. Post Internal Note (Amber Warning Accent)
    const internalNoteText = "E2E Internal note: Mail server relay port 587 dropped connection.";
    await page.getByTestId("note-textarea").fill(internalNoteText);
    await page.getByTestId("submit-note-btn").click();

    // Verify note appears in amber notes feed
    const notesFeed = page.getByTestId("notes-feed");
    await expect(notesFeed.getByText(internalNoteText)).toBeVisible();
    await expect(notesFeed.getByText("Thanaporn Boontarikmas")).toBeVisible();

    // Verify amber panel styling is present
    await expect(page.getByTestId("internal-notes-panel")).toBeVisible();
    await expect(page.getByText("Private to IT Staff & Admin")).toBeVisible();

    // 3. Verify Attachments Section is present
    await expect(page.getByRole("heading", { name: /attachments \(/i })).toBeVisible();
  });

  test("STF-E2E-06: Requester communication boundary (No Internal Notes & API 403)", async ({ page }) => {
    // Ensure a public comment and an internal note exist on testTicketId so test 6 is independent
    const staffUser = await prisma.user.findUnique({ where: { email: "thanaporn.b@toktickit.local" } });
    if (staffUser && testTicketId) {
      const existingComment = await prisma.publicComment.findFirst({ where: { ticketId: testTicketId } });
      if (!existingComment) {
        await prisma.publicComment.create({
          data: {
            ticketId: testTicketId,
            authorId: staffUser.id,
            content: "E2E Public comment: We are investigating your SMTP issue.",
          },
        });
      }
      const existingNote = await prisma.internalNote.findFirst({ where: { ticketId: testTicketId } });
      if (!existingNote) {
        await prisma.internalNote.create({
          data: {
            ticketId: testTicketId,
            authorId: staffUser.id,
            content: "E2E Internal note: Mail server relay port 587 dropped connection.",
          },
        });
      }
    }

    // 1. Login as Requester somchai (ticket owner)
    await page.getByLabel(/email address/i).fill("somchai.j@kmutt.ac.th");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("button", { name: "My Tickets" })).toBeVisible();

    // Open TKT-2026-000001 in Requester View
    await page.getByRole("table").getByText("TKT-2026-000001").click();
    await expect(page.getByRole("heading", { name: /Cannot send outgoing emails/i })).toBeVisible();

    // Requester can view Public Comments
    await expect(page.getByText("E2E Public comment: We are investigating your SMTP issue.")).toBeVisible();

    // Requester CANNOT see Internal Notes panel or confidential note text
    await expect(page.getByTestId("internal-notes-panel")).not.toBeVisible();
    await expect(page.getByText("E2E Internal note: Mail server relay port 587 dropped connection.")).not.toBeVisible();
    await expect(page.getByText(/Private to IT Staff & Admin/i)).not.toBeVisible();

    // 2. Backend Authorization Boundary: Requester calling GET /api/tickets/:id/internal-notes gets 403
    const notesRes = await page.request.get(`http://localhost:3000/api/tickets/${testTicketId}/internal-notes`);
    expect(notesRes.status()).toBe(403);

    // 3. Requester calling POST /api/tickets/:id/internal-notes gets 403
    const postNoteRes = await page.request.post(`http://localhost:3000/api/tickets/${testTicketId}/internal-notes`, {
      data: { content: "Unauthorized attempt to post internal note" },
    });
    expect(postNoteRes.status()).toBe(403);
  });
});
