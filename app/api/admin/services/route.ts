import { NextResponse } from "next/server";
import prisma from "@/lib/db";

import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const services = await prisma.service.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(services);
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (session?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { name } = await req.json();
  const id = name.toLowerCase().replace(/\s+/g, "-");
  const service = await prisma.service.create({
    data: { id, name, isActive: true },
  });
  return NextResponse.json(service);
}
