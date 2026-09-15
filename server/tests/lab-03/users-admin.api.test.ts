import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { createSession } from "../../src/session.js";

describe("Lab 3 Admin User Management & Safeguards (Issue #39)", () => {
  let adminUser: { id: number; email: string };
  let staffUser: { id: number; email: string };
  let requesterUser: { id: number; email: string };

  let adminCookie: string;
  let staffCookie: string;
  let requesterCookie: string;

  beforeAll(async () => {
    const prisma = getPrisma();

    // Find seeded users
    const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
    const ad = users.find((u) => u.role === "ADMINISTRATOR" && u.isActive);
    const st = users.find((u) => u.role === "IT_STAFF" && u.isActive);
    const reqUser = users.find((u) => u.role === "REQUESTER" && u.isActive);

    if (!ad || !st || !reqUser) {
      throw new Error("Seeded users for testing not found. Please run prisma db seed.");
    }

    adminUser = { id: ad.id, email: ad.email };
    staffUser = { id: st.id, email: st.email };
    requesterUser = { id: reqUser.id, email: reqUser.email };

    // Clear mustChangePassword for the test sessions
    await prisma.user.updateMany({
      where: { id: { in: [ad.id, st.id, reqUser.id] } },
      data: { mustChangePassword: false },
    });

    adminCookie = `toktickit_session=${createSession(ad.id)}`;
    staffCookie = `toktickit_session=${createSession(st.id)}`;
    requesterCookie = `toktickit_session=${createSession(reqUser.id)}`;
  });

  // -------------------------------------------------------------------------
  // SEC-01: Admin Route Authorization Matrix
  // -------------------------------------------------------------------------
  describe("SEC-01: Admin Route Authorization Matrix", () => {
    it("returns 401 Unauthorized for unauthenticated requests", async () => {
      const res = await request(app).get("/api/admin/users");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 403 Forbidden for Requester role", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", requesterCookie);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 403 Forbidden for IT Staff role", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", staffCookie);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 200 OK for Administrator role", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", adminCookie);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("items");
      expect(res.body).toHaveProperty("pagination");
    });
  });

  // -------------------------------------------------------------------------
  // ADM-01: User Directory & Search/Filter (AC-16, BR-07)
  // -------------------------------------------------------------------------
  describe("ADM-01: User Directory Listing, Search, Filter & Pagination", () => {
    it("lists users with pagination and excludes sensitive password hashes", async () => {
      const res = await request(app)
        .get("/api/admin/users?page=1&limit=5")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.pagination).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 5,
          totalItems: expect.any(Number),
          totalPages: expect.any(Number),
        })
      );

      // Verify passwordHash is not exposed
      for (const u of res.body.items) {
        expect(u).not.toHaveProperty("passwordHash");
        expect(u).toHaveProperty("id");
        expect(u).toHaveProperty("fullName");
        expect(u).toHaveProperty("email");
        expect(u).toHaveProperty("role");
        expect(u).toHaveProperty("isActive");
      }
    });

    it("filters users by role", async () => {
      const res = await request(app)
        .get("/api/admin/users?role=IT_STAFF")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThan(0);
      for (const u of res.body.items) {
        expect(u.role).toBe("IT_STAFF");
      }
    });

    it("filters users by active status", async () => {
      const res = await request(app)
        .get("/api/admin/users?isActive=true")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      for (const u of res.body.items) {
        expect(u.isActive).toBe(true);
      }
    });

    it("searches users by name or email keyword (case-insensitive)", async () => {
      const res = await request(app)
        .get(`/api/admin/users?search=${encodeURIComponent(adminUser.email.slice(0, 5))}`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThan(0);
      const found = res.body.items.some((u: any) => u.id === adminUser.id);
      expect(found).toBe(true);
    });

    it("returns 400 for invalid role filter or invalid pagination", async () => {
      const invalidRoleRes = await request(app)
        .get("/api/admin/users?role=SUPERUSER")
        .set("Cookie", adminCookie);
      expect(invalidRoleRes.status).toBe(400);

      const invalidPageRes = await request(app)
        .get("/api/admin/users?page=-1")
        .set("Cookie", adminCookie);
      expect(invalidPageRes.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // ADM-02: User Creation (AC-17, AC-18, BR-08)
  // -------------------------------------------------------------------------
  describe("ADM-02: User Creation with Password Complexity & Uniqueness", () => {
    const testEmail = `new-staff-${Date.now()}@example.com`;

    it("rejects user creation if required fields are missing or invalid", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({
          fullName: "A",
          email: "bad-email",
          role: "INVALID_ROLE",
          initialPassword: "123",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });

    it("rejects user creation with weak initial password", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({
          fullName: "New Staff Member",
          email: `weak-${Date.now()}@example.com`,
          role: "IT_STAFF",
          initialPassword: "weakpassword",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("WEAK_PASSWORD");
      expect(res.body.error).toHaveProperty("details");
    });

    it("creates a new user successfully with mustChangePassword = true", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({
          fullName: "Test Support Engineer",
          email: testEmail,
          role: "IT_STAFF",
          initialPassword: "SecurePassword123!",
        });

      expect(res.status).toBe(201);
      expect(res.body.fullName).toBe("Test Support Engineer");
      expect(res.body.email).toBe(testEmail.toLowerCase());
      expect(res.body.role).toBe("IT_STAFF");
      expect(res.body.isActive).toBe(true);
      expect(res.body.mustChangePassword).toBe(true);
      expect(res.body).not.toHaveProperty("passwordHash");
    });

    it("rejects creation with duplicate email with 409 Conflict (BR-08)", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({
          fullName: "Duplicate User",
          email: testEmail.toUpperCase(),
          role: "IT_STAFF",
          initialPassword: "SecurePassword123!",
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
    });

    it("allows the created user to login and reports mustChangePassword: true", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: testEmail,
          password: "SecurePassword123!",
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user.mustChangePassword).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // ADM-03: User Editing & Active Toggle (AC-19, BR-19)
  // -------------------------------------------------------------------------
  describe("ADM-03: User Editing & Status Update", () => {
    let createdUserId: number;

    beforeAll(async () => {
      const prisma = getPrisma();
      const user = await prisma.user.create({
        data: {
          fullName: "Editable User",
          email: `edit-test-${Date.now()}@example.com`,
          role: "REQUESTER",
          passwordHash: "hash1234",
          isActive: true,
          mustChangePassword: false,
        },
      });
      createdUserId = user.id;
    });

    it("updates full name, role, and active status", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${createdUserId}`)
        .set("Cookie", adminCookie)
        .send({
          fullName: "Updated Name",
          role: "IT_STAFF",
          isActive: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.fullName).toBe("Updated Name");
      expect(res.body.role).toBe("IT_STAFF");
      expect(res.body.isActive).toBe(false);
    });

    it("rejects update if target user does not exist (404)", async () => {
      const res = await request(app)
        .patch("/api/admin/users/999999")
        .set("Cookie", adminCookie)
        .send({ fullName: "Ghost" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("rejects updating email to one already registered by another user (409)", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${createdUserId}`)
        .set("Cookie", adminCookie)
        .send({ email: adminUser.email });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
    });
  });

  // -------------------------------------------------------------------------
  // SEC-05 & SEC-06: Administrator Safeguards (BR-20, BR-21)
  // -------------------------------------------------------------------------
  describe("SEC-05 & SEC-06: Administrator Safeguards", () => {
    it("prevents admin from deactivating their own account (SEC-05, BR-20)", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${adminUser.id}`)
        .set("Cookie", adminCookie)
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("CANNOT_DEACTIVATE_SELF");
    });

    it("prevents deactivating or demoting the last active administrator (SEC-06, BR-21)", async () => {
      const prisma = getPrisma();

      // Create a separate temporary admin session so we don't trip the self-deactivation guard
      const secondAdmin = await prisma.user.create({
        data: {
          fullName: "Second Admin",
          email: `sec-admin-${Date.now()}@example.com`,
          role: "ADMINISTRATOR",
          passwordHash: "hash123",
          isActive: true,
          mustChangePassword: false,
        },
      });
      const secondAdminCookie = `toktickit_session=${createSession(secondAdmin.id)}`;

      // Deactivate other admins if any, leaving only adminUser and secondAdmin
      await prisma.user.updateMany({
        where: {
          role: "ADMINISTRATOR",
          id: { notIn: [adminUser.id, secondAdmin.id] },
        },
        data: { isActive: false },
      });

      // Now deactivate adminUser using secondAdmin: should succeed because there are 2 active admins
      const deact1 = await request(app)
        .patch(`/api/admin/users/${adminUser.id}`)
        .set("Cookie", secondAdminCookie)
        .send({ isActive: false });
      expect(deact1.status).toBe(200);

      // Now only secondAdmin is active!
      // Attempt to demote secondAdmin:
      const demoteRes = await request(app)
        .patch(`/api/admin/users/${secondAdmin.id}`)
        .set("Cookie", secondAdminCookie)
        .send({ role: "IT_STAFF" });

      expect(demoteRes.status).toBe(400);
      expect(demoteRes.body.error.code).toBe("LAST_ACTIVE_ADMIN");

      // Reactivate adminUser so our test environment stays healthy
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { isActive: true },
      });
    });
  });

  // -------------------------------------------------------------------------
  // ADM-04: Password Reset (AC-19, BR-22)
  // -------------------------------------------------------------------------
  describe("ADM-04: Administrator Password Reset", () => {
    let targetUserId: number;
    const targetEmail = `reset-target-${Date.now()}@example.com`;

    beforeAll(async () => {
      const prisma = getPrisma();
      const user = await prisma.user.create({
        data: {
          fullName: "Reset Target",
          email: targetEmail,
          role: "REQUESTER",
          passwordHash: "oldhash",
          isActive: true,
          mustChangePassword: false,
        },
      });
      targetUserId = user.id;
    });

    it("rejects password reset with weak password", async () => {
      const res = await request(app)
        .post(`/api/admin/users/${targetUserId}/reset-password`)
        .set("Cookie", adminCookie)
        .send({ initialPassword: "weak" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("WEAK_PASSWORD");
    });

    it("resets password successfully and sets mustChangePassword = true", async () => {
      const res = await request(app)
        .post(`/api/admin/users/${targetUserId}/reset-password`)
        .set("Cookie", adminCookie)
        .send({ initialPassword: "NewResetPassword456!" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.mustChangePassword).toBe(true);

      // Verify the user can login with the newly set password and is prompted to change it
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: targetEmail,
          password: "NewResetPassword456!",
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user.mustChangePassword).toBe(true);
    });

    it("returns 404 for non-existent user ID", async () => {
      const res = await request(app)
        .post("/api/admin/users/999999/reset-password")
        .set("Cookie", adminCookie)
        .send({ initialPassword: "NewResetPassword456!" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });
});
