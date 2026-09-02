import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Development Requester Context API (Issue 2)", () => {
  // API-01 (AC-24, AC-31): List active development requesters
  it("API-01: GET /api/dev-requesters returns only active development requesters in id asc order", async () => {
    const res = await request(app).get("/api/dev-requesters");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);

    // Verify all returned requesters have isActive: true
    res.body.forEach((requester: any) => {
      expect(requester.isActive).toBe(true);
      expect(requester).toHaveProperty("id");
      expect(requester).toHaveProperty("fullName");
      expect(requester).toHaveProperty("email");
    });

    // Verify no inactive requester is present
    const inactiveRequesters = res.body.filter((r: any) => r.isActive === false || r.email === "former.staff@kmutt.ac.th");
    expect(inactiveRequesters.length).toBe(0);

    // Verify sorted by id ASC
    for (let i = 0; i < res.body.length - 1; i++) {
      expect(res.body[i].id).toBeLessThan(res.body[i + 1].id);
    }
  });

  // API-02 (AC-27): Inactive or missing X-Dev-Requester-Id is rejected on protected/scoped routes
  it("API-02: Scoped route returns 400 Bad Request if X-Dev-Requester-Id header is missing", async () => {
    const res = await request(app).get("/api/tickets");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });

  it("API-02: Scoped route returns 400 Bad Request if X-Dev-Requester-Id is non-numeric or unknown", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .set("X-Dev-Requester-Id", "invalid-id");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");

    const resUnknown = await request(app)
      .get("/api/tickets")
      .set("X-Dev-Requester-Id", "99999");
    expect(resUnknown.status).toBe(400);
    expect(resUnknown.body.error.code).toBe("BAD_REQUEST");
  });

  it("API-02: Scoped route returns 400 Bad Request if X-Dev-Requester-Id belongs to an inactive requester", async () => {
    // Inactive requester id (former staff)
    const res = await request(app)
      .get("/api/tickets")
      .set("X-Dev-Requester-Id", "5");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });
});
