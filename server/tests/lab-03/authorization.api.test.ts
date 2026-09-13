import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { createSession } from "../../src/session.js";

describe("Lab 3 Authorization and Requester Regression (Issue #36)", () => {
  let requester1: { id: number; email: string };
  let requester2: { id: number; email: string };
  let staffUser: { id: number; email: string };
  let adminUser: { id: number; email: string };

  let requester1Cookie: string;
  let requester2Cookie: string;
  let staffCookie: string;
  let adminCookie: string;

  let validCategoryId: number;
  let validSystemId: number;

  beforeAll(async () => {
    const prisma = getPrisma();

    // Ensure users exist from seed (pick Requesters 1 and 2 to avoid collision with Requesters 3 and 4 in my-tickets tests)
    const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
    const r1 = users.find((u) => u.id === 1 && u.role === "REQUESTER" && u.isActive);
    const r2 = users.find((u) => u.id === 2 && u.role === "REQUESTER" && u.isActive);
    const st = users.find((u) => u.role === "IT_STAFF" && u.isActive);
    const ad = users.find((u) => u.role === "ADMINISTRATOR" && u.isActive);

    if (!r1 || !r2 || !st || !ad) {
      throw new Error("Seeded users for testing not found. Please run prisma db seed.");
    }

    requester1 = { id: r1.id, email: r1.email };
    requester2 = { id: r2.id, email: r2.email };
    staffUser = { id: st.id, email: st.email };
    adminUser = { id: ad.id, email: ad.email };

    // Clear mustChangePassword on test users to allow accessing protected routes
    await prisma.user.updateMany({
      where: { id: { in: [r1.id, r2.id, st.id, ad.id] } },
      data: { mustChangePassword: false },
    });

    // Create valid sessions
    const r1Token = createSession(r1.id);
    const r2Token = createSession(r2.id);
    const stToken = createSession(st.id);
    const adToken = createSession(ad.id);

    requester1Cookie = `toktickit_session=${r1Token}`;
    requester2Cookie = `toktickit_session=${r2Token}`;
    staffCookie = `toktickit_session=${stToken}`;
    adminCookie = `toktickit_session=${adToken}`;

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const system = await prisma.relatedSystem.findFirst({ where: { isActive: true } });
    validCategoryId = category!.id;
    validSystemId = system!.id;
  });

  // SEC-01 (AC-05, BR-07): Role-based endpoint authorization matrix
  describe("SEC-01: Role-based endpoint authorization matrix", () => {
    it("Requesters forbidden from staff routes (GET /api/staff/tickets) with 403", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("Requesters forbidden from admin routes (GET /api/admin/users) with 403", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("IT Staff forbidden from admin routes (GET /api/admin/users) with 403", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("IT Staff allowed to access staff routes (GET /api/staff/tickets) with 200", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("items");
    });

    it("Administrator allowed to access admin routes (GET /api/admin/users) with 200", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("items");
    });
  });

  // REQ-01 & SEC-03 (AC-06, BR-09, BR-24): Requester creates ticket & ignores forged requesterId in body
  describe("REQ-01 & SEC-03: Authenticated ticket creation and identity binding", () => {
    it("creates ticket bound strictly to authenticated session, ignoring forged requesterId in body", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .set("Cookie", requester1Cookie)
        .send({
          categoryId: validCategoryId,
          relatedSystemId: validSystemId,
          summary: "Campus Wi-Fi disconnects repeatedly in Building 3",
          description: "Wi-Fi connection drops every 5 minutes when attending lectures on the 4th floor.",
          requestedPriority: "HIGH",
          // Attempted client forged fields must be ignored/overridden
          requesterId: requester2.id,
          itPriority: "LOW",
          currentStatus: "RESOLVED",
          ticketNumber: "FORGED-999",
        });

      expect(res.status).toBe(201);
      expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
      expect(res.body.requesterId).toBe(requester1.id); // Bound to session user, NOT requester2
      expect(res.body.currentStatus).toBe("NEW");
      expect(res.body.itPriority).toBe("HIGH"); // Cloned from requestedPriority (BR-13)
      expect(res.body.problemAppearsResolved).toBe(false);
    });

    it("uploads attachment to owned ticket successfully under authenticated session", async () => {
      // First create a ticket for Requester 1
      const ticketRes = await request(app)
        .post("/api/tickets")
        .set("Cookie", requester1Cookie)
        .send({
          categoryId: validCategoryId,
          relatedSystemId: validSystemId,
          summary: "Need attachment upload test ticket",
          description: "Testing valid attachment upload under real session.",
          requestedPriority: "MEDIUM",
        });

      const ticketId = ticketRes.body.id;

      const uploadRes = await request(app)
        .post(`/api/tickets/${ticketId}/attachments`)
        .set("Cookie", requester1Cookie)
        .attach("file", Buffer.from("dummy log content"), "screenshot.png");

      expect(uploadRes.status).toBe(201);
      expect(uploadRes.body).toHaveProperty("id");
      expect(uploadRes.body.ticketId).toBe(ticketId);
      expect(uploadRes.body.originalFileName).toBe("screenshot.png");
    });
  });

  // SEC-02 (AC-07, BR-09): Requester ticket ownership isolation (404 Not Found)
  describe("SEC-02: Requester ticket ownership isolation", () => {
    let ticketOwnedByR1: number;

    beforeAll(async () => {
      const res = await request(app)
        .post("/api/tickets")
        .set("Cookie", requester1Cookie)
        .send({
          categoryId: validCategoryId,
          relatedSystemId: validSystemId,
          summary: "Confidential research ticket owned by Requester 1",
          description: "Requester 2 must receive 404 when trying to view or access this ticket.",
          requestedPriority: "LOW",
        });
      ticketOwnedByR1 = res.body.id;
    });

    it("Requester 2 accessing Requester 1's ticket (GET /api/tickets/:id) returns 404 Not Found", async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticketOwnedByR1}`)
        .set("Cookie", requester2Cookie);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("Requester 2 attempting resolve indication on Requester 1's ticket returns 404 Not Found", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketOwnedByR1}/resolve-indication`)
        .set("Cookie", requester2Cookie)
        .send({ resolved: true });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("Requester 2 attempting attachment upload on Requester 1's ticket returns 404 Not Found", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketOwnedByR1}/attachments`)
        .set("Cookie", requester2Cookie)
        .attach("file", Buffer.from("sneaky file"), "exploit.png");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("Requester 1 (owner) accessing own ticket (GET /api/tickets/:id) returns 200 OK", async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticketOwnedByR1}`)
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(ticketOwnedByR1);
      expect(res.body.summary).toBe("Confidential research ticket owned by Requester 1");
    });

    it("IT Staff can inspect any ticket (GET /api/tickets/:id) with 200 OK", async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticketOwnedByR1}`)
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(ticketOwnedByR1);
    });
  });

  // SEC-04 (AC-11, BR-18): Requester direct access to internal notes returns 403
  describe("SEC-04: Internal notes confidentiality boundary", () => {
    it("Requester direct access to GET /api/tickets/:id/internal-notes returns 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/tickets/1/internal-notes")
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("IT Staff access to GET /api/tickets/:id/internal-notes returns 200 OK", async () => {
      const res = await request(app)
        .get("/api/tickets/1/internal-notes")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
    });
  });

  // REQ-02 (AC-07, BR-09): Requester lists own tickets
  describe("REQ-02: Requester ticket list isolation", () => {
    it("GET /api/tickets returns only tickets belonging to authenticated requester", async () => {
      const res1 = await request(app)
        .get("/api/tickets")
        .set("Cookie", requester1Cookie);

      expect(res1.status).toBe(200);
      expect(Array.isArray(res1.body.items)).toBe(true);
      for (const item of res1.body.items) {
        const ticket = await getPrisma().ticket.findUnique({ where: { id: item.id } });
        expect(ticket?.requesterId).toBe(requester1.id);
      }
    });
  });

  // REQ-03 (AC-08, BR-10): Problem Appears Resolved toggle
  describe("REQ-03: Requester Problem Appears Resolved toggle", () => {
    it("Requester marks problem as resolved without altering ticket currentStatus", async () => {
      const ticketRes = await request(app)
        .post("/api/tickets")
        .set("Cookie", requester1Cookie)
        .send({
          categoryId: validCategoryId,
          relatedSystemId: validSystemId,
          summary: "Ticket to test problem resolved indicator",
          description: "Requester will mark this resolved.",
          requestedPriority: "LOW",
        });

      const ticketId = ticketRes.body.id;
      expect(ticketRes.body.problemAppearsResolved).toBe(false);
      expect(ticketRes.body.currentStatus).toBe("NEW");

      // Mark resolved = true
      const resolveRes = await request(app)
        .post(`/api/tickets/${ticketId}/resolve-indication`)
        .set("Cookie", requester1Cookie)
        .send({ resolved: true });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.id).toBe(ticketId);
      expect(resolveRes.body.problemAppearsResolved).toBe(true);

      // Verify in DB that status remains NEW (BR-10)
      const detailRes = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set("Cookie", requester1Cookie);

      expect(detailRes.body.problemAppearsResolved).toBe(true);
      expect(detailRes.body.currentStatus).toBe("NEW"); // Still NEW, waiting for IT Staff
    });
  });

  // REQ-04 (AC-08, BR-10): Requester direct status modification prohibited
  describe("REQ-04: Requester forbidden from directly modifying ticket status", () => {
    it("Requester attempting direct PATCH /api/staff/tickets/:id/status returns 403 Forbidden", async () => {
      const res = await request(app)
        .patch("/api/staff/tickets/1/status")
        .set("Cookie", requester1Cookie)
        .send({ status: "RESOLVED" });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });
});
