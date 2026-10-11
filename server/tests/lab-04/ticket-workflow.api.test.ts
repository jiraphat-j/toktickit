import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { createSession } from "../../src/session.js";

describe("Lab 4 Ticket Workflow, Resolution Gate, and Status Transitions (Issue #60 / WF-01..05, AC-06..08, AC-12, BR-11..15, BR-19)", () => {
  const prisma = getPrisma();

  let staffCookie: string;
  let adminCookie: string;
  let requesterCookie: string;

  let staffId: number;
  let adminId: number;
  let requesterId: number;

  let zeroActionsTicketId: number;
  let workflowTicketId: number;
  let newTicketId: number;

  beforeAll(async () => {
    // 1. Fetch seeded users
    const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
    const reqUser = users.find((u) => u.role === "REQUESTER" && u.isActive);
    const stUser = users.find((u) => u.role === "IT_STAFF" && u.isActive);
    const admUser = users.find((u) => u.role === "ADMINISTRATOR" && u.isActive);

    if (!reqUser || !stUser || !admUser) {
      throw new Error("Required seed users not found.");
    }

    requesterId = reqUser.id;
    staffId = stUser.id;
    adminId = admUser.id;

    await prisma.user.updateMany({
      where: { id: { in: [requesterId, staffId, adminId] } },
      data: { mustChangePassword: false },
    });

    staffCookie = `toktickit_session=${createSession(staffId)}`;
    adminCookie = `toktickit_session=${createSession(adminId)}`;
    requesterCookie = `toktickit_session=${createSession(requesterId)}`;

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const system = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    // 2. Create Ticket with 0 Actions Taken (IN_PROGRESS) for Resolution Gate test
    const t0 = await prisma.ticket.create({
      data: {
        ticketNumber: `TK-WF-ZERO-${Date.now().toString().slice(-6)}`,
        summary: "Zero actions resolution gate test ticket",
        description: "Must be blocked from resolving until an action is recorded",
        categoryId: category!.id,
        relatedSystemId: system!.id,
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        currentStatus: "IN_PROGRESS",
        requesterId: requesterId,
        primaryOwnerId: staffId,
      },
    });
    zeroActionsTicketId = t0.id;

    // 3. Create Ticket for complete workflow transitions (starting at OPEN)
    const tw = await prisma.ticket.create({
      data: {
        ticketNumber: `TK-WF-FLOW-${Date.now().toString().slice(-6)}`,
        summary: "Full workflow lifecycle test ticket",
        description: "Testing status state machine and resolution with actions",
        categoryId: category!.id,
        relatedSystemId: system!.id,
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        currentStatus: "OPEN",
        requesterId: requesterId,
        primaryOwnerId: staffId,
      },
    });
    workflowTicketId = tw.id;

    // 4. Create Ticket starting at NEW for illegal transition tests
    const tn = await prisma.ticket.create({
      data: {
        ticketNumber: `TK-WF-NEW-${Date.now().toString().slice(-6)}`,
        summary: "Triage ticket starting at NEW",
        description: "Testing prohibited jumps from NEW state",
        categoryId: category!.id,
        relatedSystemId: system!.id,
        requestedPriority: "LOW",
        itPriority: "LOW",
        currentStatus: "NEW",
        requesterId: requesterId,
      },
    });
    newTicketId = tn.id;
  });

  afterAll(async () => {
    // Clean up created test tickets and their actions
    await prisma.actionTaken.deleteMany({
      where: { ticketId: { in: [zeroActionsTicketId, workflowTicketId, newTicketId] } },
    });
    await prisma.ticket.deleteMany({
      where: { id: { in: [zeroActionsTicketId, workflowTicketId, newTicketId] } },
    });
  });

  // ---------------------------------------------------------------------------
  // WF-01 & WF-02: Resolution Gate Enforcement
  // ---------------------------------------------------------------------------
  describe("Resolution Gate Enforcement (WF-01, WF-02 / AC-06, BR-13)", () => {
    it("WF-01: rejects transition to RESOLVED when ticket has 0 Actions Taken (400 RESOLUTION_GATE_FAILED)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${zeroActionsTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "RESOLVED" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe("RESOLUTION_GATE_FAILED");
      expect(res.body.error.message).toMatch(/At least one Action Taken must be logged before resolving/i);

      // Verify DB status remains unchanged (IN_PROGRESS)
      const ticket = await prisma.ticket.findUnique({ where: { id: zeroActionsTicketId } });
      expect(ticket?.currentStatus).toBe("IN_PROGRESS");
    });

    it("WF-02: server-side gate blocks client bypass attempts directly requesting resolution without actions", async () => {
      // Attempt resolution via alias route /api/tickets/:id/status
      const res = await request(app)
        .patch(`/api/tickets/${zeroActionsTicketId}/status`)
        .set("Cookie", adminCookie)
        .send({ status: "RESOLVED" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("RESOLUTION_GATE_FAILED");

      // Verify DB status is strictly protected
      const ticket = await prisma.ticket.findUnique({ where: { id: zeroActionsTicketId } });
      expect(ticket?.currentStatus).toBe("IN_PROGRESS");
    });
  });

  // ---------------------------------------------------------------------------
  // WF-03: Resolution Gate Passed with >= 1 Action Taken
  // ---------------------------------------------------------------------------
  describe("Resolution Gate Passed (WF-03 / AC-07, BR-13)", () => {
    it("WF-03: successfully transitions to RESOLVED once an Action Taken is logged", async () => {
      // Step 1: Advance workflowTicketId from OPEN to IN_PROGRESS
      const advRes = await request(app)
        .patch(`/api/staff/tickets/${workflowTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "IN_PROGRESS" });
      expect(advRes.status).toBe(200);
      expect(advRes.body.currentStatus).toBe("IN_PROGRESS");

      // Step 2: Attempt resolution before logging action (should fail)
      const failRes = await request(app)
        .patch(`/api/staff/tickets/${workflowTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "RESOLVED" });
      expect(failRes.status).toBe(400);
      expect(failRes.body.error.code).toBe("RESOLUTION_GATE_FAILED");

      // Step 3: Log an Action Taken on workflowTicketId
      const actionRes = await request(app)
        .post(`/api/tickets/${workflowTicketId}/actions-taken`)
        .set("Cookie", staffCookie)
        .send({
          description: "Diagnosed software issue and applied configuration patch",
          result: "Issue resolved successfully; verified system responsiveness",
          followUpRequired: false,
        });
      expect(actionRes.status).toBe(201);

      // Step 4: Now transition to RESOLVED (should succeed!)
      const resolveRes = await request(app)
        .patch(`/api/staff/tickets/${workflowTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "RESOLVED" });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.currentStatus).toBe("RESOLVED");
      expect(resolveRes.body.updatedAt).toBeDefined();

      // Verify in DB
      const updatedTicket = await prisma.ticket.findUnique({ where: { id: workflowTicketId } });
      expect(updatedTicket?.currentStatus).toBe("RESOLVED");
    });
  });

  // ---------------------------------------------------------------------------
  // WF-04: Requester Problem Appears Resolved Indicator (Advisory Only)
  // ---------------------------------------------------------------------------
  describe("Requester Resolution Indication (WF-04 / AC-08, BR-14)", () => {
    it("WF-04: requester sets problemAppearsResolved to true; ticket status remains strictly unchanged", async () => {
      // Current status of zeroActionsTicketId is IN_PROGRESS
      const res = await request(app)
        .post(`/api/tickets/${zeroActionsTicketId}/resolve-indication`)
        .set("Cookie", requesterCookie)
        .send({ resolved: true });

      expect(res.status).toBe(200);
      expect(res.body.problemAppearsResolved).toBe(true);
      expect(res.body.currentStatus).toBe("IN_PROGRESS");

      // Verify in DB that flag is true but status is NOT auto-resolved
      const ticket = await prisma.ticket.findUnique({ where: { id: zeroActionsTicketId } });
      expect(ticket?.problemAppearsResolved).toBe(true);
      expect(ticket?.currentStatus).toBe("IN_PROGRESS"); // Still IN_PROGRESS! Not RESOLVED!
    });

    it("WF-04: supports alias route /api/tickets/:id/indicate-resolved with indicated payload", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${zeroActionsTicketId}/indicate-resolved`)
        .set("Cookie", requesterCookie)
        .send({ indicated: true });

      expect(res.status).toBe(200);
      expect(res.body.requesterIndicatedResolved).toBe(true);
      expect(res.body.status).toBe("IN_PROGRESS");
    });
  });

  // ---------------------------------------------------------------------------
  // WF-05: Illegal Status Transitions
  // ---------------------------------------------------------------------------
  describe("Illegal Status Transitions (WF-05 / AC-12, BR-15)", () => {
    it("WF-05: rejects illegal jump NEW -> RESOLVED with 400 ILLEGAL_STATUS_TRANSITION", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${newTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "RESOLVED" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe("ILLEGAL_STATUS_TRANSITION");
      expect(res.body.error.message).toMatch(/Cannot transition status from NEW to RESOLVED directly/i);

      // Verify DB remains NEW
      const ticket = await prisma.ticket.findUnique({ where: { id: newTicketId } });
      expect(ticket?.currentStatus).toBe("NEW");
    });

    it("WF-05: rejects illegal jump NEW -> CLOSED with 400 ILLEGAL_STATUS_TRANSITION", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${newTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "CLOSED" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("ILLEGAL_STATUS_TRANSITION");
      expect(res.body.error.message).toMatch(/Cannot transition status from NEW to CLOSED directly/i);
    });

    it("WF-05: rejects illegal jump RESOLVED -> IN_PROGRESS directly", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${workflowTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "IN_PROGRESS" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("ILLEGAL_STATUS_TRANSITION");
    });
  });

  // ---------------------------------------------------------------------------
  // Concurrency Conflict Handling (AC-12, BR-19)
  // ---------------------------------------------------------------------------
  describe("Optimistic Concurrency Control (AC-12, BR-19)", () => {
    it("rejects status transition with stale clientUpdatedAt timestamp (409 Conflict)", async () => {
      const staleTimestamp = new Date(Date.now() - 3600 * 1000).toISOString();

      const res = await request(app)
        .patch(`/api/staff/tickets/${workflowTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({
          status: "CLOSED",
          clientUpdatedAt: staleTimestamp,
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe("CONFLICT");
      expect(res.body.error.currentUpdatedAt).toBeDefined();

      // Verify status was NOT changed to CLOSED
      const ticket = await prisma.ticket.findUnique({ where: { id: workflowTicketId } });
      expect(ticket?.currentStatus).toBe("RESOLVED");
    });

    it("succeeds when clientUpdatedAt matches current server timestamp", async () => {
      const ticket = await prisma.ticket.findUnique({ where: { id: workflowTicketId } });
      const currentTimestamp = ticket!.updatedAt.toISOString();

      const res = await request(app)
        .patch(`/api/staff/tickets/${workflowTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({
          status: "CLOSED",
          clientUpdatedAt: currentTimestamp,
        });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("CLOSED");
    });
  });

  // ---------------------------------------------------------------------------
  // RBAC Authorization (SEC-02)
  // ---------------------------------------------------------------------------
  describe("RBAC Authorization for Ticket Status Updates", () => {
    it("rejects unauthenticated requests with 401 Unauthorized", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${workflowTicketId}/status`)
        .send({ status: "REOPENED" });

      expect(res.status).toBe(401);
    });

    it("rejects requester role attempting to execute status transition with 403 Forbidden", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${workflowTicketId}/status`)
        .set("Cookie", requesterCookie)
        .send({ status: "REOPENED" });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("allows administrator to execute permitted status transitions", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${workflowTicketId}/status`)
        .set("Cookie", adminCookie)
        .send({ status: "REOPENED" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("REOPENED");
    });
  });
});
