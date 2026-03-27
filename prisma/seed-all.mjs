import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Starting database initialization...");

  // 1. Seed Services
  const services = [
    "Admissions Office",
    "Bursary (Fees & Payments)",
    "Student Affairs (ID Cards)",
    "ICT Centre (Portal Support)",
    "Library (Resource Clearance)",
    "Health Centre",
  ];

  console.log("Seeding services...");
  for (const name of services) {
    const id = name.toLowerCase().replace(/\s+/g, "-");
    await prisma.service.upsert({
      where: { id },
      update: {},
      create: { id, name, isActive: true },
    });
  }

  // 2. Seed Settings
  const settings = [
    { key: "campus_name", value: "Campus Queue Manager" },
    { key: "primary_color", value: "#0056b3" },
    { key: "secondary_color", value: "#ffffff" },
    { key: "logo_text", value: "CQM" },
  ];

  console.log("Seeding settings...");
  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log("Database initialization complete!");
}

main()
  .catch((e) => {
    console.error("Error during initialization:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
