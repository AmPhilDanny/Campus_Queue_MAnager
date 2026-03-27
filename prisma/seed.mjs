import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const services = [
    "Admissions Office",
    "Bursary (Fees & Payments)",
    "Student Affairs (ID Cards)",
    "ICT Centre (Portal Support)",
    "Library (Resource Clearance)",
    "Health Centre",
  ];

  for (const name of services) {
    await prisma.service.upsert({
      where: { id: name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        isActive: true,
      },
    });
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
