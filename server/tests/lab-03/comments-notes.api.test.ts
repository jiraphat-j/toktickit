import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { createSession } from "../../src/session.js";

describe("Lab 3 Comments and Internal Notes API Tests (COM-01..03, AC-09..11, BR-16..18, SEC-04)", () => {
  let requesterCookie: string;
  let otherRequesterCookie: string;
  let staffCookie: string;
  let adminCookie: string;
  let requesterUserId: number;
  let otherRequesterUserId: number;
  let staffUserId: number;
  let adminUserId: number;
  let seededCategoryId: number;
  let seededSystemId: number;
  let testTicketId: number;

  beforeAll(async () => {
    const prisma = getPrisma();

    // Fetch users
    const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
    const reqUsers = users.filter((u) => u.role === "REQUESTER" && u.isActive);
    const stUser = users.find((u) => u.role === "IT_STAFF" && u.isActive);
    const admUser = users.find((u) => u.role === "ADMINISTRATOR" && u.isActive);

    if (reqUsers.length < 1 || !stUser || !admUser) {
      throw new Error("Required seeded users not found.");
    }

    const reqUser = reqUsers[0];
    requesterUserId = reqUser.id;
    staffUserId = stUser.id;
    adminUserId = admUser.id;

    // Ensure a second requester exists for cross-requester isolation test
    let otherReq = reqUsers[1];
    if (!otherReq) {
      otherReq = await prisma.user.upsert({
        where: { email: "other_req_comments_test@toktickit.local" },
        update: { role: "REQUESTER", isActive: true },
        create: {
          email: "other_req_comments_test@toktickit.local",
          fullName: "Other Requester",
          passwordHash: "hash",
          role: "REQUESTER",
          isActive: true,
          mustChangePassword: false,
        },
      });
    }
    otherRequesterUserId = otherReq.id;

    await prisma.user.updateMany({
      where: { id: { in: [reqUser.id, otherReq.id, stUser.id, admUser.id] } },
      data: { mustChangePassword: false },
    });

    requesterCookie = `toktickit_session=${createSession(reqUser.id)}`;
    otherRequesterCookie = `toktickit_session=${createSession(otherReq.id)}`;
    staffCookie = `toktickit_session=${createSession(stUser.id)}`;
    adminCookie = `toktickit_session=${createSession(admUser.id)}`;

    const cat = await prisma.category.findFirst({ where: { isActive: true } });
    seededCategoryId = cat!.id;

    const sys = await prisma.relatedSystem.findFirst({ where: { isActive: true } });
    seededSystemId = sys!.id;

    // Clean up previous test tickets
    await prisma.ticket.deleteMany({
      where: { ticketNumber: { startsWith: "TK-COMM-" } },
    });

    // Create test ticket owned by primary requester
    const t = await prisma.ticket.create({
      data: {
        ticketNumber: "TK-COMM-001",
        summary: "Communication ticket for comments and notes",
        description: "Testing public comments and internal notes threads",
        categoryId: seededCategoryId,
        relatedSystemId: seededSystemId,
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        currentStatus: "OPEN",
        requesterId: requesterUserId,
      },
    });
    testTicketId = t.id;
  });

  afterAll(async () => {
    const prisma = getPrisma();
    await prisma.ticket.deleteMany({
      where: { ticketNumber: { startsWith: "TK-COMM-" } },
    });
    await prisma.user.deleteMany({
      where: { email: "other_req_comments_test@toktickit.local" },
    });
  });

  // -------------------------------------------------------------------------
  // COM-01: Public Comments (GET & POST /api/tickets/:id/comments)
  // -------------------------------------------------------------------------
  describe("COM-01: Public Comments Retrieval & Creation (AC-09, BR-16)", () => {
    it("returns empty comments list initially", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicketId}/comments`)
        .set("Cookie", requesterCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it("allows owning requester to post public comment", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/comments`)
        .set("Cookie", requesterCookie)
        .send({ content: "Requester initial follow-up comment." });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.ticketId).toBe(testTicketId);
      expect(res.body.content).toBe("Requester initial follow-up comment.");
      expect(res.body.author.id).toBe(requesterUserId);
      expect(res.body.author.role).toBe("REQUESTER");
    });

    it("allows IT staff to post public comment", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/comments`)
        .set("Cookie", staffCookie)
        .send({ content: "Staff response: We are looking into this." });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe("Staff response: We are looking into this.");
      expect(res.body.author.id).toBe(staffUserId);
      expect(res.body.author.role).toBe("IT_STAFF");
    });

    it("returns public comments in chronological order to both requester and staff", async () => {
      const reqRes = await request(app)
        .get(`/api/tickets/${testTicketId}/comments`)
        .set("Cookie", requesterCookie);

      expect(reqRes.status).toBe(200);
      expect(reqRes.body.length).toBe(2);
      expect(reqRes.body[0].content).toBe("Requester initial follow-up comment.");
      expect(reqRes.body[1].content).toBe("Staff response: We are looking into this.");

      const staffRes = await request(app)
        .get(`/api/tickets/${testTicketId}/comments`)
        .set("Cookie", staffCookie);

      expect(staffRes.status).toBe(200);
      expect(staffRes.body.length).toBe(2);
    });

    it("blocks non-owning requester from reading comments (404 Not Found, SEC-02)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicketId}/comments`)
        .set("Cookie", otherRequesterCookie);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("blocks non-owning requester from posting comments (404 Not Found, SEC-02)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/comments`)
        .set("Cookie", otherRequesterCookie)
        .send({ content: "Malicious requester trying to comment." });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  // -------------------------------------------------------------------------
  // COM-02: Internal Notes (GET & POST /api/tickets/:id/internal-notes)
  // -------------------------------------------------------------------------
  describe("COM-02: Internal Notes Private Thread (AC-10, AC-11, SEC-04, BR-16, BR-18)", () => {
    it("blocks requester from viewing internal notes with 403 Forbidden (SEC-04)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicketId}/internal-notes`)
        .set("Cookie", requesterCookie);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
      expect(res.body.error.message).toMatch(/not permitted/i);
    });

    it("blocks requester from posting internal notes with 403 Forbidden (SEC-04)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/internal-notes`)
        .set("Cookie", requesterCookie)
        .send({ content: "Requester attempting to write internal note." });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("allows IT staff to post internal note (AC-10, BR-16)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/internal-notes`)
        .set("Cookie", staffCookie)
        .send({ content: "Internal Note: User has 3 previous tickets on this switch." });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.ticketId).toBe(testTicketId);
      expect(res.body.content).toBe("Internal Note: User has 3 previous tickets on this switch.");
      expect(res.body.author.id).toBe(staffUserId);
      expect(res.body.author.role).toBe("IT_STAFF");
    });

    it("allows Administrator to post internal note", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/internal-notes`)
        .set("Cookie", adminCookie)
        .send({ content: "Admin Note: Escalated to network infrastructure team." });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe("Admin Note: Escalated to network infrastructure team.");
      expect(res.body.author.id).toBe(adminUserId);
      expect(res.body.author.role).toBe("ADMINISTRATOR");
    });

    it("allows staff to retrieve internal notes in chronological order", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicketId}/internal-notes`)
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0].content).toBe("Internal Note: User has 3 previous tickets on this switch.");
      expect(res.body[1].content).toBe("Admin Note: Escalated to network infrastructure team.");
    });
  });

  // -------------------------------------------------------------------------
  // COM-03: Length & Whitespace Validation (1–2000 characters)
  // -------------------------------------------------------------------------
  describe("COM-03: Comment & Note Content Validation (AC-09, AC-10, BR-17)", () => {
    it("rejects empty string comment with 400 Bad Request", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/comments`)
        .set("Cookie", staffCookie)
        .send({ content: "" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });

    it("rejects whitespace-only comment with 400 Bad Request", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/comments`)
        .set("Cookie", staffCookie)
        .send({ content: "    \n\t   " });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });

    it("rejects comment exceeding 2000 characters with 400 Bad Request", async () => {
      const longText = "A".repeat(2001);
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/comments`)
        .set("Cookie", staffCookie)
        .send({ content: longText });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(res.body.error.message).toMatch(/2000 characters/i);
    });

    it("accepts comment of exactly 2000 characters", async () => {
      const maxText = "B".repeat(2000);
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/comments`)
        .set("Cookie", staffCookie)
        .send({ content: maxText });

      expect(res.status).toBe(201);
      expect(res.body.content.length).toBe(2000);
    });

    it("rejects empty string internal note with 400 Bad Request", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/internal-notes`)
        .set("Cookie", staffCookie)
        .send({ content: "   " });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });

    it("rejects internal note exceeding 2000 characters with 400 Bad Request", async () => {
      const longText = "C".repeat(2001);
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/internal-notes`)
        .set("Cookie", staffCookie)
        .send({ content: longText });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });
  });
});
