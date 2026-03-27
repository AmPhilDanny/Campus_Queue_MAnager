import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { ticketNumber, identifier, serviceId } = await req.json();

    if (!ticketNumber || !identifier) {
      return NextResponse.json({ error: "Ticket number and identifier required" }, { status: 400 });
    }

    // Search for ticket by ticketNumber AND (email OR studentNumber)
    // We also optionally filter by serviceId if provided to narrow down
    const ticket = await prisma.ticket.findFirst({
      where: {
        ticketNumber: parseInt(ticketNumber),
        OR: [
          { email: identifier },
          { studentNumber: identifier }
        ],
        status: { in: ['waiting', 'called'] }, // Only track active tickets
        ...(serviceId ? { serviceId } : {})
      },
      select: { id: true }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Active ticket not found matching these details." }, { status: 404 });
    }

    return NextResponse.json({ id: ticket.id });
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
