import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Lab 3 Migration and Seed Foundation (Issue #34)", () => {
  const prisma = getPrisma();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("seeds the required User counts across roles and statuses", async () => {
    const requesters = await prisma.user.findMany({ where: { role: "REQUESTER" } });
    expect(requesters.length).toBeGreaterThanOrEqual(5);

    const activeRequesters = requesters.filter((r) => r.isActive);
    const inactiveRequesters = requesters.filter((r) => !r.isActive);
    expect(activeRequesters.length).toBeGreaterThanOrEqual(4);
    expect(inactiveRequesters.length).toBeGreaterThanOrEqual(1);

    const staff = await prisma.user.findMany({ where: { role: "IT_STAFF" } });
    expect(staff.length).toBeGreaterThanOrEqual(4);
    const activeStaff = staff.filter((s) => s.isActive);
    const inactiveStaff = staff.filter((s) => !s.isActive);
    expect(activeStaff.length).toBeGreaterThanOrEqual(3);
    expect(inactiveStaff.length).toBeGreaterThanOrEqual(1);

    const admins = await prisma.user.findMany({ where: { role: "ADMINISTRATOR" } });
    expect(admins.length).toBeGreaterThanOrEqual(1);
    expect(admins.some((a) => a.isActive)).toBe(true);
  });

  it("stores salted bcrypt password hashes that verify against Password123!", async () => {
    const user = await prisma.user.findFirst({ where: { email: "somchai.j@kmutt.ac.th" } });
    expect(user).not.toBeNull();
    expect(user!.passwordHash).toMatch(/^\$2[aby]\$\d+\$/);

    const isValid = await bcrypt.compare("Password123!", user!.passwordHash);
    expect(isValid).toBe(true);
  });

  it("preserves Lab 2 reference data (Categories and Related Systems)", async () => {
    const categories = await prisma.category.findMany({ where: { isActive: true } });
    expect(categories.length).toBe(4);

    const systems = await prisma.relatedSystem.findMany({ where: { isActive: true } });
    expect(systems.length).toBeGreaterThanOrEqual(6);
  });

  it("seeds tickets with valid IT Priority, status, and User relations", async () => {
    const tickets = await prisma.ticket.findMany({
      include: {
        requester: true,
        primaryOwner: true,
        publicComments: true,
        internalNotes: true,
      },
    });

    expect(tickets.length).toBeGreaterThanOrEqual(6);

    // Verify at least one ticket has each key status
    const statuses = tickets.map((t) => t.currentStatus);
    expect(statuses).toContain("NEW");
    expect(statuses).toContain("OPEN");
    expect(statuses).toContain("IN_PROGRESS");
    expect(statuses).toContain("RESOLVED");

    // Verify relations and fields
    for (const t of tickets) {
      expect(t.requester).toBeDefined();
      expect(t.requester.role).toBe("REQUESTER");
      expect(t.itPriority).toBeDefined();
      expect(typeof t.problemAppearsResolved).toBe("boolean");
    }

    // Verify Public Comments and Internal Notes exist
    const hasComments = tickets.some((t) => t.publicComments.length > 0);
    const hasNotes = tickets.some((t) => t.internalNotes.length > 0);
    expect(hasComments).toBe(true);
    expect(hasNotes).toBe(true);
  });
});
