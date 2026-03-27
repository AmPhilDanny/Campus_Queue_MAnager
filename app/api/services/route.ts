import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const services = await prisma.service.findMany({
    where: { isActive: true },
    include: {
      queues: {
        where: { date: today },
        select: { isOpen: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const formatted = services.map((s) => ({
    ...s,
    isOpen: s.queues[0]?.isOpen ?? false, // Default to closed if no queue exists for today
  }));

  return NextResponse.json(formatted);
}
