import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { expireAllSessions } from "../../src/session.js";
import bcrypt from "bcryptjs";

describe("Lab 3 Authentication & Password Lifecycle APIs (Issue #35)", () => {
  const prisma = getPrisma();

  // Test accounts from database seed
  const testRequesterEmail = "somchai.j@kmutt.ac.th";
  const inactiveRequesterEmail = "former.staff@kmutt.ac.th";
  const defaultPassword = "Password123!";

  // AUTH-01: Valid login returns user context and sets signed HttpOnly session cookie (AC-01, BR-01)
  it("AUTH-01 (AC-01, BR-01): POST /api/auth/login sets session cookie and returns user profile", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testRequesterEmail,
        password: defaultPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testRequesterEmail);
    expect(res.body.user.role).toBe("REQUESTER");
    expect(res.body.user.isActive).toBe(true);

    // Verify session cookie
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const sessionCookie = cookies.find((c: string) => c.startsWith("toktickit_session="));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toContain("HttpOnly");
  });

  // AUTH-02: Invalid password or unregistered email returns generic 401 (AC-01, BR-01)
  it("AUTH-02 (AC-01, BR-01): POST /api/auth/login returns generic 401 for wrong password or unregistered email", async () => {
    // Unregistered email
    const res1 = await request(app)
      .post("/api/auth/login")
      .send({
        email: "nonexistent.user@toktickit.local",
        password: "Password123!",
      });
    expect(res1.status).toBe(401);
    expect(res1.body.error.code).toBe("UNAUTHORIZED");
    expect(res1.body.error.message).toBe("Invalid email or password");

    // Registered email with incorrect password
    const res2 = await request(app)
      .post("/api/auth/login")
      .send({
        email: testRequesterEmail,
        password: "WrongPassword999!",
      });
    expect(res2.status).toBe(401);
    expect(res2.body.error.code).toBe("UNAUTHORIZED");
    expect(res2.body.error.message).toBe("Invalid email or password");
  });

  // AUTH-03: Inactive account returns generic 401 (AC-01, BR-01)
  it("AUTH-03 (AC-01, BR-01): POST /api/auth/login returns generic 401 for deactivated account", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: inactiveRequesterEmail,
        password: defaultPassword,
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    expect(res.body.error.message).toBe("Invalid email or password");
  });

  // AUTH-07: GET /api/auth/me returns profile for active session vs 401 for unauthenticated or expired session (AC-04, BR-06)
  it("AUTH-07 (AC-04, BR-06): GET /api/auth/me returns current user profile with valid cookie vs 401 for absent or expired session", async () => {
    // 1. Unauthenticated request (absent session)
    const unauthRes = await request(app).get("/api/auth/me");
    expect(unauthRes.status).toBe(401);
    expect(unauthRes.body.error.code).toBe("UNAUTHORIZED");

    // 2. Authenticated request (valid session)
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: testRequesterEmail,
        password: defaultPassword,
      });
    expect(loginRes.status).toBe(200);
    const cookie = loginRes.headers["set-cookie"];

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(testRequesterEmail);
    expect(meRes.body.user.role).toBe("REQUESTER");

    // 3. Expired session test (expire session and verify 401 rejection)
    expireAllSessions();

    const expiredRes = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookie);

    expect(expiredRes.status).toBe(401);
    expect(expiredRes.body.error.code).toBe("UNAUTHORIZED");
    expect(expiredRes.body.error.message).toMatch(/expired|invalid/i);

    // Subsequent request is also rejected because expired session was pruned from store
    const secondRes = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookie);
    expect(secondRes.status).toBe(401);
  });

  // AUTH-04: Password complexity validation on change-password (AC-03, BR-03)
  it("AUTH-04 (AC-03, BR-03): POST /api/auth/change-password enforces complexity (>=8 chars, upper, lower, digit)", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: testRequesterEmail,
        password: defaultPassword,
      });
    expect(loginRes.status).toBe(200);
    const cookie = loginRes.headers["set-cookie"];

    // Too short (< 8 chars)
    const resShort = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", cookie)
      .send({ newPassword: "Ab1", confirmPassword: "Ab1" });
    expect(resShort.status).toBe(400);
    expect(resShort.body.error.code).toBe("BAD_REQUEST");

    // Missing uppercase
    const resNoUpper = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", cookie)
      .send({ newPassword: "password123!", confirmPassword: "password123!" });
    expect(resNoUpper.status).toBe(400);

    // Missing lowercase
    const resNoLower = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", cookie)
      .send({ newPassword: "PASSWORD123!", confirmPassword: "PASSWORD123!" });
    expect(resNoLower.status).toBe(400);

    // Missing number
    const resNoNumber = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", cookie)
      .send({ newPassword: "PasswordNoNum!", confirmPassword: "PasswordNoNum!" });
    expect(resNoNumber.status).toBe(400);

    // Mismatched confirmation
    const resMismatch = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", cookie)
      .send({ newPassword: "NewValidPassword123!", confirmPassword: "DifferentPassword123!" });
    expect(resMismatch.status).toBe(400);
  });

  // AUTH-05: User with mustChangePassword = true blocked with 403 on protected normal endpoints (AC-02, BR-04)
  it("AUTH-05 (AC-02, BR-04): User with mustChangePassword = true is blocked with 403 on normal endpoints", async () => {
    // Ensure user has mustChangePassword = true
    await prisma.user.update({
      where: { email: testRequesterEmail },
      data: { mustChangePassword: true },
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: testRequesterEmail,
        password: defaultPassword,
      });
    expect(loginRes.status).toBe(200);
    const cookie = loginRes.headers["set-cookie"];

    // Protected normal endpoint should be blocked with 403 PASSWORD_CHANGE_REQUIRED
    const protectedRes = await request(app)
      .get("/api/auth/protected-check")
      .set("Cookie", cookie);

    expect(protectedRes.status).toBe(403);
    expect(protectedRes.body.error.code).toBe("PASSWORD_CHANGE_REQUIRED");

    // But /api/auth/me and /api/auth/change-password should be allowed
    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookie);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.mustChangePassword).toBe(true);
  });

  // AUTH-06: POST /api/auth/change-password successfully updates password and clears flag (AC-02, BR-05)
  it("AUTH-06 (AC-02, BR-05): POST /api/auth/change-password updates password and clears mustChangePassword", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: testRequesterEmail,
        password: defaultPassword,
      });
    expect(loginRes.status).toBe(200);
    const cookie = loginRes.headers["set-cookie"];

    const newPassword = "UpdatedSecurePassword2026!";
    const changeRes = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", cookie)
      .send({
        newPassword,
        confirmPassword: newPassword,
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.success).toBe(true);

    // Verify user in DB has mustChangePassword = false
    const updatedUser = await prisma.user.findUnique({
      where: { email: testRequesterEmail },
    });
    expect(updatedUser?.mustChangePassword).toBe(false);

    // Normal protected endpoints are now accessible
    const protectedRes = await request(app)
      .get("/api/auth/protected-check")
      .set("Cookie", cookie);
    expect(protectedRes.status).toBe(200);

    // Can log in with new password
    const newLoginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: testRequesterEmail,
        password: newPassword,
      });
    expect(newLoginRes.status).toBe(200);

    // Reset password back to defaultPassword for test idempotency
    const resetHash = await bcrypt.hash(defaultPassword, 10);
    await prisma.user.update({
      where: { email: testRequesterEmail },
      data: { passwordHash: resetHash, mustChangePassword: true },
    });
  });

  // AUTH-08: POST /api/auth/logout terminates session and clears cookie (AC-04, BR-06)
  it("AUTH-08 (AC-04, BR-06): POST /api/auth/logout terminates session and invalidates subsequent requests", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: testRequesterEmail,
        password: defaultPassword,
      });
    expect(loginRes.status).toBe(200);
    const cookie = loginRes.headers["set-cookie"];

    // Logout
    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookie);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // Verify cookie cleared in response
    const logoutCookies = logoutRes.headers["set-cookie"];
    expect(logoutCookies).toBeDefined();

    // Subsequent request using old cookie should fail with 401
    const subsequentRes = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookie);
    expect(subsequentRes.status).toBe(401);
  });
});
