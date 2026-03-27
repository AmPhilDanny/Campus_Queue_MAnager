import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@cqm.edu";
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Super Admin created:", admin.email);

  // Seed default form fields if empty
  const fieldCount = await prisma.formField.count();
  if (fieldCount === 0) {
    const defaultFields = [
      { name: "name", label: "Full Name", type: "text", required: true, order: 1 },
      { name: "studentNumber", label: "Matric / Student No", type: "text", required: true, order: 2 },
      { name: "department", label: "Department", type: "text", required: true, order: 3 },
      { name: "course", label: "Course of Study", type: "text", required: true, order: 4 },
      { name: "email", label: "Email Address", type: "email", required: true, order: 5 },
      { name: "description", label: "Reason for Visit", type: "textarea", required: true, order: 6 },
    ];

    for (const field of defaultFields) {
      await prisma.formField.create({ data: field });
    }
    console.log("Default form fields seeded.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
