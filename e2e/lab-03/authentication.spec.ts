import { test, expect } from "@playwright/test";
import { PrismaClient } from "../../server/node_modules/@prisma/client/index.js";

const prisma = new PrismaClient();

test.describe("Lab 3 E2E: Authentication, Session & Password Lifecycle (Issue #41)", () => {
  test.beforeAll(async () => {
    // Ensure test users are in expected state
    // Reset somchai password to match suda's password (Password123!)
    const refUser = await prisma.user.findUnique({ where: { email: "suda.s@kmutt.ac.th" } });
    if (refUser) {
      await prisma.user.updateMany({
        where: { email: "somchai.j@kmutt.ac.th" },
        data: { isActive: true, mustChangePassword: true, passwordHash: refUser.passwordHash },
      });
    }
    await prisma.user.updateMany({
      where: { email: "former.staff@kmutt.ac.th" },
      data: { isActive: false },
    });
    await prisma.user.updateMany({
      where: { email: "thanaporn.b@toktickit.local" },
      data: { isActive: true, mustChangePassword: false },
    });
    await prisma.user.updateMany({
      where: { email: "admin@toktickit.local" },
      data: { isActive: true, mustChangePassword: false },
    });
  });

  test.afterAll(async () => {
    // Reset somchai once more
    const refUser = await prisma.user.findUnique({ where: { email: "suda.s@kmutt.ac.th" } });
    if (refUser) {
      await prisma.user.updateMany({
        where: { email: "somchai.j@kmutt.ac.th" },
        data: { isActive: true, mustChangePassword: true, passwordHash: refUser.passwordHash },
      });
    }
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
  });

  test("AUTH-E2E-01: Valid login for all 3 roles enters role-appropriate shells", async ({ page }) => {
    // 1. Requester login
    await page.getByLabel(/email address/i).fill("suda.s@kmutt.ac.th");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    await expect(page.getByRole("button", { name: "My Tickets" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Ticket", exact: true })).toBeVisible();
    await expect(page.getByText("Requester")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ticket Queue" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "User Management" })).not.toBeVisible();

    // Logout
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.getByRole("heading", { name: "TokTickIT" })).toBeVisible();

    // 2. IT Staff login
    await page.getByLabel(/email address/i).fill("thanaporn.b@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    await expect(page.getByRole("button", { name: "Ticket Queue" })).toBeVisible();
    await expect(page.getByText("IT Staff", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "My Tickets" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "User Management" })).not.toBeVisible();

    // Logout
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.getByRole("heading", { name: "TokTickIT" })).toBeVisible();

    // 3. Administrator login
    await page.getByLabel(/email address/i).fill("admin@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    await expect(page.getByRole("button", { name: "Ticket Queue" })).toBeVisible();
    await expect(page.getByRole("button", { name: "User Management" })).toBeVisible();
    await expect(page.getByText("Admin", { exact: true })).toBeVisible();
  });

  test("AUTH-E2E-02: Invalid credentials rejected with generic error message", async ({ page }) => {
    await page.getByLabel(/email address/i).fill("nonexistent.user@kmutt.ac.th");
    await page.getByLabel(/^password/i).fill("WrongPassword123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page.getByRole("heading", { name: "TokTickIT" })).toBeVisible();
  });

  test("AUTH-E2E-03: Deactivated account rejected during login", async ({ page }) => {
    await page.getByLabel(/email address/i).fill("former.staff@kmutt.ac.th");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    await expect(page.getByText(/account is deactivated|invalid email or password/i)).toBeVisible();
  });

  test("AUTH-E2E-04: First-login mandatory password change workflow", async ({ page }) => {
    // Ensure somchai has mustChangePassword = true and original password
    const refUser = await prisma.user.findUnique({ where: { email: "suda.s@kmutt.ac.th" } });
    if (refUser) {
      await prisma.user.updateMany({
        where: { email: "somchai.j@kmutt.ac.th" },
        data: { mustChangePassword: true, passwordHash: refUser.passwordHash },
      });
    }

    await page.getByLabel(/email address/i).fill("somchai.j@kmutt.ac.th");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    // Must be gated on Change Password Required screen
    await expect(page.getByRole("heading", { name: "Change Password Required" })).toBeVisible();
    await expect(page.getByRole("button", { name: "My Tickets" })).not.toBeVisible();

    // Test password complexity feedback (button should remain disabled for weak password)
    await page.getByLabel(/^new password/i).fill("weak");
    await page.getByLabel(/^confirm new password/i).fill("weak");
    await expect(page.getByRole("button", { name: "Update Password", exact: true })).toBeDisabled();
    await expect(page.getByText(/At least 8 characters/i)).toBeVisible();

    // Fill valid new password
    const newPassword = "NewComplexPassword123!";
    await page.getByLabel(/^new password/i).fill(newPassword);
    await page.getByLabel(/^confirm new password/i).fill(newPassword);
    await expect(page.getByRole("button", { name: "Update Password", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Update Password", exact: true }).click();

    // Successful update
    await expect(page.getByText(/Password updated successfully/i)).toBeVisible();

    // Should redirect to authenticated shell
    await expect(page.getByRole("button", { name: "My Tickets" })).toBeVisible({ timeout: 5000 });

    // Verify DB flag updated
    const userInDb = await prisma.user.findUnique({ where: { email: "somchai.j@kmutt.ac.th" } });
    expect(userInDb?.mustChangePassword).toBe(false);
  });

  test("AUTH-E2E-05: Logout terminates session and blocks back navigation", async ({ page, context }) => {
    // Login as Admin
    await page.getByLabel(/email address/i).fill("admin@toktickit.local");
    await page.getByLabel(/^password/i).fill("Password123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByRole("button", { name: "User Management" })).toBeVisible();

    // Sign Out
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.getByRole("heading", { name: "TokTickIT" })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();

    // Verify cookies cleared
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === "toktickit_session");
    expect(sessionCookie).toBeUndefined();

    // Attempt browser back navigation
    await page.goBack();
    await page.waitForTimeout(500);

    // Protected view must not be accessible; login view is retained
    await expect(page.getByRole("button", { name: "User Management" })).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "TokTickIT" })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();

    // Verify reload stays unauthenticated
    await page.reload();
    await expect(page.getByRole("button", { name: "User Management" })).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "TokTickIT" })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
  });
});
