import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { createSession } from "../../src/session.js";

describe("Lab 3 IT Staff Ticket Queue API Tests (STF-01..04, AC-12, BR-23)", () => {
  let requesterCookie: string;
  let staffCookie: string;
  let adminCookie: string;
  let staffUserId: number;
  let adminUserId: number;
  let seededCategoryId: number;
  let seededSystemId: number;

  beforeAll(async () => {
    const prisma = getPrisma();

    // Fetch seeded users
    const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
    const reqUser = users.find((u) => u.role === "REQUESTER" && u.isActive);
    const stUser = users.find((u) => u.role === "IT_STAFF" && u.isActive);
    const admUser = users.find((u) => u.role === "ADMINISTRATOR" && u.isActive);

    if (!reqUser || !stUser || !admUser) {
      throw new Error("Required seeded users not found. Ensure DB is seeded.");
    }

    staffUserId = stUser.id;
    adminUserId = admUser.id;

    await prisma.user.updateMany({
      where: { id: { in: [reqUser.id, stUser.id, admUser.id] } },
      data: { mustChangePassword: false },
    });

    requesterCookie = `toktickit_session=${createSession(reqUser.id)}`;
    staffCookie = `toktickit_session=${createSession(stUser.id)}`;
    adminCookie = `toktickit_session=${createSession(admUser.id)}`;

    const cat = await prisma.category.findFirst({ where: { isActive: true } });
    seededCategoryId = cat!.id;

    const sys = await prisma.relatedSystem.findFirst({ where: { isActive: true } });
    seededSystemId = sys!.id;

    // Clean up any previous test tickets with this prefix
    await prisma.ticket.deleteMany({
      where: { ticketNumber: { startsWith: "TK-STAFF-" } },
    });

    // Create a known set of test tickets for queue testing to ensure deterministic results
    // 1. Unassigned, NEW, HIGH priority
    await prisma.ticket.create({
      data: {
        ticketNumber: "TK-STAFF-001",
        summary: "Staff Queue Alpha printer issue",
        description: "Printer alpha is jammed in room 101",
        categoryId: seededCategoryId,
        relatedSystemId: seededSystemId,
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        currentStatus: "NEW",
        requesterId: reqUser.id,
        primaryOwnerId: null,
      },
    });

    // 2. Assigned to staffUser, IN_PROGRESS, LOW priority
    await prisma.ticket.create({
      data: {
        ticketNumber: "TK-STAFF-002",
        summary: "Staff Queue Beta software license",
        description: "Need license for beta software",
        categoryId: seededCategoryId,
        relatedSystemId: seededSystemId,
        requestedPriority: "LOW",
        itPriority: "LOW",
        currentStatus: "IN_PROGRESS",
        requesterId: reqUser.id,
        primaryOwnerId: staffUserId,
      },
    });

    // 3. Assigned to adminUser, RESOLVED, MEDIUM priority
    await prisma.ticket.create({
      data: {
        ticketNumber: "TK-STAFF-003",
        summary: "Staff Queue Gamma network drop",
        description: "Network dropped in server room",
        categoryId: seededCategoryId,
        relatedSystemId: seededSystemId,
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        currentStatus: "RESOLVED",
        requesterId: reqUser.id,
        primaryOwnerId: adminUserId,
        problemAppearsResolved: true,
      },
    });
  });

  // Role Access & RBAC Guards
  describe("Role Access & RBAC Guards (AC-05, BR-07)", () => {
    it("Unauthenticated request returns 401 Unauthorized", async () => {
      const res = await request(app).get("/api/staff/tickets");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("Requester role is blocked from GET /api/staff/tickets with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Cookie", requesterCookie);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("IT Staff role can access GET /api/staff/tickets with 200 OK", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Cookie", staffCookie);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("items");
      expect(res.body).toHaveProperty("pagination");
    });

    it("Administrator role can access GET /api/staff/tickets with 200 OK", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Cookie", adminCookie);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("items");
    });
  });

  // STF-01: Search Filtering
  describe("STF-01 (AC-12, BR-23): Search by partial ticket number or summary (case-insensitive)", () => {
    it("Matches ticketNumber case-insensitively", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?search=staff-001")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      expect(
        res.body.items.some((t: any) => t.ticketNumber === "TK-STAFF-001")
      ).toBe(true);
    });

    it("Matches summary case-insensitively", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?search=BETA SOFTWARE")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      expect(
        res.body.items.some((t: any) => t.ticketNumber === "TK-STAFF-002")
      ).toBe(true);
    });

    it("Returns empty array when search matches nothing", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?search=NONEXISTENT_QUERY_999XYZ")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(0);
      expect(res.body.pagination.totalItems).toBe(0);
    });
  });

  // STF-02: Multi-Filter combinations
  describe("STF-02 (AC-12, BR-23): Multi-filtering (category, status, priority, owner)", () => {
    it("Filters by currentStatus", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?currentStatus=IN_PROGRESS")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      res.body.items.forEach((t: any) => {
        expect(t.currentStatus).toBe("IN_PROGRESS");
      });
    });

    it("Filters by itPriority", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?itPriority=HIGH")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      res.body.items.forEach((t: any) => {
        expect(t.itPriority).toBe("HIGH");
      });
    });

    it("Filters by ownerId = 'unassigned'", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?ownerId=unassigned")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      res.body.items.forEach((t: any) => {
        expect(t.primaryOwner).toBeNull();
      });
      expect(
        res.body.items.some((t: any) => t.ticketNumber === "TK-STAFF-001")
      ).toBe(true);
    });

    it("Filters by ownerId = 'me' (current logged in staff)", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?ownerId=me")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      res.body.items.forEach((t: any) => {
        expect(t.primaryOwner.id).toBe(staffUserId);
      });
    });

    it("Filters by specific owner ID", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets?ownerId=${adminUserId}`)
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      res.body.items.forEach((t: any) => {
        expect(t.primaryOwner.id).toBe(adminUserId);
      });
    });

    it("Combines multiple filters with AND logic", async () => {
      const res = await request(app)
        .get(
          `/api/staff/tickets?categoryId=${seededCategoryId}&currentStatus=NEW&itPriority=HIGH&ownerId=unassigned&search=Alpha`
        )
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].ticketNumber).toBe("TK-STAFF-001");
      expect(res.body.items[0].currentStatus).toBe("NEW");
      expect(res.body.items[0].itPriority).toBe("HIGH");
      expect(res.body.items[0].primaryOwner).toBeNull();
    });
  });

  // STF-03: Sorting and Pagination
  describe("STF-03 (AC-12, BR-23): Sorting and pagination", () => {
    it("Default sort is createdAt desc", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(2);
      const dates = res.body.items.map((t: any) => new Date(t.createdAt).getTime());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });

    it("Sorts by ticketNumber asc", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?sortBy=ticketNumber&sortOrder=asc&search=TK-STAFF-")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(3);
      expect(res.body.items[0].ticketNumber).toBe("TK-STAFF-001");
      expect(res.body.items[1].ticketNumber).toBe("TK-STAFF-002");
      expect(res.body.items[2].ticketNumber).toBe("TK-STAFF-003");
    });

    it("Paginates correctly and returns pagination metadata", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?page=1&limit=2&search=TK-STAFF-")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 2,
        totalItems: 3,
        totalPages: 2,
      });

      const page2Res = await request(app)
        .get("/api/staff/tickets?page=2&limit=2&search=TK-STAFF-")
        .set("Cookie", staffCookie);

      expect(page2Res.status).toBe(200);
      expect(page2Res.body.items).toHaveLength(1);
      expect(page2Res.body.pagination.page).toBe(2);
    });

    it("Supports pageSize alias for limit", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?page=1&pageSize=1&search=TK-STAFF-")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.pagination.limit).toBe(1);
    });
  });

  // STF-04: Validation of Query Parameters
  describe("STF-04 (AC-12, BR-23): Parameter validation errors (400 Bad Request)", () => {
    it("Rejects non-integer page with 400 Bad Request", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?page=invalid")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(
        res.body.error.details.some((d: any) => d.field === "page")
      ).toBe(true);
    });

    it("Rejects negative or 0 page with 400 Bad Request", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?page=0")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(
        res.body.error.details.some((d: any) => d.field === "page")
      ).toBe(true);
    });

    it("Rejects invalid limit with 400 Bad Request", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?limit=-5")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(
        res.body.error.details.some((d: any) => d.field === "limit")
      ).toBe(true);
    });

    it("Rejects non-whitelisted sortBy field with 400 Bad Request", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?sortBy=malicious_sql_injection")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(
        res.body.error.details.some((d: any) => d.field === "sortBy")
      ).toBe(true);
    });

    it("Rejects invalid sortOrder with 400 Bad Request", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?sortOrder=sideways")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(
        res.body.error.details.some((d: any) => d.field === "sortOrder")
      ).toBe(true);
    });

    it("Rejects invalid currentStatus enum with 400 Bad Request", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?currentStatus=PENDING_APPROVAL")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(
        res.body.error.details.some((d: any) => d.field === "currentStatus")
      ).toBe(true);
    });

    it("Rejects invalid itPriority enum with 400 Bad Request", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?itPriority=CRITICAL")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(
        res.body.error.details.some((d: any) => d.field === "itPriority")
      ).toBe(true);
    });

    it("Rejects invalid ownerId (not int, unassigned, or me) with 400 Bad Request", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?ownerId=someone_else")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(
        res.body.error.details.some((d: any) => d.field === "ownerId")
      ).toBe(true);
    });

    it("Rejects invalid categoryId with 400 Bad Request", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?categoryId=not_a_number")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(
        res.body.error.details.some((d: any) => d.field === "categoryId")
      ).toBe(true);
    });
  });

  // GET /api/staff/members
  describe("GET /api/staff/members (Active Staff/Admin Directory)", () => {
    it("Requester cannot access /api/staff/members (403 Forbidden)", async () => {
      const res = await request(app)
        .get("/api/staff/members")
        .set("Cookie", requesterCookie);

      expect(res.status).toBe(403);
    });

    it("Staff can access /api/staff/members and receives list of active staff and admins", async () => {
      const res = await request(app)
        .get("/api/staff/members")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);

      // Verify each member is staff or admin
      res.body.forEach((member: any) => {
        expect(["IT_STAFF", "ADMINISTRATOR"]).toContain(member.role);
        expect(member).toHaveProperty("id");
        expect(member).toHaveProperty("fullName");
        expect(member).toHaveProperty("email");
      });
    });
  });
});
