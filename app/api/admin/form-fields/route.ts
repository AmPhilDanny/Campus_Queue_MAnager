import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { isSuperAdmin } from "@/lib/admin-auth";

export async function GET() {
  const fields = await prisma.formField.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(fields);
}

export async function POST(req: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const fieldCount = await prisma.formField.count({ where: { isActive: true } });
    const field = await prisma.formField.create({
      data: {
        ...body,
        order: body.order || fieldCount,
      },
    });
    return NextResponse.json(field);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create field" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { fields } = await req.json(); // Array of { id, order }
    
    await prisma.$transaction(
      fields.map((f: { id: string, order: number }) =>
        prisma.formField.update({
          where: { id: f.id },
          data: { order: f.order },
        })
      )
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to reorder fields" }, { status: 500 });
  }
}
