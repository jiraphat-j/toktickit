import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Reference Data APIs (Issue 2)", () => {
  // API-03 (AC-31): List active categories
  it("API-03: GET /api/categories returns only active categories in id asc order", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(4);

    const names = res.body.map((c: any) => c.name);
    expect(names).toEqual([
      "Account and Access",
      "Hardware",
      "Software",
      "Network"
    ]);

    // Check all records have id and name
    res.body.forEach((cat: any) => {
      expect(cat).toHaveProperty("id");
      expect(cat).toHaveProperty("name");
    });
  });

  // API-03 (AC-31): List active related systems
  it("API-03: GET /api/related-systems returns only active related systems in name asc order", async () => {
    const res = await request(app).get("/api/related-systems");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(6);

    const names = res.body.map((s: any) => s.name);
    expect(names).toContain("Campus Wi-Fi");
    expect(names).toContain("Corporate Laptop");
    expect(names).toContain("Email");
    expect(names).toContain("Grade Submission App");
    expect(names).toContain("LEB2 App");
    expect(names).toContain("Printer");
    expect(names).toContain("VPN");

    // Check sorted by name ASC
    for (let i = 0; i < names.length - 1; i++) {
      expect(names[i].localeCompare(names[i + 1])).toBeLessThanOrEqual(0);
    }
  });
});
