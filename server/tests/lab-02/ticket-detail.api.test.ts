import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Ticket Detail API (Issue 8 / API-10)", () => {
  const prisma = getPrisma();
  const requester1Id = "1"; // Somchai Jaidee
  const requester2Id = "2"; // Suda Sukjai
  const inactiveRequesterId = "5"; // Prasert Kerdphol (inactive)

  let ticket1Id: number;
  let ticket2Id: number;
  let activeAttachmentId: number;
  let removedAttachmentId: number;

  beforeAll(async () => {
    // Clean any prior attachments / tickets for clean test run
    const ticket1 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-${Date.now().toString().slice(-6)}1`,
        requesterId: 1,
        categoryId: 1, // Hardware
        relatedSystemId: 1, // Laptop
        summary: "Display panel malfunctioning on docking station",
        description: "Whenever docked with USB-C, the secondary display flickers and disconnects completely.",
        requestedPriority: "HIGH",
        currentStatus: "NEW",
      },
    });
    ticket1Id = ticket1.id;

    // Attachments on ticket 1: one active, one soft-removed
    const activeAtt = await prisma.attachment.create({
      data: {
        ticketId: ticket1.id,
        originalFileName: "dock_setup.png",
        storedFileName: `test-active-${Date.now()}.png`,
        mimeType: "image/png",
        sizeBytes: 154200,
        isRemoved: false,
      },
    });
    activeAttachmentId = activeAtt.id;

    const removedAtt = await prisma.attachment.create({
      data: {
        ticketId: ticket1.id,
        originalFileName: "old_driver.log",
        storedFileName: `test-removed-${Date.now()}.log`,
        mimeType: "application/pdf",
        sizeBytes: 52000,
        isRemoved: true,
        removedAt: new Date(),
        removedReason: "Outdated diagnostic log replaced by newer dump.",
      },
    });
    removedAttachmentId = removedAtt.id;

    // Ticket 2 owned by Requester 2
    const ticket2 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-${Date.now().toString().slice(-6)}2`,
        requesterId: 2,
        categoryId: 2, // Software
        relatedSystemId: 7, // VPN
        summary: "VPN credential expired error",
        description: "Cannot authenticate to corporate VPN from remote home network.",
        requestedPriority: "MEDIUM",
        currentStatus: "NEW",
      },
    });
    ticket2Id = ticket2.id;
  });

  // ---------------------------------------------------------------------------
  // API-10: Owned Ticket Detail (AC-21)
  // ---------------------------------------------------------------------------
  describe("API-10: Owned Ticket Detail", () => {
    it("AC-21: returns 200 with complete read-only ticket details and attachments", async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticket1Id}`)
        .set("X-Dev-Requester-Id", requester1Id);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(ticket1Id);
      expect(res.body.summary).toBe("Display panel malfunctioning on docking station");
      expect(res.body.description).toContain("USB-C");
      expect(res.body.requestedPriority).toBe("HIGH");
      expect(res.body.currentStatus).toBe("NEW");

      // Requester relationship (read-only)
      expect(res.body.requester).toBeDefined();
      expect(res.body.requester.id).toBe(1);
      expect(res.body.requester.fullName).toBe("Somchai Jaidee");
      expect(res.body.requester.email).toBe("somchai.j@kmutt.ac.th");

      // Category and Related System
      expect(res.body.category).toBeDefined();
      expect(res.body.category.id).toBe(1);
      expect(res.body.relatedSystem).toBeDefined();
      expect(res.body.relatedSystem.id).toBe(1);

      // Attachments list
      expect(res.body.attachments).toBeDefined();
      expect(res.body.attachments.length).toBe(2);

      const active = res.body.attachments.find((a: any) => a.id === activeAttachmentId);
      expect(active).toBeDefined();
      expect(active.originalFileName).toBe("dock_setup.png");
      expect(active.isRemoved).toBe(false);
      expect(active.removedReason).toBeNull();

      const removed = res.body.attachments.find((a: any) => a.id === removedAttachmentId);
      expect(removed).toBeDefined();
      expect(removed.originalFileName).toBe("old_driver.log");
      expect(removed.isRemoved).toBe(true);
      expect(removed.removedReason).toBe("Outdated diagnostic log replaced by newer dump.");
      expect(removed.removedAt).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // API-10: Ownership Isolation (AC-22, BR-23)
  // ---------------------------------------------------------------------------
  describe("API-10: Ownership Isolation", () => {
    it("AC-22: returns 404 Not Found when requester attempts to access another requester's ticket", async () => {
      // Requester 1 attempts to access Ticket 2 (owned by Requester 2)
      const res1 = await request(app)
        .get(`/api/tickets/${ticket2Id}`)
        .set("X-Dev-Requester-Id", requester1Id);

      expect(res1.status).toBe(404);
      expect(res1.body.error).toBeDefined();
      expect(res1.body.error.code).toBe("NOT_FOUND");
      expect(res1.body.error.message).toContain("not found or access denied");

      // Requester 2 attempts to access Ticket 1 (owned by Requester 1)
      const res2 = await request(app)
        .get(`/api/tickets/${ticket1Id}`)
        .set("X-Dev-Requester-Id", requester2Id);

      expect(res2.status).toBe(404);
      expect(res2.body.error.code).toBe("NOT_FOUND");
    });

    it("returns 404 Not Found for nonexistent ticket ID", async () => {
      const res = await request(app)
        .get("/api/tickets/999999")
        .set("X-Dev-Requester-Id", requester1Id);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  // ---------------------------------------------------------------------------
  // API-10: Validation & Context Errors (AC-27, AC-33)
  // ---------------------------------------------------------------------------
  describe("API-10: Parameter & Header Validation", () => {
    it("AC-33: rejects non-numeric or non-positive ticket ID with 400", async () => {
      const resText = await request(app)
        .get("/api/tickets/not-a-number")
        .set("X-Dev-Requester-Id", requester1Id);

      expect(resText.status).toBe(400);
      expect(resText.body.error.code).toBe("BAD_REQUEST");

      const resZero = await request(app)
        .get("/api/tickets/0")
        .set("X-Dev-Requester-Id", requester1Id);

      expect(resZero.status).toBe(400);
      expect(resZero.body.error.code).toBe("BAD_REQUEST");

      const resNeg = await request(app)
        .get("/api/tickets/-5")
        .set("X-Dev-Requester-Id", requester1Id);

      expect(resNeg.status).toBe(400);
      expect(resNeg.body.error.code).toBe("BAD_REQUEST");
    });

    it("AC-27: rejects request without X-Dev-Requester-Id header with 400", async () => {
      const res = await request(app).get(`/api/tickets/${ticket1Id}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });

    it("AC-27: rejects request with inactive requester ID with 400", async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticket1Id}`)
        .set("X-Dev-Requester-Id", inactiveRequesterId);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });
  });
});
