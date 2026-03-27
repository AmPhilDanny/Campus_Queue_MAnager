import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting demo database initialization...");

  // 1. Seed Services
  const demoServices = [
    { name: "HOD Office", id: "hod-office" },
    { name: "Admin Office", id: "admin-office" },
    { name: "Bursary", id: "bursary" },
  ];

  console.log("Seeding demo services...");
  for (const s of demoServices) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: {},
      create: { id: s.id, name: s.name, isActive: true },
    });
  }

  // 2. Seed Admin User
  const email = "admin@cqm.edu";
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log("Seeding admin user...");
  await prisma.admin.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });

  // 3. Seed Default Settings
  const settings = [
    { key: "campus_name", value: "Campus Queue Manager (CQM)" },
    { key: "primary_color", value: "#1e3a8a" },
    { key: "secondary_color", value: "#ffffff" },
    { key: "logo_text", value: "CQM" },
    { key: "notification_enabled", value: "true" },
    { key: "sms_webhook_url", value: "" },
    { key: "default_wait_min", value: "5" },
  ];

  console.log("Seeding default settings...");
  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value }, // Ensure demo settings are set
      create: setting,
    });
  }

  console.log("Demo database initialization complete!");
  console.log("Admin Email: " + email);
  console.log("Admin Password: " + password);
}

main()
  .catch((e) => {
    console.error("Error during initialization:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
