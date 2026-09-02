import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

test.describe("E2E-01: Complete Requester Ticketing Flow", () => {
  test("full browser journey: select requester -> create ticket with attachment -> my tickets -> ticket detail -> soft remove attachment", async ({
    page,
  }) => {
    // 1. Visit App (initial state without requester session loads selector)
    await page.goto("/");
    await expect(page.getByText("Select Development Requester")).toBeVisible();

    // 2. Select Active Requester (Somchai Jaidee)
    const select = page.getByRole("combobox");
    await select.selectOption({ label: "Somchai Jaidee (somchai.j@kmutt.ac.th)" });

    const continueBtn = page.getByRole("button", { name: /continue/i });
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // 3. Verify App Shell loaded with selected requester badge in Zen Green header
    await expect(page.getByText("Somchai Jaidee")).toBeVisible();
    await expect(page.getByText("TokTickIT")).toBeVisible();

    // 4. Navigate to "Create Ticket" tab
    await page.getByRole("button", { name: "Create Ticket", exact: true }).click();
    await expect(page.getByText("New Support Ticket")).toBeVisible();

    // 5. Fill Create Ticket Form
    const summaryInput = page.getByLabel(/summary/i);
    await summaryInput.fill("E2E Automated Test: Display flicker issue");

    const categorySelect = page.getByLabel(/category/i);
    await categorySelect.selectOption({ index: 1 }); // Hardware

    const systemSelect = page.getByLabel(/related system/i);
    await systemSelect.selectOption({ index: 1 }); // Corporate Laptop

    const descInput = page.getByLabel(/^description/i);
    await descInput.fill(
      "This is an end-to-end test verifying ticket creation, attachment upload, and lifecycle management."
    );

    // Select Priority HIGH radio button
    await page.getByRole("radio", { name: "HIGH" }).check();

    // 6. Attach a test file
    const testFilePath = path.resolve(process.cwd(), "e2e-sample-upload.png");
    fs.writeFileSync(testFilePath, "dummy png image data for E2E testing");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // 7. Submit Ticket Form
    const submitBtn = page.getByRole("button", { name: "Submit Ticket", exact: true });
    await submitBtn.click();

    // 8. Verify Success View displays generated Ticket Number
    await expect(page.getByText("Ticket Created Successfully!")).toBeVisible();
    const ticketNumberEl = page.locator(".zen-ticket-number");
    await expect(ticketNumberEl).toContainText(/TKT-2026-\d{6}/);
    const generatedTicketNumber = (await ticketNumberEl.innerText()).trim();

    // 9. Click "View in My Tickets"
    const viewMyTicketsBtn = page.getByRole("button", { name: "View in My Tickets", exact: true });
    await viewMyTicketsBtn.click();

    // 10. Verify Ticket in My Tickets Table
    await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
    await expect(page.getByText("E2E Automated Test: Display flicker issue").first()).toBeVisible();

    // 11. Click Ticket to navigate to Ticket Detail
    await page.getByText("E2E Automated Test: Display flicker issue").first().click();

    // 12. Verify Ticket Detail Screen read-only attributes
    await expect(page.getByTestId("ticket-detail-screen")).toBeVisible();
    await expect(page.getByTestId("ticket-number")).toHaveText(generatedTicketNumber);
    await expect(page.getByTestId("ticket-status")).toHaveText("NEW");
    await expect(page.getByTestId("ticket-priority")).toHaveText("HIGH");
    await expect(page.getByTestId("requester-name")).toContainText("Somchai Jaidee");

    // Confirm strictly NO comments or staff controls exist
    await expect(page.locator("textarea[placeholder*='comment' i]")).toHaveCount(0);
    await expect(page.getByText("Actions Taken")).toHaveCount(0);

    // 13. Verify Attachment Section & Download
    await expect(page.getByTestId("attachment-section")).toBeVisible();
    await expect(page.getByText("e2e-sample-upload.png")).toBeVisible();

    const downloadLink = page.getByRole("link", { name: /download e2e-sample-upload\.png/i });
    await expect(downloadLink).toBeVisible();

    // 14. Perform Soft Removal
    const removeBtn = page.getByRole("button", { name: /remove e2e-sample-upload\.png/i });
    await removeBtn.click();

    // Modal appears
    await expect(page.getByTestId("removal-modal")).toBeVisible();
    const reasonTextarea = page.getByLabel(/removal reason/i);
    const confirmRemoveBtn = page.getByTestId("confirm-removal-button");

    // Must be disabled until >= 3 characters
    await expect(confirmRemoveBtn).toBeDisabled();
    await reasonTextarea.fill("No longer needed");
    await expect(confirmRemoveBtn).toBeEnabled();

    // Confirm removal
    await confirmRemoveBtn.click();

    // 15. Verify file moves to soft-removed list with reason and metadata retained
    await expect(page.getByTestId("removal-modal")).toHaveCount(0);
    await expect(page.getByText("Removed Attachments (Metadata Only)")).toBeVisible();
    await expect(page.getByText("No longer needed")).toBeVisible();
    await expect(page.getByText("Removed", { exact: true })).toBeVisible();

    // Clean up temporary local upload file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });
});
