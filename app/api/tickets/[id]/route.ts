import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { service: true, queue: true },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  // Calculate position (people ahead with status waiting/called and smaller ticket number)
  const position = await prisma.ticket.count({
    where: {
      serviceId: ticket.serviceId,
      queueId: ticket.queueId,
      status: { in: ["waiting", "called"] },
      ticketNumber: { lt: ticket.ticketNumber },
    },
  });

  return NextResponse.json({ ...ticket, position: position + 1 });
}
