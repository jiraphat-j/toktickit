import { getPrisma } from "../src/prisma.js";

// Lab 2 Idempotent Database Seed
async function main() {
  const prisma = getPrisma();

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
  console.log("Successfully seeded Categories.");

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
  console.log("Successfully seeded Related Systems.");

  // 3. Seed Development Requesters (>=4 active, >=1 inactive)
  const requesters = [
    { fullName: "Somchai Jaidee", email: "somchai.j@kmutt.ac.th", isActive: true },
    { fullName: "Suda Sukjai", email: "suda.s@kmutt.ac.th", isActive: true },
    { fullName: "Jennifer Anderson", email: "jennifer.a@kmutt.ac.th", isActive: true },
    { fullName: "Michael Brown", email: "michael.b@kmutt.ac.th", isActive: true },
    { fullName: "Former Staff", email: "former.staff@kmutt.ac.th", isActive: false },
  ];

  for (const req of requesters) {
    await prisma.devRequester.upsert({
      where: { email: req.email },
      update: { fullName: req.fullName, isActive: req.isActive },
      create: req,
    });
  }
  console.log("Successfully seeded Development Requesters (Active & Inactive).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
