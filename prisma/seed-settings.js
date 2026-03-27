import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const settings = [
    { key: "campus_name", value: "Campus Queue Manager" },
    { key: "primary_color", value: "#0056b3" },
    { key: "secondary_color", value: "#ffffff" },
    { key: "logo_text", value: "CQM" },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log("Settings seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
