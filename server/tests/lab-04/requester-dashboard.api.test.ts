import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { createSession } from "../../src/session.js";

describe("Lab 4 Requester Dashboard APIs (Issue #62 / DASH-REQ-01, DASH-REQ-02, AC-09, BR-16)", () => {
  const prisma = getPrisma();

  let req1Cookie: string;
  let req2Cookie: string;
  let emptyReqCookie: string;
  let staffCookie: string;

  let req1Id: number;
  let req2Id: number;
  let emptyReqId: number;
  let staffId: number;

  beforeAll(async () => {
    // 1. Fetch seed users
    const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
    const requesterUsers = users.filter((u) => u.role === "REQUESTER" && u.isActive);
    const staffUser = users.find((u) => u.role === "IT_STAFF" && u.isActive);

    if (requesterUsers.length < 1 || !staffUser) {
      throw new Error("Required seed users for requester dashboard tests not found.");
    }

    req1Id = requesterUsers[0].id;
    staffId = staffUser.id;

    // Ensure we have a distinct second requester user for data isolation tests (DASH-REQ-02)
    if (requesterUsers.length >= 2) {
      req2Id = requesterUsers[1].id;
    } else {
      const createdReq2 = await prisma.user.create({
        data: {
          fullName: "Supaporn Req2",
          email: `supaporn.req2.${Date.now()}@toktickit.com`,
          passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz123456",
          role: "REQUESTER",
          isActive: true,
          mustChangePassword: false,
        },
      });
      req2Id = createdReq2.id;
    }

    // Create an empty requester with 0 tickets to test empty dashboard state
    const emptyReq = await prisma.user.create({
      data: {
        fullName: "Zero Tickets Requester",
        email: `zero.tickets.${Date.now()}@toktickit.com`,
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz123456",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
      },
    });
    emptyReqId = emptyReq.id;

    await prisma.user.updateMany({
      where: { id: { in: [req1Id, req2Id, emptyReqId, staffId] } },
      data: { mustChangePassword: false },
    });

    req1Cookie = `toktickit_session=${createSession(req1Id)}`;
    req2Cookie = `toktickit_session=${createSession(req2Id)}`;
    emptyReqCookie = `toktickit_session=${createSession(emptyReqId)}`;
    staffCookie = `toktickit_session=${createSession(staffId)}`;

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const system = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    // Setup distinct tickets for Requester 1
    // Ticket 1: WAITING_FOR_REQUESTER (Attention Required)
    await prisma.ticket.create({
      data: {
        ticketNumber: `TK-REQ1-WAIT-${Date.now().toString().slice(-6)}`,
        summary: "Req1 Needs to Provide Additional Info",
        description: "Checking waitingForRequesterCount and attentionTickets",
        categoryId: category!.id,
        relatedSystemId: system!.id,
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        currentStatus: "WAITING_FOR_REQUESTER",
        requesterId: req1Id,
      },
    });

    // Ticket 2: IN_PROGRESS
    await prisma.ticket.create({
      data: {
        ticketNumber: `TK-REQ1-PROG-${Date.now().toString().slice(-6)}`,
        summary: "Req1 In Progress Ticket",
        description: "Checking totalOpenTickets and inProgress metric",
        categoryId: category!.id,
        relatedSystemId: system!.id,
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        currentStatus: "IN_PROGRESS",
        requesterId: req1Id,
      },
    });

    // Setup ticket for Requester 2 (isolated)
    await prisma.ticket.create({
      data: {
        ticketNumber: `TK-REQ2-NEW-${Date.now().toString().slice(-6)}`,
        summary: "Req2 Private Isolated Ticket",
        description: "User 1 should never see this ticket in their dashboard",
        categoryId: category!.id,
        relatedSystemId: system!.id,
        requestedPriority: "LOW",
        itPriority: "LOW",
        currentStatus: "NEW",
        requesterId: req2Id,
      },
    });
  });

  // -------------------------------------------------------------------------
  // DASH-REQ-01: Metrics shape, attention tickets, recent tickets (AC-09, BR-16)
  // -------------------------------------------------------------------------
  it("DASH-REQ-01: GET /api/dashboard/requester returns accurate metrics, attention tickets, and recent tickets", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", req1Cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
    expect(res.body).toHaveProperty("attentionTickets");
    expect(res.body).toHaveProperty("recentTickets");

    const { metrics, attentionTickets, recentTickets } = res.body;

    // Verify metrics shape and aliases
    expect(typeof metrics.totalOpenTickets).toBe("number");
    expect(metrics.totalOpenTickets).toBe(metrics.totalOpen);
    expect(typeof metrics.waitingForRequesterCount).toBe("number");
    expect(metrics.waitingForRequesterCount).toBe(metrics.waitingForRequester);
    expect(typeof metrics.inProgress).toBe("number");
    expect(typeof metrics.recentlyUpdatedCount).toBe("number");
    expect(metrics.recentlyUpdatedCount).toBe(metrics.recentlyUpdated);
    expect(typeof metrics.recentlyResolvedCount).toBe("number");
    expect(metrics.recentlyResolvedCount).toBe(metrics.recentlyResolved);

    // Should have at least 1 waiting ticket for req1
    expect(metrics.waitingForRequesterCount).toBeGreaterThanOrEqual(1);
    expect(metrics.totalOpenTickets).toBeGreaterThanOrEqual(2);

    // Attention tickets verification
    expect(Array.isArray(attentionTickets)).toBe(true);
    expect(attentionTickets.length).toBeGreaterThan(0);
    const waitingTicket = attentionTickets.find(
      (t: any) => t.currentStatus === "WAITING_FOR_REQUESTER"
    );
    expect(waitingTicket).toBeDefined();
    expect(waitingTicket).toHaveProperty("id");
    expect(waitingTicket).toHaveProperty("ticketNumber");
    expect(waitingTicket).toHaveProperty("summary");
    expect(waitingTicket).toHaveProperty("updatedAt");

    // Recent tickets verification
    expect(Array.isArray(recentTickets)).toBe(true);
    expect(recentTickets.length).toBeGreaterThan(0);
    expect(recentTickets.length).toBeLessThanOrEqual(5);
    recentTickets.forEach((t: any) => {
      expect(t).toHaveProperty("id");
      expect(t).toHaveProperty("ticketNumber");
      expect(t).toHaveProperty("summary");
      expect(t).toHaveProperty("currentStatus");
      expect(t).toHaveProperty("updatedAt");
    });
  });

  // -------------------------------------------------------------------------
  // DASH-REQ-02: Strict Data Isolation between Users A and B (AC-09, BR-16)
  // -------------------------------------------------------------------------
  it("DASH-REQ-02: Zero Data Leakage - User A metrics and lists NEVER include User B tickets", async () => {
    // 1. Fetch dashboard for Requester 1
    const res1 = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", req1Cookie);
    expect(res1.status).toBe(200);

    // 2. Fetch dashboard for Requester 2
    const res2 = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", req2Cookie);
    expect(res2.status).toBe(200);

    // Query DB for exact ticket IDs owned by each user
    const req1DbTickets = await prisma.ticket.findMany({
      where: { requesterId: req1Id },
      select: { id: true, ticketNumber: true },
    });
    const req1DbIds = new Set(req1DbTickets.map((t) => t.id));

    const req2DbTickets = await prisma.ticket.findMany({
      where: { requesterId: req2Id },
      select: { id: true, ticketNumber: true },
    });
    const req2DbIds = new Set(req2DbTickets.map((t) => t.id));

    // Verify all tickets in res1 belonged strictly to req1
    res1.body.recentTickets.forEach((t: any) => {
      expect(req1DbIds.has(t.id)).toBe(true);
      expect(req2DbIds.has(t.id)).toBe(false);
    });
    res1.body.attentionTickets.forEach((t: any) => {
      expect(req1DbIds.has(t.id)).toBe(true);
      expect(req2DbIds.has(t.id)).toBe(false);
    });

    // Verify all tickets in res2 belonged strictly to req2
    res2.body.recentTickets.forEach((t: any) => {
      expect(req2DbIds.has(t.id)).toBe(true);
      expect(req1DbIds.has(t.id)).toBe(false);
    });

    // Confirm that req2's private ticket is not in req1's dashboard
    const req2TicketNumber = req2DbTickets[0].ticketNumber;
    const req1FoundReq2 = res1.body.recentTickets.some(
      (t: any) => t.ticketNumber === req2TicketNumber
    );
    expect(req1FoundReq2).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Empty State: User with 0 tickets
  // -------------------------------------------------------------------------
  it("returns zero counts and empty arrays when user has zero tickets", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", emptyReqCookie);

    expect(res.status).toBe(200);
    expect(res.body.metrics.totalOpenTickets).toBe(0);
    expect(res.body.metrics.totalOpen).toBe(0);
    expect(res.body.metrics.waitingForRequesterCount).toBe(0);
    expect(res.body.metrics.waitingForRequester).toBe(0);
    expect(res.body.metrics.inProgress).toBe(0);
    expect(res.body.metrics.recentlyResolvedCount).toBe(0);
    expect(res.body.metrics.closed).toBe(0);
    expect(res.body.attentionTickets).toEqual([]);
    expect(res.body.recentTickets).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // Authorization & Security: 401 Unauthorized & 403 Forbidden
  // -------------------------------------------------------------------------
  it("returns 401 Unauthorized when request has no session cookie", async () => {
    const res = await request(app).get("/api/dashboard/requester");
    expect(res.status).toBe(401);
  });

  it("returns 403 Forbidden when IT Staff attempts to call requester dashboard", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", staffCookie);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  // -------------------------------------------------------------------------
  // Smoke / Latency check (<200ms)
  // -------------------------------------------------------------------------
  it("SMOKE: GET /api/dashboard/requester responds in under 200ms", async () => {
    const start = Date.now();
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", req1Cookie);
    const duration = Date.now() - start;

    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(200);
  });
});
