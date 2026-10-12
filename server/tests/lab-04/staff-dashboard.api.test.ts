import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { createSession } from "../../src/session.js";

describe("Lab 4 IT Staff Dashboard APIs (Issue #61 / DASH-STF-01, DASH-STF-02, DASH-SEC-01, SMOKE-01, AC-10)", () => {
  const prisma = getPrisma();

  let staff1Cookie: string;
  let staff2Cookie: string;
  let adminCookie: string;
  let requesterCookie: string;

  let staff1Id: number;
  let staff2Id: number;
  let adminId: number;
  let requesterId: number;

  beforeAll(async () => {
    // 1. Fetch seed users
    const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
    const reqUser = users.find((u) => u.role === "REQUESTER" && u.isActive);
    const staffUsers = users.filter((u) => u.role === "IT_STAFF" && u.isActive);
    const admUser = users.find((u) => u.role === "ADMINISTRATOR" && u.isActive);

    if (!reqUser || staffUsers.length < 1 || !admUser) {
      throw new Error("Required seed users for dashboard tests not found.");
    }

    requesterId = reqUser.id;
    staff1Id = staffUsers[0].id;
    adminId = admUser.id;

    // Ensure we have a second staff user to verify personal actions isolation
    if (staffUsers.length >= 2) {
      staff2Id = staffUsers[1].id;
    } else {
      const createdStaff2 = await prisma.user.create({
        data: {
          fullName: "Anan Staff2",
          email: "anan.staff2@toktickit.com",
          passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz123456",
          role: "IT_STAFF",
          isActive: true,
          mustChangePassword: false,
        },
      });
      staff2Id = createdStaff2.id;
    }

    await prisma.user.updateMany({
      where: { id: { in: [requesterId, staff1Id, staff2Id, adminId] } },
      data: { mustChangePassword: false },
    });

    staff1Cookie = `toktickit_session=${createSession(staff1Id)}`;
    staff2Cookie = `toktickit_session=${createSession(staff2Id)}`;
    adminCookie = `toktickit_session=${createSession(adminId)}`;
    requesterCookie = `toktickit_session=${createSession(requesterId)}`;

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const system = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    // 2. Setup known test tickets to guarantee metrics verification
    // A. Unassigned active ticket
    await prisma.ticket.create({
      data: {
        ticketNumber: `TK-DASH-UN-${Date.now().toString().slice(-6)}`,
        summary: "Dashboard Unassigned Test Ticket",
        description: "Checking unassignedCount metric in dashboard",
        categoryId: category!.id,
        relatedSystemId: system!.id,
        requestedPriority: "MEDIUM",
        itPriority: "HIGH",
        currentStatus: "NEW",
        requesterId: requesterId,
        primaryOwnerId: null,
      },
    });

    // B. Staff1 assigned active ticket (HIGH priority)
    const staff1Ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TK-DASH-ST1-${Date.now().toString().slice(-6)}`,
        summary: "Dashboard Staff 1 Assigned Ticket",
        description: "Checking myTicketsCount metric for Staff 1",
        categoryId: category!.id,
        relatedSystemId: system!.id,
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        currentStatus: "IN_PROGRESS",
        requesterId: requesterId,
        primaryOwnerId: staff1Id,
      },
    });

    // C. Actions taken by staff1 vs staff2
    await prisma.actionTaken.create({
      data: {
        ticketId: staff1Ticket.id,
        performedById: staff1Id,
        description: "Staff 1 took action on ticket",
        result: "Hardware diagnostics passed successfully",
      },
    });

    await prisma.actionTaken.create({
      data: {
        ticketId: staff1Ticket.id,
        performedById: staff2Id,
        description: "Staff 2 took action on ticket",
        result: "Replaced faulty switch port",
      },
    });
  });

  // -------------------------------------------------------------------------
  // DASH-STF-01: IT Staff Dashboard query (AC-10, BR-17)
  // -------------------------------------------------------------------------
  it("DASH-STF-01: IT Staff queries GET /api/dashboard/staff and receives accurate operational metrics and breakdowns", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staff1Cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
    expect(res.body).toHaveProperty("statusBreakdown");
    expect(res.body).toHaveProperty("priorityBreakdown");
    expect(res.body).toHaveProperty("recentTickets");
    expect(res.body).toHaveProperty("myRecentActions");

    const { metrics, statusBreakdown, priorityBreakdown, recentTickets, myRecentActions } = res.body;

    // Verify metrics shape
    expect(typeof metrics.unassignedCount).toBe("number");
    expect(typeof metrics.myTicketsCount).toBe("number");
    expect(typeof metrics.criticalHighCount).toBe("number");
    expect(typeof metrics.myActionsCount).toBe("number");
    expect(metrics.unassignedCount).toBeGreaterThanOrEqual(1);
    expect(metrics.myTicketsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.criticalHighCount).toBeGreaterThanOrEqual(1);

    // Verify status breakdown includes all required statuses
    expect(statusBreakdown).toHaveProperty("NEW");
    expect(statusBreakdown).toHaveProperty("OPEN");
    expect(statusBreakdown).toHaveProperty("IN_PROGRESS");
    expect(statusBreakdown).toHaveProperty("WAITING_FOR_REQUESTER");
    expect(statusBreakdown).toHaveProperty("RESOLVED");
    expect(statusBreakdown).toHaveProperty("CLOSED");
    expect(statusBreakdown).toHaveProperty("REOPENED");
    expect(statusBreakdown).toHaveProperty("CANCELLED");

    // Verify priority breakdown
    expect(priorityBreakdown).toHaveProperty("LOW");
    expect(priorityBreakdown).toHaveProperty("MEDIUM");
    expect(priorityBreakdown).toHaveProperty("HIGH");

    // Verify recent tickets array
    expect(Array.isArray(recentTickets)).toBe(true);
    expect(recentTickets.length).toBeGreaterThan(0);
    const firstTicket = recentTickets[0];
    expect(firstTicket).toHaveProperty("id");
    expect(firstTicket).toHaveProperty("ticketNumber");
    expect(firstTicket).toHaveProperty("summary");
    expect(firstTicket).toHaveProperty("currentStatus");
    expect(firstTicket).toHaveProperty("itPriority");
    expect(firstTicket).toHaveProperty("updatedAt");

    // Verify my recent actions array
    expect(Array.isArray(myRecentActions)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // DASH-STF-02: Staff personal actions isolation (AC-10, BR-18)
  // -------------------------------------------------------------------------
  it("DASH-STF-02: Staff personal actions count is accurately scoped to authenticated staff user", async () => {
    // 1. Fetch count for staff1
    const res1 = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staff1Cookie);
    expect(res1.status).toBe(200);

    // 2. Fetch count for staff2
    const res2 = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staff2Cookie);
    expect(res2.status).toBe(200);

    // Calculate actual DB counts for both
    const dbCount1 = await prisma.actionTaken.count({ where: { performedById: staff1Id } });
    const dbCount2 = await prisma.actionTaken.count({ where: { performedById: staff2Id } });

    expect(res1.body.metrics.myActionsCount).toBe(dbCount1);
    expect(res2.body.metrics.myActionsCount).toBe(dbCount2);

    // Each staff's myRecentActions only contains actions performed by themselves
    if (res1.body.myRecentActions.length > 0) {
      const staff1ActionIds = res1.body.myRecentActions.map((a: any) => a.id);
      const staff1DbActions = await prisma.actionTaken.findMany({
        where: { id: { in: staff1ActionIds } },
        select: { performedById: true },
      });
      staff1DbActions.forEach((a) => {
        expect(a.performedById).toBe(staff1Id);
      });
    }
  });

  // -------------------------------------------------------------------------
  // DASH-SEC-01: Requester access forbidden (AC-10, BR-09)
  // -------------------------------------------------------------------------
  it("DASH-SEC-01: Requester calling GET /api/dashboard/staff is rejected with 403 Forbidden", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", requesterCookie);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  // -------------------------------------------------------------------------
  // Authentication boundary
  // -------------------------------------------------------------------------
  it("DASH-SEC-02: Unauthenticated request to GET /api/dashboard/staff is rejected with 401 Unauthorized", async () => {
    const res = await request(app).get("/api/dashboard/staff");
    expect(res.status).toBe(401);
  });

  it("DASH-SEC-03: Administrator has access to GET /api/dashboard/staff and GET /api/dashboard/admin", async () => {
    const resStaff = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", adminCookie);
    expect(resStaff.status).toBe(200);
    expect(resStaff.body).toHaveProperty("metrics");

    const resAdmin = await request(app)
      .get("/api/dashboard/admin")
      .set("Cookie", adminCookie);
    expect(resAdmin.status).toBe(200);
    expect(resAdmin.body).toHaveProperty("userAccounts");
    expect(resAdmin.body.userAccounts).toHaveProperty("totalUsers");
  });

  // -------------------------------------------------------------------------
  // SMOKE-01: Performance-smoke response latency (<200ms)
  // -------------------------------------------------------------------------
  it("SMOKE-01: Performance-smoke: Staff dashboard query response latency is under 200ms", async () => {
    const start = performance.now();
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staff1Cookie);
    const duration = performance.now() - start;

    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(200);
  });
});
