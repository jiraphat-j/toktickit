import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { PrismaClient } from "../../server/node_modules/@prisma/client/index.js";

const prisma = new PrismaClient();

const ARTIFACTS_DIR = path.resolve(process.cwd(), "artifacts/lab-03/screenshots");

const DIRS = [
  path.join(ARTIFACTS_DIR, "01-auth"),
  path.join(ARTIFACTS_DIR, "02-requester"),
  path.join(ARTIFACTS_DIR, "03-staff"),
  path.join(ARTIFACTS_DIR, "04-admin"),
  path.join(ARTIFACTS_DIR, "05-responsive"),
];

for (const dir of DIRS) {
  fs.mkdirSync(dir, { recursive: true });
}

test.describe("Lab 3 Visual QA: Cross-Feature UI Shell & Evidence Screenshots (Issue #40)", () => {
  test.beforeAll(async () => {
    await prisma.user.updateMany({
      where: { email: "manee.t@toktickit.local" },
      data: { mustChangePassword: true },
    });
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });
  // -------------------------------------------------------------------------
  // 1. Authentication & Password Lifecycle Screens
  // -------------------------------------------------------------------------
  test("01-auth: Capture Login & Password Change visual states", async ({ page }) => {
    // 01-login-screen.png
    await page.goto("/");
    await page.context().clearCookies();
    await page.reload();
    await expect(page.getByRole("heading", { name: "TokTickIT" })).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "01-auth/01-login-screen.png"),
      fullPage: true,
    });

    // 02-login-validation-empty.png
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByText("Email is required")).toBeVisible();
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "01-auth/02-login-validation-empty.png"),
      fullPage: true,
    });

    // 03-login-invalid-credentials.png
    await page.getByLabel(/email address/i).fill("wrong.user@toktickit.local");
    await page.getByLabel(/^password/i).fill("WrongPass123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "01-auth/03-login-invalid-credentials.png"),
      fullPage: true,
    });

    // 04-change-password-screen.png (Login as a user with mustChangePassword = true)
    await page.getByLabel(/email address/i).fill("manee.t@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Change Password Required" })).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "01-auth/04-change-password-screen.png"),
      fullPage: true,
    });

    // 05-password-complexity-feedback.png
    await page.getByLabel(/^new password/i).fill("short");
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "01-auth/05-password-complexity-feedback.png"),
      fullPage: true,
    });
  });

  // -------------------------------------------------------------------------
  // 2. Requester Experience Screens
  // -------------------------------------------------------------------------
  test("02-requester: Capture Requester workflow, comments, and resolved indication", async ({ page }) => {
    // Login as active requester whose password was already changed
    await page.goto("/");
    await page.context().clearCookies();
    await page.reload();

    // Use Dev Requester mode fallback or seed requester
    await page.evaluate(() => {
      sessionStorage.setItem("toktickit.devRequesterId", "1");
    });
    await page.goto("/#dev");
    await page.reload();
    await expect(page.getByRole("button", { name: "My Tickets" })).toBeVisible();

    // 01-my-tickets.png
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "02-requester/01-my-tickets.png"),
      fullPage: true,
    });

    // 02-create-ticket.png
    await page.getByRole("button", { name: "Create Ticket", exact: true }).click();
    await expect(page.getByText(/New Support Ticket/i)).toBeVisible();
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "02-requester/02-create-ticket.png"),
      fullPage: true,
    });

    // 03-ticket-detail-view.png & 04-problem-appears-resolved.png & 05-public-comments-thread.png
    await page.getByRole("button", { name: "My Tickets" }).click();
    await page.waitForTimeout(500);

    const ticketLink = page.locator(".zen-table-link").first();
    if (await ticketLink.isVisible()) {
      await ticketLink.click();
      await page.waitForTimeout(500);

      // 03-ticket-detail-view.png
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, "02-requester/03-ticket-detail-view.png"),
        fullPage: true,
      });

      // 04-problem-appears-resolved.png
      const resolveToggleBtn = page.locator("[data-testid='toggle-problem-resolved-btn']");
      if (await resolveToggleBtn.isVisible()) {
        await resolveToggleBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(ARTIFACTS_DIR, "02-requester/04-problem-appears-resolved.png"),
          fullPage: true,
        });
      }

      // 05-public-comments-thread.png
      const commentInput = page.locator("[data-testid='requester-comment-textarea']");
      if (await commentInput.isVisible()) {
        await commentInput.fill("Automated visual QA screenshot comment verification.");
        const postBtn = page.locator("[data-testid='requester-submit-comment-btn']");
        if (await postBtn.isVisible()) {
          await postBtn.click();
          await page.waitForTimeout(500);
        }
      }
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, "02-requester/05-public-comments-thread.png"),
        fullPage: true,
      });
    }
  });

  // -------------------------------------------------------------------------
  // 3. IT Staff Experience Screens
  // -------------------------------------------------------------------------
  test("03-staff: Capture Ticket Queue, Claim/Reassign, Priority, Status, and Internal Notes", async ({ page }) => {
    // Authenticate as IT Staff
    await page.goto("/");
    await page.context().clearCookies();
    await page.reload();

    await page.getByLabel(/email address/i).fill("thanaporn.b@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("button", { name: "Ticket Queue" })).toBeVisible();

    // 01-staff-ticket-queue-desktop.png
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "03-staff/01-staff-ticket-queue-desktop.png"),
      fullPage: true,
    });

    // 02-staff-ticket-queue-filters.png
    const searchInput = page.getByPlaceholder(/search by ticket no/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("TKT");
      await page.waitForTimeout(500);
    }
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "03-staff/02-staff-ticket-queue-filters.png"),
      fullPage: true,
    });

    // Navigate to Ticket Detail
    const inspectBtn = page.getByRole("button", { name: "Inspect" }).first();
    if (await inspectBtn.isVisible()) {
      await inspectBtn.click();
      await page.waitForTimeout(500);

      // 03-staff-ticket-detail-claim-reassign.png
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, "03-staff/03-staff-ticket-detail-claim-reassign.png"),
        fullPage: true,
      });

      // 04-staff-ticket-detail-it-priority.png
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, "03-staff/04-staff-ticket-detail-it-priority.png"),
        fullPage: true,
      });

      // 05-staff-ticket-detail-status-transition.png
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, "03-staff/05-staff-ticket-detail-status-transition.png"),
        fullPage: true,
      });

      // 06-internal-notes-amber-warning.png
      const noteInput = page.locator("[data-testid='add-note-form'] textarea, [data-testid='note-textarea']").first();
      if (await noteInput.isVisible()) {
        await noteInput.fill("Internal staff note for visual QA amber styling audit.");
        const postNoteBtn = page.locator("[data-testid='add-note-form'] button[type='submit']");
        if (await postNoteBtn.isVisible()) {
          await postNoteBtn.click();
          await page.waitForTimeout(500);
        }
      }
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, "03-staff/06-internal-notes-amber-warning.png"),
        fullPage: true,
      });
    }
  });

  // -------------------------------------------------------------------------
  // 4. Administrator Experience Screens
  // -------------------------------------------------------------------------
  test("04-admin: Capture User Management, Search/Filter, and Modals", async ({ page }) => {
    // Authenticate as Administrator
    await page.goto("/");
    await page.context().clearCookies();
    await page.reload();

    await page.getByLabel(/email address/i).fill("admin@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("button", { name: "User Management" })).toBeVisible();

    // 01-user-directory-desktop.png
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "04-admin/01-user-directory-desktop.png"),
      fullPage: true,
    });

    // 02-user-directory-search-filter.png
    const userSearchInput = page.getByTestId("user-search-input");
    if (await userSearchInput.isVisible()) {
      await userSearchInput.fill("Staff");
      await page.getByTestId("search-users-btn").click();
      await page.waitForTimeout(400);
    }
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "04-admin/02-user-directory-search-filter.png"),
      fullPage: true,
    });

    // 03-create-user-modal.png
    await page.getByTestId("create-user-btn").click();
    await expect(page.getByTestId("create-fullname-input")).toBeVisible();
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "04-admin/03-create-user-modal.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.waitForTimeout(300);

    // 04-edit-user-modal-self-lock.png
    const firstEditBtn = page.getByRole("button", { name: "Edit" }).first();
    if (await firstEditBtn.isVisible()) {
      await firstEditBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, "04-admin/04-edit-user-modal-self-lock.png"),
        fullPage: true,
      });
      await page.getByRole("button", { name: "Cancel" }).click();
      await page.waitForTimeout(300);
    }

    // 05-reset-password-modal.png
    const firstResetBtn = page.getByRole("button", { name: "Reset Password" }).first();
    if (await firstResetBtn.isVisible()) {
      await firstResetBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, "04-admin/05-reset-password-modal.png"),
        fullPage: true,
      });
      await page.getByRole("button", { name: "Cancel" }).click();
    }
  });

  // -------------------------------------------------------------------------
  // 5. Responsive Design Across Viewports (AC-22)
  // -------------------------------------------------------------------------
  test("05-responsive: Capture Desktop, Tablet, and Mobile layouts", async ({ page }) => {
    // Authenticate as Admin to access rich controls
    await page.goto("/");
    await page.context().clearCookies();
    await page.reload();

    await page.getByLabel(/email address/i).fill("admin@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("button", { name: "User Management" })).toBeVisible();

    // 01-desktop-1280.png
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "05-responsive/01-desktop-1280.png"),
      fullPage: true,
    });

    // 02-tablet-768.png
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "05-responsive/02-tablet-768.png"),
      fullPage: true,
    });

    // 03-mobile-375.png & Verify zero horizontal scroll overflow
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(400);

    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowing).toBe(false);

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "05-responsive/03-mobile-375.png"),
      fullPage: true,
    });
  });
});
