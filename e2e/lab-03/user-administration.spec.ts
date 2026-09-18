import { test, expect } from "@playwright/test";
import { PrismaClient } from "../../server/node_modules/@prisma/client/index.js";

const prisma = new PrismaClient();

test.describe("Lab 3 E2E: Administrator User Governance & Security Guardrails (Issue #41)", () => {
  const testEmail = "qa.admin.test@toktickit.local";

  test.beforeAll(async () => {
    // Clean up any prior test user
    await prisma.user.deleteMany({ where: { email: testEmail } });

    // Ensure Admin has known password and active state
    const refUser = await prisma.user.findUnique({ where: { email: "suda.s@kmutt.ac.th" } });
    if (refUser) {
      await prisma.user.updateMany({
        where: { email: "admin@toktickit.local" },
        data: { isActive: true, mustChangePassword: false, passwordHash: refUser.passwordHash },
      });
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
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
  });

  async function loginAsAdmin(page: any) {
    await page.getByLabel(/email address/i).fill("admin@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("button", { name: "User Management" })).toBeVisible();
    await expect(page.getByText("Admin", { exact: true })).toBeVisible();
  }

  test("ADM-E2E-01: User directory display, search, role filtering, and pagination", async ({ page }) => {
    await loginAsAdmin(page);

    // Verify User Management shell renders
    await expect(page.getByTestId("user-management")).toBeVisible();
    await expect(page.getByRole("heading", { name: /User Management & Directory/i })).toBeVisible();

    // 1. Role Filter: ADMINISTRATOR
    const roleSelect = page.getByTestId("user-role-filter");
    await roleSelect.selectOption("ADMINISTRATOR");

    // All visible rows should be Administrators
    await expect(page.getByText("admin@toktickit.local")).toBeVisible();

    // Reset role filter before keyword search
    await roleSelect.selectOption("");

    // 2. Keyword Search
    const searchInput = page.getByTestId("user-search-input");
    await searchInput.fill("Thanaporn");
    await page.getByTestId("search-users-btn").click();

    await expect(page.getByText("thanaporn.b@toktickit.local")).toBeVisible();
    await expect(page.getByText("admin@toktickit.local")).not.toBeVisible();

    // 3. Clear Filters
    await page.getByTestId("clear-filters-btn").click();
    await expect(page.getByTestId("user-search-input")).toHaveValue("");
  });

  test("ADM-E2E-02: Create new user with initial password and duplicate email prevention (409)", async ({ page }) => {
    await loginAsAdmin(page);

    // 1. Open Create User modal
    await page.getByTestId("create-user-btn").click();
    await expect(page.getByRole("heading", { name: /Create New User Account/i })).toBeVisible();

    // Fill form
    await page.getByTestId("create-fullname-input").fill("QA New Staff");
    await page.getByTestId("create-email-input").fill(testEmail);
    await page.getByTestId("create-role-select").selectOption("IT_STAFF");
    await page.getByTestId("create-password-input").fill("TemporaryPass123!");

    // Submit
    await page.getByTestId("submit-create-user-btn").click();

    // Verify modal closes and user is displayed
    await expect(page.getByRole("heading", { name: /Create New User Account/i })).not.toBeVisible();
    await expect(page.getByText(testEmail)).toBeVisible();

    // 2. Test Duplicate Email Prevention (409 Conflict)
    await page.getByTestId("create-user-btn").click();
    await page.getByTestId("create-fullname-input").fill("Duplicate User");
    await page.getByTestId("create-email-input").fill(testEmail);
    await page.getByTestId("create-password-input").fill("TemporaryPass123!");

    await page.getByTestId("submit-create-user-btn").click();

    // Expect duplicate error message
    await expect(page.getByText(/email.*already.*registered|already exists|conflict/i)).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("heading", { name: /Create New User Account/i })).not.toBeVisible();
  });

  test("ADM-E2E-03: Edit user details and active status toggle", async ({ page }) => {
    await loginAsAdmin(page);

    // Locate the created user from DB
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user).not.toBeNull();
    const userId = user!.id;

    // 1. Edit User Name
    await page.getByTestId(`edit-user-btn-${userId}`).click();
    await expect(page.getByRole("heading", { name: /Edit User:/i })).toBeVisible();

    const nameInput = page.getByTestId("edit-fullname-input");
    await nameInput.fill("QA Updated Staff");
    await page.getByTestId("submit-edit-user-btn").click();

    // Verify update reflected in table
    await expect(page.getByRole("heading", { name: /Edit User:/i })).not.toBeVisible();
    await expect(page.getByText("QA Updated Staff")).toBeVisible();

    // 2. Toggle Active Status (Deactivate)
    const toggleBtn = page.getByTestId(`toggle-active-btn-${userId}`);
    await toggleBtn.click();

    // Verify status switches to Inactive
    const row = page.locator(`[data-testid="user-row-${userId}"]`);
    await expect(row.getByText(/Inactive|Deactivated/i)).toBeVisible();

    // 3. Toggle Active Status back (Reactivate)
    await toggleBtn.click();
    await expect(row.getByText(/^Active$/i)).toBeVisible();
  });

  test("ADM-E2E-04: Admin reset password modal", async ({ page }) => {
    await loginAsAdmin(page);

    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user).not.toBeNull();
    const userId = user!.id;

    // Open Reset Password modal
    await page.getByTestId(`reset-pwd-btn-${userId}`).click();
    await expect(page.getByRole("heading", { name: "Reset Password" })).toBeVisible();

    // Enter new temporary password
    await page.getByTestId("reset-password-input").fill("BrandNewReset123!");
    await page.getByTestId("submit-reset-password-btn").click();

    // Verify modal closes and success feedback is visible
    await expect(page.getByRole("heading", { name: "Reset Password" })).not.toBeVisible();
    await expect(page.getByText(/Password reset successfully/i)).toBeVisible();

    // Verify DB flag mustChangePassword is true
    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(updatedUser?.mustChangePassword).toBe(true);
  });

  test("ADM-E2E-05: Security guardrails - Self-deactivation and last admin lock (SEC-05, SEC-06)", async ({ page }) => {
    await loginAsAdmin(page);

    // Find the logged-in admin user (id=1, admin@toktickit.local)
    const adminUser = await prisma.user.findUnique({ where: { email: "admin@toktickit.local" } });
    expect(adminUser).not.toBeNull();
    const adminId = adminUser!.id;

    // Search for admin user to ensure they are on the current page
    await page.getByTestId("user-search-input").fill("admin@toktickit.local");
    await page.getByTestId("search-users-btn").click();
    await expect(page.getByText("admin@toktickit.local")).toBeVisible();

    // 1. Verify Self-deactivation toggle is disabled
    const selfToggle = page.getByTestId(`toggle-active-btn-${adminId}`);
    await expect(selfToggle).toBeDisabled();

    // 2. Verify in Edit modal that Active checkbox is disabled
    await page.getByTestId(`edit-user-btn-${adminId}`).click();
    const activeCheckbox = page.getByTestId("edit-active-checkbox");
    await expect(activeCheckbox).toBeDisabled();

    // Close modal
    await page.getByRole("button", { name: "Cancel" }).click();

    // 3. Backend Enforcement: Direct PATCH request attempting self-deactivation returns 400
    const patchRes = await page.request.patch(`http://localhost:3000/api/admin/users/${adminId}`, {
      data: { isActive: false },
    });
    expect(patchRes.status()).toBe(400);
    const errBody = await patchRes.json();
    expect(errBody.error?.message || errBody.message).toMatch(/cannot deactivate.*account/i);
  });

  test("ADM-E2E-06: Non-administrator route & API gating (SEC-01, AC-21)", async ({ page }) => {
    // 1. IT Staff cannot see User Management and receives 403 on admin API
    await page.getByLabel(/email address/i).fill("thanaporn.b@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    await expect(page.getByRole("button", { name: "Ticket Queue" })).toBeVisible();
    await expect(page.getByRole("button", { name: "User Management" })).not.toBeVisible();

    const staffApiRes = await page.request.get("http://localhost:3000/api/admin/users");
    expect(staffApiRes.status()).toBe(403);

    // Logout
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.getByRole("heading", { name: "TokTickIT" })).toBeVisible();

    // 2. Requester cannot see User Management and receives 403 on admin API
    await page.getByLabel(/email address/i).fill("somchai.j@kmutt.ac.th");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    await expect(page.getByRole("button", { name: "My Tickets" })).toBeVisible();
    await expect(page.getByRole("button", { name: "User Management" })).not.toBeVisible();

    const reqApiRes = await page.request.get("http://localhost:3000/api/admin/users");
    expect(reqApiRes.status()).toBe(403);
  });
});
