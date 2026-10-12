import { describe, it, expect, afterAll } from "vitest";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 4 Migration and Seed Foundation (Issue #57)", () => {
  const prisma = getPrisma();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("MIG-01 (AC-01, AC-14): Schema migration creates ActionTaken table with relations and indexes", async () => {
    // 1. Verify table exists and can be queried
    const actions = await prisma.actionTaken.findMany({
      include: {
        ticket: true,
        performedBy: true,
      },
      take: 5,
    });
    expect(actions).toBeDefined();
    expect(Array.isArray(actions)).toBe(true);
    expect(actions.length).toBeGreaterThan(0);

    // 2. Verify relation integrity: each action belongs to a valid ticket and user
    for (const action of actions) {
      expect(action.ticketId).toBeDefined();
      expect(action.ticket).toBeDefined();
      expect(action.ticket.id).toBe(action.ticketId);

      expect(action.performedById).toBeDefined();
      expect(action.performedBy).toBeDefined();
      expect(action.performedBy.id).toBe(action.performedById);

      expect(action.actionDateTime).toBeInstanceOf(Date);
      expect(typeof action.description).toBe("string");
      expect(typeof action.result).toBe("string");
      expect(typeof action.followUpRequired).toBe("boolean");
    }
  });

  it("MIG-02 (AC-14): Zero data loss verification - all pre-existing records remain intact", async () => {
    // Verify Users preserved
    const userCount = await prisma.user.count();
    expect(userCount).toBeGreaterThanOrEqual(10); // 4 req + 1 inact req + 3 staff + 1 inact staff + 1 admin

    // Verify Categories preserved
    const categoryCount = await prisma.category.count();
    expect(categoryCount).toBe(4);

    // Verify Related Systems preserved
    const systemCount = await prisma.relatedSystem.count();
    expect(systemCount).toBeGreaterThanOrEqual(6);

    // Verify Tickets preserved
    const ticketCount = await prisma.ticket.count();
    expect(ticketCount).toBeGreaterThanOrEqual(6);

    // Verify pre-existing comments and notes preserved
    const commentCount = await prisma.publicComment.count();
    expect(commentCount).toBeGreaterThanOrEqual(2);

    const noteCount = await prisma.internalNote.count();
    expect(noteCount).toBeGreaterThanOrEqual(1);

    // Legacy ticket query works seamlessly with actionsTaken relation
    const ticketsWithActions = await prisma.ticket.findMany({
      include: {
        actionsTaken: true,
        publicComments: true,
        internalNotes: true,
        attachments: true,
      },
    });
    expect(ticketsWithActions.length).toBeGreaterThanOrEqual(6);
  });

  it("SEED-01 (AC-01, BR-02): Idempotent seed populates tickets with 0, 1, and 3+ actions from different IT Staff", async () => {
    // 1. Ticket with 0 actions (TKT-2026-000001 - for resolution gate block testing)
    const ticket0 = await prisma.ticket.findUnique({
      where: { ticketNumber: "TKT-2026-000001" },
      include: { actionsTaken: true },
    });
    expect(ticket0).not.toBeNull();
    expect(ticket0!.actionsTaken.length).toBe(0);

    // 2. Ticket with 1 action (TKT-2026-000002)
    const ticket1 = await prisma.ticket.findUnique({
      where: { ticketNumber: "TKT-2026-000002" },
      include: {
        actionsTaken: {
          include: { performedBy: true },
        },
      },
    });
    expect(ticket1).not.toBeNull();
    expect(ticket1!.actionsTaken.length).toBe(1);
    const action1 = ticket1!.actionsTaken[0];
    expect(action1.performedBy.role).toBe("IT_STAFF");
    expect(action1.followUpRequired).toBe(true);
    expect(action1.followUpNote).toBeTruthy();
    expect(action1.attachmentNotes).toBe("AP-4B-status-led.jpg");

    // 3. Ticket with 3+ actions by different IT Staff members (TKT-2026-000003 - BR-02 multi-staff attribution)
    const ticket3 = await prisma.ticket.findUnique({
      where: { ticketNumber: "TKT-2026-000003" },
      include: {
        actionsTaken: {
          include: { performedBy: true },
          orderBy: { actionDateTime: "asc" },
        },
      },
    });
    expect(ticket3).not.toBeNull();
    expect(ticket3!.actionsTaken.length).toBeGreaterThanOrEqual(3);

    // Verify BR-02: distinct IT Staff performers contributed actions to this ticket
    const performerIds = new Set(ticket3!.actionsTaken.map((a) => a.performedById));
    expect(performerIds.size).toBeGreaterThanOrEqual(3);

    // Verify followUpRequired variations
    const hasFollowUpTrue = ticket3!.actionsTaken.some((a) => a.followUpRequired && a.followUpNote);
    const hasFollowUpFalse = ticket3!.actionsTaken.some((a) => !a.followUpRequired);
    expect(hasFollowUpTrue).toBe(true);
    expect(hasFollowUpFalse).toBe(true);

    // 4. Resolved ticket (TKT-2026-000005) has >=1 action taken
    const ticketResolved = await prisma.ticket.findUnique({
      where: { ticketNumber: "TKT-2026-000005" },
      include: { actionsTaken: true },
    });
    expect(ticketResolved).not.toBeNull();
    expect(ticketResolved!.currentStatus).toBe("RESOLVED");
    expect(ticketResolved!.actionsTaken.length).toBeGreaterThanOrEqual(1);
  });
});
