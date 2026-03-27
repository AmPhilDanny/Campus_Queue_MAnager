import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (session?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await context.params;
  const data = await req.json();
  const service = await prisma.service.update({
    where: { id },
    data,
  });
  return NextResponse.json(service);
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (session?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await context.params;
  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
