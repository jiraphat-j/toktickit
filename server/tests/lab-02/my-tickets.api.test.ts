import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("My Tickets API (Issue 7)", () => {
  // Use requesters 3 and 4 to avoid collision with tests using requesters 1 and 2
  const requesterA = "3"; // Jennifer Anderson
  const requesterB = "4"; // Michael Brown

  beforeAll(async () => {
    const prisma = getPrisma();

    // Clean up only test tickets belonging to requesters 3 and 4
    await prisma.attachment.deleteMany({
      where: { ticket: { requesterId: { in: [3, 4] } } },
    });
    await prisma.ticketCreationRequest.deleteMany({
      where: { ticket: { requesterId: { in: [3, 4] } } },
    });
    await prisma.ticket.deleteMany({
      where: { requesterId: { in: [3, 4] } },
    });

    // Create 10 tickets for Requester A (id: 3)
    // 6 in Category 1 (Hardware), 4 in Category 2 (Software)
    for (let i = 1; i <= 10; i++) {
      await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-2026-900${String(i).padStart(3, "0")}`,
          requesterId: 3,
          categoryId: i <= 6 ? 1 : 2,
          relatedSystemId: 1,
          summary: i % 2 === 0 ? `Network Wi-Fi drop incident #${i}` : `Screen monitor flickering #${i}`,
          description: `Detailed description for test ticket #${i} with more than ten chars`,
          requestedPriority: i <= 3 ? "LOW" : i <= 7 ? "MEDIUM" : "HIGH",
          currentStatus: "NEW",
          createdAt: new Date(2026, 0, i, 10, 0, 0),
          updatedAt: new Date(2026, 0, i, 12, 0, 0),
        },
      });
    }

    // Create 3 tickets for Requester B (id: 4)
    for (let i = 11; i <= 13; i++) {
      await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-2026-900${String(i).padStart(3, "0")}`,
          requesterId: 4,
          categoryId: 1,
          relatedSystemId: 2,
          summary: `Requester B printer paper jam #${i}`,
          description: `Detailed description for requester B ticket #${i}`,
          requestedPriority: "MEDIUM",
          currentStatus: "NEW",
          createdAt: new Date(2026, 0, i, 10, 0, 0),
          updatedAt: new Date(2026, 0, i, 12, 0, 0),
        },
      });
    }
  });

  // ---------------------------------------------------------------------------
  // API-07: Search, Filter, Sort, and Pagination (AC-16, AC-17, AC-18)
  // ---------------------------------------------------------------------------
  describe("API-07: Search, Filter, Sort, and Pagination", () => {
    it("returns paginated list of tickets for current requester with default page size 8", async () => {
      const res = await request(app)
        .get("/api/tickets")
        .set("X-Dev-Requester-Id", requesterA);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("items");
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.items).toHaveLength(8);
      expect(res.body.pagination).toEqual({
        page: 1,
        pageSize: 8,
        total: 10,
        totalPages: 2,
      });

      // Default sort is createdAt desc
      const dates = res.body.items.map((t: any) => new Date(t.createdAt).getTime());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });

    it("AC-16: searches case-insensitively across summary and ticketNumber", async () => {
      // Search by partial ticket number lowercase
      const resNum = await request(app)
        .get("/api/tickets?search=tkt-2026-900004")
        .set("X-Dev-Requester-Id", requesterA);

      expect(resNum.status).toBe(200);
      expect(resNum.body.items).toHaveLength(1);
      expect(resNum.body.items[0].ticketNumber).toBe("TKT-2026-900004");

      // Search by partial summary lowercase
      const resSummary = await request(app)
        .get("/api/tickets?search=wi-fi")
        .set("X-Dev-Requester-Id", requesterA);

      expect(resSummary.status).toBe(200);
      expect(resSummary.body.pagination.total).toBe(5); // items 2, 4, 6, 8, 10
      resSummary.body.items.forEach((item: any) => {
        expect(item.summary.toLowerCase()).toContain("wi-fi");
      });
    });

    it("AC-17: combines multiple filters (category and priority) with AND logic", async () => {
      // Category 1 (items 1..6) AND Priority LOW (items 1..3) -> items 1, 2, 3
      const res = await request(app)
        .get("/api/tickets?categoryId=1&requestedPriority=LOW")
        .set("X-Dev-Requester-Id", requesterA);

      expect(res.status).toBe(200);
      expect(res.body.pagination.total).toBe(3);
      res.body.items.forEach((item: any) => {
        expect(item.category.id).toBe(1);
        expect(item.requestedPriority).toBe("LOW");
      });
    });

    it("AC-26: sorts by ticketNumber ascending and descending", async () => {
      const resAsc = await request(app)
        .get("/api/tickets?sortBy=ticketNumber&sortOrder=asc&pageSize=20")
        .set("X-Dev-Requester-Id", requesterA);

      expect(resAsc.status).toBe(200);
      expect(resAsc.body.items[0].ticketNumber).toBe("TKT-2026-900001");
      expect(resAsc.body.items[9].ticketNumber).toBe("TKT-2026-900010");

      const resDesc = await request(app)
        .get("/api/tickets?sortBy=ticketNumber&sortOrder=desc&pageSize=20")
        .set("X-Dev-Requester-Id", requesterA);

      expect(resDesc.status).toBe(200);
      expect(resDesc.body.items[0].ticketNumber).toBe("TKT-2026-900010");
      expect(resDesc.body.items[9].ticketNumber).toBe("TKT-2026-900001");
    });

    it("AC-18: paginates correctly with custom page size and page slice", async () => {
      const resPage2 = await request(app)
        .get("/api/tickets?page=2&pageSize=8")
        .set("X-Dev-Requester-Id", requesterA);

      expect(resPage2.status).toBe(200);
      expect(resPage2.body.items).toHaveLength(2); // remaining 2 items out of 10
      expect(resPage2.body.pagination.page).toBe(2);
      expect(resPage2.body.pagination.total).toBe(10);
    });
  });

  // ---------------------------------------------------------------------------
  // API-08: Cross-Requester Ownership Isolation (AC-22, AC-23)
  // ---------------------------------------------------------------------------
  describe("API-08: Ownership Isolation", () => {
    it("AC-22, AC-23: scopes results strictly to authenticated requester", async () => {
      // Requester A has 10 tickets
      const resA = await request(app)
        .get("/api/tickets")
        .set("X-Dev-Requester-Id", requesterA);
      expect(resA.body.pagination.total).toBe(10);

      // Requester B has 3 tickets
      const resB = await request(app)
        .get("/api/tickets")
        .set("X-Dev-Requester-Id", requesterB);
      expect(resB.body.pagination.total).toBe(3);

      // Verify no ticket from Requester B appears in Requester A's list
      const ticketNumbersA = resA.body.items.map((t: any) => t.ticketNumber);
      resB.body.items.forEach((t: any) => {
        expect(ticketNumbersA).not.toContain(t.ticketNumber);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // API-09: Invalid Query Parameters Validation (AC-33, BR-27)
  // ---------------------------------------------------------------------------
  describe("API-09: Query Parameters Validation", () => {
    it("rejects request without valid X-Dev-Requester-Id", async () => {
      const res = await request(app).get("/api/tickets");
      expect(res.status).toBe(400);
    });

    it("rejects invalid sortBy field with 400", async () => {
      const res = await request(app)
        .get("/api/tickets?sortBy=maliciousColumn")
        .set("X-Dev-Requester-Id", requesterA);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });

    it("rejects invalid sortOrder with 400", async () => {
      const res = await request(app)
        .get("/api/tickets?sortOrder=sideways")
        .set("X-Dev-Requester-Id", requesterA);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });

    it("rejects invalid pageSize with 400", async () => {
      const res = await request(app)
        .get("/api/tickets?pageSize=15") // only 8, 20, 50 allowed
        .set("X-Dev-Requester-Id", requesterA);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    });

    it("rejects zero or negative page with 400", async () => {
      const resZero = await request(app)
        .get("/api/tickets?page=0")
        .set("X-Dev-Requester-Id", requesterA);
      expect(resZero.status).toBe(400);

      const resNegative = await request(app)
        .get("/api/tickets?page=-2")
        .set("X-Dev-Requester-Id", requesterA);
      expect(resNegative.status).toBe(400);
    });

    it("returns empty items with valid pagination metadata for out-of-range positive page (BR-27)", async () => {
      const res = await request(app)
        .get("/api/tickets?page=999&pageSize=8")
        .set("X-Dev-Requester-Id", requesterA);

      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
      expect(res.body.pagination).toEqual({
        page: 999,
        pageSize: 8,
        total: 10,
        totalPages: 2,
      });
    });
  });
});
