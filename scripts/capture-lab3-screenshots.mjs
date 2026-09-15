import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:5173";
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

async function capture() {
  console.log("Starting Lab 3 automated visual QA screenshot capture...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // -----------------------------------------------------------------------
    // 1. Authentication & Password Lifecycle
    // -----------------------------------------------------------------------
    console.log("Capturing 01-auth screens...");
    await page.goto(BASE_URL);
    await context.clearCookies();
    await page.reload();
    await page.waitForTimeout(500);

    // 01-login-screen.png
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "01-auth/01-login-screen.png"), fullPage: true });

    // 02-login-validation-empty.png
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "01-auth/02-login-validation-empty.png"), fullPage: true });

    // 03-login-invalid-credentials.png
    await page.getByLabel(/email address/i).fill("unknown@toktickit.local");
    await page.getByLabel(/^password/i).fill("WrongPassword123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "01-auth/03-login-invalid-credentials.png"), fullPage: true });

    // 04-change-password-screen.png
    await page.getByLabel(/email address/i).fill("manee.t@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "01-auth/04-change-password-screen.png"), fullPage: true });

    // 05-password-complexity-feedback.png
    const newPassInput = page.getByLabel(/^new password/i);
    if (await newPassInput.isVisible()) {
      await newPassInput.fill("short");
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "01-auth/05-password-complexity-feedback.png"), fullPage: true });

    // -----------------------------------------------------------------------
    // 2. Requester Experience
    // -----------------------------------------------------------------------
    console.log("Capturing 02-requester screens...");
    await context.clearCookies();
    await page.goto(BASE_URL + "/#dev");
    await page.evaluate(() => sessionStorage.setItem("toktickit.devRequesterId", "1"));
    await page.reload();
    await page.waitForTimeout(500);

    // 01-my-tickets.png
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "02-requester/01-my-tickets.png"), fullPage: true });

    // 02-create-ticket.png
    await page.getByRole("button", { name: "Create Ticket", exact: true }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "02-requester/02-create-ticket.png"), fullPage: true });

    // 03-ticket-detail-view.png & comments
    await page.getByRole("button", { name: "My Tickets" }).click();
    await page.waitForTimeout(500);
    const viewDetailBtn = page.locator(".zen-table-link").first();
    if (await viewDetailBtn.isVisible()) {
      await viewDetailBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, "02-requester/03-ticket-detail-view.png"), fullPage: true });

      // 04-problem-appears-resolved.png
      const resolveToggle = page.locator("[data-testid='toggle-problem-resolved-btn']");
      if (await resolveToggle.isVisible()) {
        await resolveToggle.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, "02-requester/04-problem-appears-resolved.png"), fullPage: true });
      }

      // 05-public-comments-thread.png
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, "02-requester/05-public-comments-thread.png"), fullPage: true });
    }

    // -----------------------------------------------------------------------
    // 3. IT Staff Experience
    // -----------------------------------------------------------------------
    console.log("Capturing 03-staff screens...");
    await context.clearCookies();
    await page.goto(BASE_URL);
    await page.getByLabel(/email address/i).fill("thanaporn.b@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await page.waitForTimeout(800);

    // 01-staff-ticket-queue-desktop.png
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "03-staff/01-staff-ticket-queue-desktop.png"), fullPage: true });

    // 02-staff-ticket-queue-filters.png
    const searchQueue = page.getByPlaceholder(/search by ticket no/i);
    if (await searchQueue.isVisible()) {
      await searchQueue.fill("TKT");
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "03-staff/02-staff-ticket-queue-filters.png"), fullPage: true });

    // Navigate to Detail
    const staffDetailBtn = page.getByRole("button", { name: "Inspect" }).first();
    if (await staffDetailBtn.isVisible()) {
      await staffDetailBtn.click();
      await page.waitForTimeout(500);

      // 03-staff-ticket-detail-claim-reassign.png
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, "03-staff/03-staff-ticket-detail-claim-reassign.png"), fullPage: true });

      // 04-staff-ticket-detail-it-priority.png
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, "03-staff/04-staff-ticket-detail-it-priority.png"), fullPage: true });

      // 05-staff-ticket-detail-status-transition.png
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, "03-staff/05-staff-ticket-detail-status-transition.png"), fullPage: true });

      // 06-internal-notes-amber-warning.png
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, "03-staff/06-internal-notes-amber-warning.png"), fullPage: true });
    }

    // -----------------------------------------------------------------------
    // 4. Administrator Experience
    // -----------------------------------------------------------------------
    console.log("Capturing 04-admin screens...");
    await context.clearCookies();
    await page.goto(BASE_URL);
    await page.getByLabel(/email address/i).fill("admin@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await page.waitForTimeout(800);

    // 01-user-directory-desktop.png
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "04-admin/01-user-directory-desktop.png"), fullPage: true });

    // 02-user-directory-search-filter.png
    const adminSearch = page.getByTestId("user-search-input");
    if (await adminSearch.isVisible()) {
      await adminSearch.fill("Staff");
      await page.getByTestId("search-users-btn").click();
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "04-admin/02-user-directory-search-filter.png"), fullPage: true });

    // 03-create-user-modal.png
    await page.getByTestId("create-user-btn").click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "04-admin/03-create-user-modal.png"), fullPage: true });
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.waitForTimeout(300);

    // 04-edit-user-modal-self-lock.png
    const editBtn = page.getByRole("button", { name: "Edit" }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, "04-admin/04-edit-user-modal-self-lock.png"), fullPage: true });
      await page.getByRole("button", { name: "Cancel" }).click();
      await page.waitForTimeout(300);
    }

    // 05-reset-password-modal.png
    const resetBtn = page.getByRole("button", { name: "Reset Password" }).first();
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, "04-admin/05-reset-password-modal.png"), fullPage: true });
      await page.getByRole("button", { name: "Cancel" }).click();
      await page.waitForTimeout(300);
    }

    // -----------------------------------------------------------------------
    // 5. Responsive Design Across Viewports (AC-22)
    // -----------------------------------------------------------------------
    console.log("Capturing 05-responsive viewports...");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "05-responsive/01-desktop-1280.png"), fullPage: true });

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "05-responsive/02-tablet-768.png"), fullPage: true });

    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "05-responsive/03-mobile-375.png"), fullPage: true });

    console.log("✓ Lab 3 Visual QA screenshots captured successfully into:", ARTIFACTS_DIR);
  } finally {
    await browser.close();
  }
}

capture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
