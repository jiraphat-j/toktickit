import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Create Ticket API (Issue 3)", () => {
  const validRequesterId = "1"; // Somchai Jaidee

  // API-04 (AC-01, BR-01, BR-02, BR-07, BR-30): Valid Ticket Creation
  it("API-04: POST /api/tickets creates a valid ticket with official Ticket Number and status NEW", async () => {
    const payload = {
      categoryId: 2, // Hardware
      relatedSystemId: 2, // Corporate Laptop
      summary: "Laptop screen flickers when connecting external monitor",
      description: "The display blinks black every 10 seconds whenever an HDMI cable is plugged into the external Dell display.",
      requestedPriority: "HIGH",
      // Prohibited fields in body should be ignored/overridden by server
      requesterId: 999,
      ticketNumber: "FAKE-123",
      currentStatus: "RESOLVED",
    };

    const res = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", validRequesterId)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("ticketNumber");

    // BR-01: Format TKT-YYYY-XXXXXX
    const currentYear = new Date().getFullYear();
    expect(res.body.ticketNumber).toMatch(new RegExp(`^TKT-${currentYear}-\\d{6}$`));

    // BR-02: Status NEW
    expect(res.body.currentStatus).toBe("NEW");

    // BR-30: Requester ID bound from header (not body)
    expect(res.body.requesterId).toBe(1);
    expect(res.body.summary).toBe(payload.summary);
    expect(res.body.description).toBe(payload.description);
    expect(res.body.requestedPriority).toBe("HIGH");
    expect(res.body.category).toHaveProperty("name", "Hardware");
    expect(res.body.relatedSystem).toHaveProperty("name", "Corporate Laptop");
    expect(res.body).toHaveProperty("createdAt");
  });

  // API-05 (AC-02, AC-03): Input Validation and Boundaries
  it("API-05: rejects submission with missing or invalid summary (<5 or >150 chars)", async () => {
    // Missing summary
    const resMissing = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", validRequesterId)
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: "",
        description: "Valid description longer than ten characters",
        requestedPriority: "LOW",
      });
    expect(resMissing.status).toBe(400);
    expect(resMissing.body.error.code).toBe("BAD_REQUEST");

    // Short summary (< 5 chars)
    const resShort = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", validRequesterId)
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Abc",
        description: "Valid description longer than ten characters",
        requestedPriority: "LOW",
      });
    expect(resShort.status).toBe(400);

    // Too long summary (> 150 chars)
    const resLong = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", validRequesterId)
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: "A".repeat(151),
        description: "Valid description longer than ten characters",
        requestedPriority: "LOW",
      });
    expect(resLong.status).toBe(400);
  });

  it("API-05: rejects submission with invalid description (<10 or >2000 chars or whitespace-only)", async () => {
    // Whitespace only
    const resWhitespace = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", validRequesterId)
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Valid summary",
        description: "             ",
        requestedPriority: "MEDIUM",
      });
    expect(resWhitespace.status).toBe(400);

    // Too long description (> 2000 chars)
    const resTooLong = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", validRequesterId)
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Valid summary",
        description: "A".repeat(2001),
        requestedPriority: "MEDIUM",
      });
    expect(resTooLong.status).toBe(400);
  });

  it("API-05: rejects submission with non-existent or inactive category/system IDs or invalid priority", async () => {
    // Non-existent category
    const resCat = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", validRequesterId)
      .send({
        categoryId: 9999,
        relatedSystemId: 1,
        summary: "Valid summary",
        description: "Valid description longer than ten characters",
        requestedPriority: "MEDIUM",
      });
    expect(resCat.status).toBe(400);

    // Invalid priority enum
    const resPrio = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", validRequesterId)
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Valid summary",
        description: "Valid description longer than ten characters",
        requestedPriority: "URGENT_CRITICAL",
      });
    expect(resPrio.status).toBe(400);
  });

  // API-06 (AC-05, BR-14, AC-36): Idempotency & Concurrency
  it("API-06: duplicate request with same Idempotency-Key returns existing ticket without duplicating", async () => {
    const idempotencyKey = "d290f1ee-6c54-4b01-90e6-d701748f0851";
    const payload = {
      categoryId: 1,
      relatedSystemId: 3, // Email
      summary: "Cannot receive verification emails",
      description: "Emails from external partner domain are blocked or bounced back.",
      requestedPriority: "MEDIUM",
    };

    // First request
    const res1 = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", validRequesterId)
      .set("Idempotency-Key", idempotencyKey)
      .send(payload);
    expect(res1.status).toBe(201);
    const originalTicketNumber = res1.body.ticketNumber;

    // Repeated identical request
    const res2 = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", validRequesterId)
      .set("Idempotency-Key", idempotencyKey)
      .send(payload);
    expect(res2.status).toBe(201);
    expect(res2.body.ticketNumber).toBe(originalTicketNumber);
    expect(res2.body.id).toBe(res1.body.id);
  });

  it("API-06: reusing Idempotency-Key with different payload returns 409 Conflict", async () => {
    const idempotencyKey = "a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab";
    const payload1 = {
      categoryId: 1,
      relatedSystemId: 1,
      summary: "First request summary",
      description: "First request description longer than ten characters",
      requestedPriority: "LOW",
    };

    const res1 = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", validRequesterId)
      .set("Idempotency-Key", idempotencyKey)
      .send(payload1);
    expect(res1.status).toBe(201);

    // Second request with altered payload
    const payload2 = {
      categoryId: 1,
      relatedSystemId: 1,
      summary: "Altered request summary",
      description: "Different payload sent with the same idempotency key",
      requestedPriority: "HIGH",
    };

    const res2 = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", validRequesterId)
      .set("Idempotency-Key", idempotencyKey)
      .send(payload2);
    expect(res2.status).toBe(409);
    expect(res2.body.error.code).toBe("CONFLICT");
  });

  it("API-06 (AC-36): concurrent ticket creations generate distinct unique ticket numbers", async () => {
    const createReq = (index: number) =>
      request(app)
        .post("/api/tickets")
        .set("X-Dev-Requester-Id", validRequesterId)
        .send({
          categoryId: 3, // Software
          relatedSystemId: 5, // LEB2 App
          summary: `Concurrent ticket submission test ${index}`,
          description: `Description testing uniqueness of sequential ticket numbers ${index}`,
          requestedPriority: "LOW",
        });

    const [resA, resB] = await Promise.all([createReq(1), createReq(2)]);
    expect(resA.status).toBe(201);
    expect(resB.status).toBe(201);
    expect(resA.body.ticketNumber).not.toBe(resB.body.ticketNumber);
  });
});
