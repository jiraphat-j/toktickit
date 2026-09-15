import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { createSession } from "../../src/session.js";

describe("Lab 3 Staff Ticket Detail & Operations API Tests (STF-05..08, AC-13..15, BR-11, BR-13, BR-15)", () => {
  let requesterCookie: string;
  let staffCookie: string;
  let adminCookie: string;
  let requesterUserId: number;
  let staffUserId: number;
  let adminUserId: number;
  let inactiveStaffUserId: number;
  let seededCategoryId: number;
  let seededSystemId: number;
  let testTicketId: number;

  beforeAll(async () => {
    const prisma = getPrisma();

    // Fetch users
    const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
    const reqUser = users.find((u) => u.role === "REQUESTER" && u.isActive);
    const stUser = users.find((u) => u.role === "IT_STAFF" && u.isActive);
    const admUser = users.find((u) => u.role === "ADMINISTRATOR" && u.isActive);

    if (!reqUser || !stUser || !admUser) {
      throw new Error("Required seeded users not found.");
    }

    requesterUserId = reqUser.id;
    staffUserId = stUser.id;
    adminUserId = admUser.id;

    await prisma.user.updateMany({
      where: { id: { in: [reqUser.id, stUser.id, admUser.id] } },
      data: { mustChangePassword: false },
    });

    requesterCookie = `toktickit_session=${createSession(reqUser.id)}`;
    staffCookie = `toktickit_session=${createSession(stUser.id)}`;
    adminCookie = `toktickit_session=${createSession(admUser.id)}`;

    // Create an inactive staff user for negative testing
    const inactiveUser = await prisma.user.upsert({
      where: { email: "inactive_staff_test@toktickit.local" },
      update: { isActive: false, role: "IT_STAFF" },
      create: {
        email: "inactive_staff_test@toktickit.local",
        fullName: "Inactive Staff Tester",
        passwordHash: "hash",
        role: "IT_STAFF",
        isActive: false,
        mustChangePassword: false,
      },
    });
    inactiveStaffUserId = inactiveUser.id;

    const cat = await prisma.category.findFirst({ where: { isActive: true } });
    seededCategoryId = cat!.id;

    const sys = await prisma.relatedSystem.findFirst({ where: { isActive: true } });
    seededSystemId = sys!.id;

    // Clean up test tickets
    await prisma.ticket.deleteMany({
      where: { ticketNumber: { startsWith: "TK-OPS-" } },
    });

    // Create primary test ticket in NEW state
    const t = await prisma.ticket.create({
      data: {
        ticketNumber: "TK-OPS-001",
        summary: "Operations test ticket for claiming and status transitions",
        description: "Testing staff ticket detail endpoints",
        categoryId: seededCategoryId,
        relatedSystemId: seededSystemId,
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        currentStatus: "NEW",
        requesterId: requesterUserId,
        primaryOwnerId: null,
      },
    });
    testTicketId = t.id;
  });

  afterAll(async () => {
    const prisma = getPrisma();
    await prisma.ticket.deleteMany({
      where: { ticketNumber: { startsWith: "TK-OPS-" } },
    });
    await prisma.user.deleteMany({
      where: { email: "inactive_staff_test@toktickit.local" },
    });
  });

  // -------------------------------------------------------------------------
  // STF-05: Claim Ticket or Reassign Owner (PATCH /api/staff/tickets/:id/owner)
  // -------------------------------------------------------------------------
  describe("STF-05: Claim Ticket or Reassign Owner (AC-13, BR-11)", () => {
    it("rejects unauthenticated requests with 401 Unauthorized", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/owner`)
        .send({ ownerId: staffUserId });
      expect(res.status).toBe(401);
    });

    it("rejects requester users with 403 Forbidden", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/owner`)
        .set("Cookie", requesterCookie)
        .send({ ownerId: staffUserId });
      expect(res.status).toBe(403);
    });

    it("rejects non-integer or invalid ticket IDs with 400 Bad Request", async () => {
      const res = await request(app)
        .patch("/api/staff/tickets/abc/owner")
        .set("Cookie", staffCookie)
        .send({ ownerId: staffUserId });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });

    it("returns 404 Not Found for non-existent ticket", async () => {
      const res = await request(app)
        .patch("/api/staff/tickets/999999/owner")
        .set("Cookie", staffCookie)
        .send({ ownerId: staffUserId });
      expect(res.status).toBe(404);
    });

    it("claims ticket for current staff member by setting ownerId", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/owner`)
        .set("Cookie", staffCookie)
        .send({ ownerId: staffUserId });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testTicketId);
      expect(res.body.primaryOwnerId).toBe(staffUserId);
      expect(res.body.primaryOwner).toBeDefined();
      expect(res.body.primaryOwner.id).toBe(staffUserId);
    });

    it("reassigns ticket to another active staff/admin user", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/owner`)
        .set("Cookie", staffCookie)
        .send({ ownerId: adminUserId });

      expect(res.status).toBe(200);
      expect(res.body.primaryOwnerId).toBe(adminUserId);
      expect(res.body.primaryOwner.id).toBe(adminUserId);
    });

    it("unassigns ticket when ownerId is null", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/owner`)
        .set("Cookie", staffCookie)
        .send({ ownerId: null });

      expect(res.status).toBe(200);
      expect(res.body.primaryOwnerId).toBeNull();
      expect(res.body.primaryOwner).toBeNull();
    });

    it("rejects assigning a requester as ticket owner with 400 Bad Request (BR-11)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/owner`)
        .set("Cookie", staffCookie)
        .send({ ownerId: requesterUserId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(res.body.error.message).toMatch(/requester/i);
    });

    it("rejects assigning an inactive user with 400 Bad Request (AC-13)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/owner`)
        .set("Cookie", staffCookie)
        .send({ ownerId: inactiveStaffUserId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(res.body.error.message).toMatch(/inactive/i);
    });

    it("rejects assigning a non-existent user with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/owner`)
        .set("Cookie", staffCookie)
        .send({ ownerId: 888888 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });
  });

  // -------------------------------------------------------------------------
  // STF-06: Operational IT Priority (PATCH /api/staff/tickets/:id/priority)
  // -------------------------------------------------------------------------
  describe("STF-06: Update Operational IT Priority (AC-14, BR-13)", () => {
    it("rejects unauthenticated requests with 401 Unauthorized", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/priority`)
        .send({ itPriority: "HIGH" });
      expect(res.status).toBe(401);
    });

    it("rejects requester users with 403 Forbidden", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/priority`)
        .set("Cookie", requesterCookie)
        .send({ itPriority: "HIGH" });
      expect(res.status).toBe(403);
    });

    it("successfully updates itPriority to HIGH without altering requestedPriority", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/priority`)
        .set("Cookie", staffCookie)
        .send({ itPriority: "HIGH" });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testTicketId);
      expect(res.body.itPriority).toBe("HIGH");

      // Verify DB persistence and requestedPriority integrity
      const prisma = getPrisma();
      const dbTicket = await prisma.ticket.findUnique({ where: { id: testTicketId } });
      expect(dbTicket?.itPriority).toBe("HIGH");
      expect(dbTicket?.requestedPriority).toBe("MEDIUM");
    });

    it("successfully updates itPriority to LOW", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/priority`)
        .set("Cookie", staffCookie)
        .send({ itPriority: "LOW" });

      expect(res.status).toBe(200);
      expect(res.body.itPriority).toBe("LOW");
    });

    it("rejects invalid priority values with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/priority`)
        .set("Cookie", staffCookie)
        .send({ itPriority: "URGENT" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });
  });

  // -------------------------------------------------------------------------
  // STF-07 & STF-08: Status Transition Matrix & Workflow (PATCH /api/staff/tickets/:id/status)
  // -------------------------------------------------------------------------
  describe("STF-07 & STF-08: Status Workflow Transitions (AC-15, BR-15)", () => {
    let flowTicketId: number;

    beforeAll(async () => {
      const prisma = getPrisma();
      const t = await prisma.ticket.create({
        data: {
          ticketNumber: "TK-OPS-FLOW",
          summary: "State machine lifecycle ticket",
          description: "Testing state machine transitions",
          categoryId: seededCategoryId,
          relatedSystemId: seededSystemId,
          requestedPriority: "LOW",
          itPriority: "LOW",
          currentStatus: "NEW",
          requesterId: requesterUserId,
        },
      });
      flowTicketId = t.id;
    });

    it("STF-08: rejects illegal transition NEW -> RESOLVED with 400 ILLEGAL_STATUS_TRANSITION", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${flowTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "RESOLVED" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("ILLEGAL_STATUS_TRANSITION");
      expect(res.body.error.message).toMatch(/Cannot transition status from NEW to RESOLVED directly/i);
    });

    it("STF-08: rejects illegal transition NEW -> CLOSED with 400 ILLEGAL_STATUS_TRANSITION", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${flowTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "CLOSED" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("ILLEGAL_STATUS_TRANSITION");
    });

    it("STF-07: advances NEW -> OPEN", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${flowTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "OPEN" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("OPEN");
    });

    it("STF-07: advances OPEN -> IN_PROGRESS", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${flowTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "IN_PROGRESS" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("IN_PROGRESS");
    });

    it("STF-07: advances IN_PROGRESS -> WAITING_FOR_REQUESTER", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${flowTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "WAITING_FOR_REQUESTER" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("WAITING_FOR_REQUESTER");
    });

    it("STF-07: advances WAITING_FOR_REQUESTER -> RESOLVED", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${flowTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "RESOLVED" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("RESOLVED");
    });

    it("STF-08: rejects illegal transition RESOLVED -> IN_PROGRESS directly", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${flowTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "IN_PROGRESS" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("ILLEGAL_STATUS_TRANSITION");
    });

    it("STF-07: advances RESOLVED -> CLOSED", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${flowTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "CLOSED" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("CLOSED");
    });

    it("STF-07: advances CLOSED -> REOPENED", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${flowTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "REOPENED" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("REOPENED");
    });

    it("STF-07: advances REOPENED -> CANCELLED", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${flowTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "CANCELLED" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("CANCELLED");
    });

    it("STF-07: advances CANCELLED -> REOPENED", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${flowTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "REOPENED" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("REOPENED");
    });

    it("STF-08: rejects requester attempting to execute status transition with 403", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${flowTicketId}/status`)
        .set("Cookie", requesterCookie)
        .send({ status: "RESOLVED" });

      expect(res.status).toBe(403);
    });

    it("STF-08: rejects invalid status string with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${flowTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "NON_EXISTENT_STATUS" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });
  });

  // -------------------------------------------------------------------------
  // Ticket Detail GET Enhancement
  // -------------------------------------------------------------------------
  describe("Ticket Detail GET includes primaryOwner", () => {
    it("returns primaryOwner object when ticket is owned", async () => {
      // Assign ticket to staff
      await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/owner`)
        .set("Cookie", staffCookie)
        .send({ ownerId: staffUserId });

      const res = await request(app)
        .get(`/api/tickets/${testTicketId}`)
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.primaryOwner).toBeDefined();
      expect(res.body.primaryOwner.id).toBe(staffUserId);
      expect(res.body.primaryOwner.fullName).toBeDefined();
      expect(res.body.primaryOwner.email).toBeDefined();
    });
  });
});
