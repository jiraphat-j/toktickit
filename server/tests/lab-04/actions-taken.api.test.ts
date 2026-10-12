import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { createSession } from "../../src/session.js";

describe("Lab 4 Actions Taken REST APIs (Issue #58 / ACT-01..04, ACT-SEC-01..03, ACT-REQ-01..02, SMOKE-02)", () => {
  const prisma = getPrisma();

  let requester1Cookie: string;
  let requester2Cookie: string;
  let staffCookie: string;
  let adminCookie: string;
  let inactiveStaffCookie: string;

  let requester1Id: number;
  let requester2Id: number;
  let staffId: number;
  let adminId: number;
  let inactiveStaffId: number;

  let testTicket1Id: number; // Owned by Requester 1
  let testTicket2Id: number; // Owned by Requester 2
  let testActionId: number;

  beforeAll(async () => {
    // 1. Fetch seeded users
    const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
    const reqUsers = users.filter((u) => u.role === "REQUESTER" && u.isActive);
    const stUsers = users.filter((u) => u.role === "IT_STAFF" && u.isActive);
    const admUser = users.find((u) => u.role === "ADMINISTRATOR" && u.isActive);
    const inactStaff = users.find((u) => u.role === "IT_STAFF" && !u.isActive);

    if (reqUsers.length < 2 || stUsers.length < 1 || !admUser) {
      throw new Error("Required seeded users not found. Please run seed first.");
    }

    requester1Id = reqUsers[0].id;
    requester2Id = reqUsers[1].id;
    staffId = stUsers[0].id;
    adminId = admUser.id;

    // Ensure mustChangePassword is false for test users
    await prisma.user.updateMany({
      where: { id: { in: [requester1Id, requester2Id, staffId, adminId] } },
      data: { mustChangePassword: false },
    });

    // Handle inactive staff
    if (inactStaff) {
      inactiveStaffId = inactStaff.id;
    } else {
      const createdInact = await prisma.user.create({
        data: {
          email: "temp_inactive_staff@toktickit.local",
          fullName: "Temp Inactive Staff",
          passwordHash: "hash",
          role: "IT_STAFF",
          isActive: false,
          mustChangePassword: false,
        },
      });
      inactiveStaffId = createdInact.id;
    }

    // Generate session cookies
    requester1Cookie = `toktickit_session=${createSession(requester1Id)}`;
    requester2Cookie = `toktickit_session=${createSession(requester2Id)}`;
    staffCookie = `toktickit_session=${createSession(staffId)}`;
    adminCookie = `toktickit_session=${createSession(adminId)}`;
    inactiveStaffCookie = `toktickit_session=${createSession(inactiveStaffId)}`;

    // 2. Fetch or create test tickets
    const cat = await prisma.category.findFirstOrThrow({ where: { isActive: true } });
    const sys = await prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } });

    // Ticket 1 for Requester 1
    const t1 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-TEST-${Date.now()}-1`,
        requesterId: requester1Id,
        primaryOwnerId: staffId,
        categoryId: cat.id,
        relatedSystemId: sys.id,
        summary: "Actions Taken Test Ticket 1 (Requester 1)",
        description: "Test ticket for actions taken test suite execution.",
        requestedPriority: "MEDIUM",
        itPriority: "HIGH",
        currentStatus: "IN_PROGRESS",
      },
    });
    testTicket1Id = t1.id;

    // Ticket 2 for Requester 2
    const t2 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-TEST-${Date.now()}-2`,
        requesterId: requester2Id,
        primaryOwnerId: staffId,
        categoryId: cat.id,
        relatedSystemId: sys.id,
        summary: "Actions Taken Test Ticket 2 (Requester 2)",
        description: "Second test ticket for cross-requester isolation.",
        requestedPriority: "LOW",
        itPriority: "LOW",
        currentStatus: "OPEN",
      },
    });
    testTicket2Id = t2.id;
  });

  afterAll(async () => {
    // Clean up created test tickets and their actions
    if (testTicket1Id) {
      await prisma.actionTaken.deleteMany({ where: { ticketId: testTicket1Id } });
      await prisma.ticket.delete({ where: { id: testTicket1Id } }).catch(() => {});
    }
    if (testTicket2Id) {
      await prisma.actionTaken.deleteMany({ where: { ticketId: testTicket2Id } });
      await prisma.ticket.delete({ where: { id: testTicket2Id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  // ---------------------------------------------------------------------------
  // ACT-01: Create Valid Action Taken
  // ---------------------------------------------------------------------------
  describe("ACT-01 (AC-01, BR-01, BR-06): Create Valid Action Taken", () => {
    it("creates an action under the ticket with performer auto-set to session user", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket1Id}/actions-taken`)
        .set("Cookie", staffCookie)
        .send({
          description: "Inspected network cable and replaced damaged RJ45 connector.",
          result: "Link negotiated at 1 Gbps duplex cleanly with zero packet loss.",
          followUpRequired: false,
          attachmentNotes: "photo_connector_replaced.jpg",
        });

      expect(res.status).toBe(201);
      const action = res.body.action || res.body;
      expect(action.id).toBeDefined();
      expect(action.ticketId).toBe(testTicket1Id);
      expect(action.performedById).toBe(staffId);
      expect(action.performedBy).toBeDefined();
      expect(action.performedBy.id).toBe(staffId);
      expect(action.followUpRequired).toBe(false);
      expect(action.followUpNote).toBeNull();
      expect(action.attachmentNotes).toBe("photo_connector_replaced.jpg");

      testActionId = action.id;
    });

    it("accepts custom valid actionDateTime when provided", async () => {
      const pastTime = new Date(Date.now() - 3600 * 1000).toISOString();
      const res = await request(app)
        .post(`/api/tickets/${testTicket1Id}/actions-taken`)
        .set("Cookie", staffCookie)
        .send({
          actionDateTime: pastTime,
          description: "Rebooted edge switch to clear corrupted routing table cache.",
          result: "Switch reboot completed in 90 seconds; routing resumed.",
          followUpRequired: false,
        });

      expect(res.status).toBe(201);
      const action = res.body.action || res.body;
      expect(new Date(action.actionDateTime).getTime()).toBe(new Date(pastTime).getTime());
    });

    it("returns 404 if ticketId does not exist", async () => {
      const res = await request(app)
        .post("/api/tickets/999999/actions-taken")
        .set("Cookie", staffCookie)
        .send({
          description: "Valid description for missing ticket",
          result: "Valid result",
          followUpRequired: false,
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  // ---------------------------------------------------------------------------
  // ACT-02: Description & Result Field Length Validations
  // ---------------------------------------------------------------------------
  describe("ACT-02 (AC-01, BR-04): Field Length Validations", () => {
    it("rejects description shorter than 5 characters with 400 VALIDATION_FAILED", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket1Id}/actions-taken`)
        .set("Cookie", staffCookie)
        .send({
          description: "Done", // 4 chars
          result: "Valid result text",
          followUpRequired: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_FAILED");
    });

    it("rejects description exceeding 2000 characters with 400 VALIDATION_FAILED", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket1Id}/actions-taken`)
        .set("Cookie", staffCookie)
        .send({
          description: "A".repeat(2001),
          result: "Valid result text",
          followUpRequired: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_FAILED");
    });

    it("rejects result shorter than 2 characters with 400 VALIDATION_FAILED", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket1Id}/actions-taken`)
        .set("Cookie", staffCookie)
        .send({
          description: "Valid description for testing",
          result: "X", // 1 char
          followUpRequired: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_FAILED");
    });

    it("rejects result exceeding 2000 characters with 400 VALIDATION_FAILED", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket1Id}/actions-taken`)
        .set("Cookie", staffCookie)
        .send({
          description: "Valid description for testing",
          result: "R".repeat(2001),
          followUpRequired: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_FAILED");
    });

    it("rejects future actionDateTime beyond 10 minutes clock drift", async () => {
      const futureTime = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
      const res = await request(app)
        .post(`/api/tickets/${testTicket1Id}/actions-taken`)
        .set("Cookie", staffCookie)
        .send({
          actionDateTime: futureTime,
          description: "Action allegedly performed in the distant future.",
          result: "Time traveler test.",
          followUpRequired: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });
  });

  // ---------------------------------------------------------------------------
  // ACT-03: Follow-Up Note Enforcement
  // ---------------------------------------------------------------------------
  describe("ACT-03 (AC-02, BR-07): Follow-Up Note Enforcement", () => {
    it("rejects followUpRequired=true without followUpNote with 400 FOLLOW_UP_NOTE_REQUIRED", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket1Id}/actions-taken`)
        .set("Cookie", staffCookie)
        .send({
          description: "Installed temporary wireless access point.",
          result: "Signal temporarily restored in room 301.",
          followUpRequired: true,
          // followUpNote omitted
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("FOLLOW_UP_NOTE_REQUIRED");
    });

    it("rejects followUpRequired=true with empty whitespace followUpNote", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket1Id}/actions-taken`)
        .set("Cookie", staffCookie)
        .send({
          description: "Installed temporary wireless access point.",
          result: "Signal temporarily restored in room 301.",
          followUpRequired: true,
          followUpNote: "    ",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("FOLLOW_UP_NOTE_REQUIRED");
    });

    it("accepts followUpRequired=true with valid followUpNote", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket1Id}/actions-taken`)
        .set("Cookie", staffCookie)
        .send({
          description: "Installed temporary wireless access point.",
          result: "Signal temporarily restored in room 301.",
          followUpRequired: true,
          followUpNote: "Mount permanent enterprise AP model C9120 when shipment arrives next Monday.",
        });

      expect(res.status).toBe(201);
      const action = res.body.action || res.body;
      expect(action.followUpRequired).toBe(true);
      expect(action.followUpNote).toBe(
        "Mount permanent enterprise AP model C9120 when shipment arrives next Monday."
      );
    });
  });

  // ---------------------------------------------------------------------------
  // ACT-04: Optimistic Concurrency Control on Update
  // ---------------------------------------------------------------------------
  describe("ACT-04 (AC-12, BR-19): Optimistic Concurrency Control", () => {
    it("updates action successfully when expectedUpdatedAt matches current record", async () => {
      const fetchRes = await request(app)
        .get(`/api/actions-taken/${testActionId}`)
        .set("Cookie", staffCookie);

      expect(fetchRes.status).toBe(200);
      const currentAction = fetchRes.body.action || fetchRes.body;

      const updateRes = await request(app)
        .patch(`/api/actions-taken/${testActionId}`)
        .set("Cookie", staffCookie)
        .send({
          expectedUpdatedAt: currentAction.updatedAt,
          description: "Updated description: replaced damaged RJ45 and re-certified cable.",
          result: "Certified Cat6 throughput with Fluke tester.",
        });

      expect(updateRes.status).toBe(200);
      const updated = updateRes.body.action || updateRes.body;
      expect(updated.description).toBe(
        "Updated description: replaced damaged RJ45 and re-certified cable."
      );
    });

    it("rejects stale update with 409 CONFLICT and returns currentUpdatedAt", async () => {
      const staleTimestamp = new Date(Date.now() - 3600 * 1000 * 48).toISOString();

      const res = await request(app)
        .patch(`/api/actions-taken/${testActionId}`)
        .set("Cookie", staffCookie)
        .send({
          expectedUpdatedAt: staleTimestamp,
          description: "Attempting stale overwrite from outdated browser tab.",
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CONFLICT");
      expect(res.body.error.currentUpdatedAt).toBeDefined();
    });

    it("also supports PUT /api/tickets/:ticketId/actions-taken/:id route", async () => {
      const res = await request(app)
        .put(`/api/tickets/${testTicket1Id}/actions-taken/${testActionId}`)
        .set("Cookie", adminCookie)
        .send({
          result: "Final inspection verified by Administrator.",
        });

      expect(res.status).toBe(200);
      const updated = res.body.action || res.body;
      expect(updated.result).toBe("Final inspection verified by Administrator.");
    });
  });

  // ---------------------------------------------------------------------------
  // ACT-SEC-01..03: Authorization & RBAC Enforcement
  // ---------------------------------------------------------------------------
  describe("ACT-SEC-01..03 (AC-03, AC-05, BR-09, BR-10): Authorization Security", () => {
    it("ACT-SEC-01: Requester cannot create Action Taken (403 Forbidden)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket1Id}/actions-taken`)
        .set("Cookie", requester1Cookie)
        .send({
          description: "Requester trying to inject an action log.",
          result: "Should be blocked by server-side RBAC.",
          followUpRequired: false,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("ACT-SEC-02: Requester cannot update Action Taken (403 Forbidden)", async () => {
      const res = await request(app)
        .patch(`/api/actions-taken/${testActionId}`)
        .set("Cookie", requester1Cookie)
        .send({
          description: "Requester trying to modify IT Staff work log.",
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("ACT-SEC-03: Deactivated IT Staff session is rejected (401 Unauthorized)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket1Id}/actions-taken`)
        .set("Cookie", inactiveStaffCookie)
        .send({
          description: "Deactivated staff trying to post action log.",
          result: "Should be rejected.",
          followUpRequired: false,
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("Unauthenticated request is rejected with 401 Unauthorized", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket1Id}/actions-taken`)
        .send({
          description: "Anonymous action log attempt.",
          result: "Should fail.",
          followUpRequired: false,
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  // ---------------------------------------------------------------------------
  // ACT-REQ-01..02: Requester View & Ownership Isolation
  // ---------------------------------------------------------------------------
  describe("ACT-REQ-01..02 (AC-04, BR-10): Requester View & Zero Leakage", () => {
    it("ACT-REQ-01: Requester can view actions on owned ticket (200 OK)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicket1Id}/actions-taken`)
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(200);
      const actions = res.body.actions || res.body;
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
      expect(actions[0].performedBy).toBeDefined();
    });

    it("ACT-REQ-02: Requester cannot view actions on unowned ticket (404 Not Found)", async () => {
      // Requester 2 attempts to view actions on Ticket 1 (owned by Requester 1)
      const res = await request(app)
        .get(`/api/tickets/${testTicket1Id}/actions-taken`)
        .set("Cookie", requester2Cookie);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("Single action retrieval respects ownership isolation for Requesters", async () => {
      // Requester 1 owns Ticket 1 -> 200 OK
      const res1 = await request(app)
        .get(`/api/actions-taken/${testActionId}`)
        .set("Cookie", requester1Cookie);
      expect(res1.status).toBe(200);

      // Requester 2 does NOT own Ticket 1 -> 404 Not Found
      const res2 = await request(app)
        .get(`/api/actions-taken/${testActionId}`)
        .set("Cookie", requester2Cookie);
      expect(res2.status).toBe(404);
    });
  });

  // ---------------------------------------------------------------------------
  // SMOKE-02: Performance Smoke Test
  // ---------------------------------------------------------------------------
  describe("SMOKE-02 (AC-01): Performance Smoke Test", () => {
    it("retrieves Actions Taken listing in < 150ms under operational load", async () => {
      const startTime = performance.now();
      const res = await request(app)
        .get(`/api/tickets/${testTicket1Id}/actions-taken`)
        .set("Cookie", staffCookie);
      const durationMs = performance.now() - startTime;

      expect(res.status).toBe(200);
      expect(durationMs).toBeLessThan(150);
    });
  });
});
