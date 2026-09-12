import { getPrisma } from "../src/prisma.js";
import bcrypt from "bcryptjs";

// Lab 3 Idempotent Database Seed
async function main() {
  const prisma = getPrisma();
  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  // 1. Seed Categories (4 categories)
  const categories = [
    "Account and Access",
    "Hardware",
    "Software",
    "Network",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }
  console.log("✓ Successfully seeded Categories.");

  // 2. Seed Related Systems (>=6 related systems)
  const relatedSystems = [
    "Campus Wi-Fi",
    "Corporate Laptop",
    "Email",
    "Grade Submission App",
    "LEB2 App",
    "Printer",
    "VPN",
  ];

  for (const name of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }
  console.log("✓ Successfully seeded Related Systems.");

  // 3. Seed Users (Requesters, IT Staff, Administrator)
  const usersData = [
    // 4 Active Requesters
    {
      email: "somchai.j@kmutt.ac.th",
      fullName: "Somchai Jaidee",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: true,
    },
    {
      email: "suda.s@kmutt.ac.th",
      fullName: "Suda Sukjai",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: true,
    },
    {
      email: "jennifer.a@kmutt.ac.th",
      fullName: "Jennifer Anderson",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: true,
    },
    {
      email: "michael.b@kmutt.ac.th",
      fullName: "Michael Brown",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: true,
    },
    // 1 Inactive Requester
    {
      email: "former.staff@kmutt.ac.th",
      fullName: "Former Staff",
      role: "REQUESTER" as const,
      isActive: false,
      mustChangePassword: true,
    },
    // 3 Active IT Staff
    {
      email: "thanaporn.b@toktickit.local",
      fullName: "Thanaporn Boontarikmas",
      role: "IT_STAFF" as const,
      isActive: true,
      mustChangePassword: false,
    },
    {
      email: "komsan.s@toktickit.local",
      fullName: "Komsan Srisuk",
      role: "IT_STAFF" as const,
      isActive: true,
      mustChangePassword: true,
    },
    {
      email: "manee.t@toktickit.local",
      fullName: "Manee Techarat",
      role: "IT_STAFF" as const,
      isActive: true,
      mustChangePassword: true,
    },
    // 1 Inactive IT Staff
    {
      email: "prasert.r@toktickit.local",
      fullName: "Prasert Retired",
      role: "IT_STAFF" as const,
      isActive: false,
      mustChangePassword: true,
    },
    // 1 Active Administrator
    {
      email: "admin@toktickit.local",
      fullName: "System Administrator",
      role: "ADMINISTRATOR" as const,
      isActive: true,
      mustChangePassword: false,
    },
  ];

  const seededUsers: Record<string, any> = {};

  for (const u of usersData) {
    const userRecord = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        fullName: u.fullName,
        role: u.role,
        isActive: u.isActive,
      },
      create: {
        ...u,
        passwordHash: defaultPasswordHash,
      },
    });
    seededUsers[u.email] = userRecord;

    // Keep DevRequester in sync for backward compatibility
    if (u.role === "REQUESTER") {
      await prisma.devRequester.upsert({
        where: { email: u.email },
        update: { fullName: u.fullName, isActive: u.isActive },
        create: { fullName: u.fullName, email: u.email, isActive: u.isActive },
      });
    }
  }
  console.log("✓ Successfully seeded Users (4 Requesters + 1 Inactive, 3 IT Staff + 1 Inactive, 1 Admin).");

  // 4. Seed Seeded Tickets across statuses & priorities
  const catSoftware = await prisma.category.findUniqueOrThrow({ where: { name: "Software" } });
  const catNetwork = await prisma.category.findUniqueOrThrow({ where: { name: "Network" } });
  const catHardware = await prisma.category.findUniqueOrThrow({ where: { name: "Hardware" } });

  const sysEmail = await prisma.relatedSystem.findUniqueOrThrow({ where: { name: "Email" } });
  const sysWifi = await prisma.relatedSystem.findUniqueOrThrow({ where: { name: "Campus Wi-Fi" } });
  const sysLaptop = await prisma.relatedSystem.findUniqueOrThrow({ where: { name: "Corporate Laptop" } });

  const ticketsData = [
    {
      ticketNumber: "TKT-2026-000001",
      requesterId: seededUsers["somchai.j@kmutt.ac.th"].id,
      primaryOwnerId: null,
      categoryId: catSoftware.id,
      relatedSystemId: sysEmail.id,
      summary: "Cannot send outgoing emails to external domains",
      description: "Getting SMTP delivery timeout error 504 when sending mail outside the university.",
      requestedPriority: "HIGH" as const,
      itPriority: "HIGH" as const,
      currentStatus: "NEW" as const,
      problemAppearsResolved: false,
    },
    {
      ticketNumber: "TKT-2026-000002",
      requesterId: seededUsers["suda.s@kmutt.ac.th"].id,
      primaryOwnerId: seededUsers["thanaporn.b@toktickit.local"].id,
      categoryId: catNetwork.id,
      relatedSystemId: sysWifi.id,
      summary: "Frequent Wi-Fi disconnection in Building 3, Floor 4",
      description: "Laptop keeps disconnecting from KMUTT-Secure every 10 minutes in meeting room 402.",
      requestedPriority: "MEDIUM" as const,
      itPriority: "HIGH" as const,
      currentStatus: "OPEN" as const,
      problemAppearsResolved: false,
    },
    {
      ticketNumber: "TKT-2026-000003",
      requesterId: seededUsers["jennifer.a@kmutt.ac.th"].id,
      primaryOwnerId: seededUsers["komsan.s@toktickit.local"].id,
      categoryId: catHardware.id,
      relatedSystemId: sysLaptop.id,
      summary: "Blue screen error during startup",
      description: "Windows fails to boot with stop code CRITICAL_PROCESS_DIED.",
      requestedPriority: "HIGH" as const,
      itPriority: "HIGH" as const,
      currentStatus: "IN_PROGRESS" as const,
      problemAppearsResolved: false,
    },
    {
      ticketNumber: "TKT-2026-000004",
      requesterId: seededUsers["michael.b@kmutt.ac.th"].id,
      primaryOwnerId: seededUsers["thanaporn.b@toktickit.local"].id,
      categoryId: catSoftware.id,
      relatedSystemId: sysEmail.id,
      summary: "Spam filter quarantine false positive",
      description: "Important conference invitation was quarantined by default filter.",
      requestedPriority: "LOW" as const,
      itPriority: "LOW" as const,
      currentStatus: "WAITING_FOR_REQUESTER" as const,
      problemAppearsResolved: true,
    },
    {
      ticketNumber: "TKT-2026-000005",
      requesterId: seededUsers["somchai.j@kmutt.ac.th"].id,
      primaryOwnerId: seededUsers["manee.t@toktickit.local"].id,
      categoryId: catHardware.id,
      relatedSystemId: sysLaptop.id,
      summary: "Battery draining unusually fast",
      description: "Battery life drops from 100% to 20% in under one hour.",
      requestedPriority: "LOW" as const,
      itPriority: "LOW" as const,
      currentStatus: "RESOLVED" as const,
      problemAppearsResolved: true,
    },
    {
      ticketNumber: "TKT-2026-000006",
      requesterId: seededUsers["suda.s@kmutt.ac.th"].id,
      primaryOwnerId: seededUsers["komsan.s@toktickit.local"].id,
      categoryId: catNetwork.id,
      relatedSystemId: sysWifi.id,
      summary: "Guest Wi-Fi voucher expired",
      description: "Guest speaker needs 1-day wireless access voucher.",
      requestedPriority: "MEDIUM" as const,
      itPriority: "MEDIUM" as const,
      currentStatus: "CLOSED" as const,
      problemAppearsResolved: true,
    },
  ];

  for (const t of ticketsData) {
    const ticket = await prisma.ticket.upsert({
      where: { ticketNumber: t.ticketNumber },
      update: {
        currentStatus: t.currentStatus,
        primaryOwnerId: t.primaryOwnerId,
        itPriority: t.itPriority,
        problemAppearsResolved: t.problemAppearsResolved,
      },
      create: t,
    });

    // 5. Seed example Public Comments & Internal Notes
    if (t.ticketNumber === "TKT-2026-000002") {
      const existingComments = await prisma.publicComment.count({ where: { ticketId: ticket.id } });
      if (existingComments === 0) {
        await prisma.publicComment.create({
          data: {
            ticketId: ticket.id,
            authorId: seededUsers["thanaporn.b@toktickit.local"].id,
            content: "We have dispatched a technician to inspect Access Point 4B on Floor 4.",
          },
        });
        await prisma.publicComment.create({
          data: {
            ticketId: ticket.id,
            authorId: seededUsers["suda.s@kmutt.ac.th"].id,
            content: "Thank you! The signal seems stable now near room 402.",
          },
        });
      }

      const existingNotes = await prisma.internalNote.count({ where: { ticketId: ticket.id } });
      if (existingNotes === 0) {
        await prisma.internalNote.create({
          data: {
            ticketId: ticket.id,
            authorId: seededUsers["thanaporn.b@toktickit.local"].id,
            content: "AP 4B firmware was auto-updated last night. Rolled back to build 14.2.",
          },
        });
      }
    }
  }
  console.log("✓ Successfully seeded Tickets with Public Comments and Internal Notes.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
