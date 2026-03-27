import { NextResponse } from "next/server";
import { callNextTicket, serveTicket, skipTicket, recallSkippedTicket } from "@/lib/admin-logic";
import prisma from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  let serviceId = searchParams.get("serviceId");

  // Role-based restriction
  if (session.role === "ADMIN") {
    if (!session.officeId) return NextResponse.json({ error: "Admin has no assigned office" }, { status: 403 });
    serviceId = session.officeId;
  }

  if (!serviceId) return NextResponse.json({ error: "Service ID required" }, { status: 400 });

  const today = new Date().toISOString().split("T")[0];
  const queue = await prisma.queue.findUnique({
    where: { serviceId_date: { serviceId, date: today } },
    include: {
      tickets: {
        orderBy: { ticketNumber: "desc" },
      },
    },
  });

  return NextResponse.json(queue || { tickets: [], waitingCount: 0, currentNumber: 0 });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, serviceId, ticketId } = await req.json();

  // Role-based restriction for actions
  if (session.role === "ADMIN" && session.officeId !== serviceId) {
    // If ticketId is provided, we should ideally check if the ticket belongs to the admin's office
    // For now, checking serviceId is a good start.
    return NextResponse.json({ error: "Unauthorized for this office" }, { status: 403 });
  }

  try {
    let result;
    switch (action) {
      case "call-next":
        result = await callNextTicket(serviceId);
        break;
      case "serve":
        result = await serveTicket(ticketId);
        break;
      case "skip":
        result = await skipTicket(ticketId);
        break;
      case "recall":
        result = await recallSkippedTicket(ticketId);
        break;
      case "update-wait-time":
        const { minutes } = await req.json();
        const { updateTicketWaitTime } = await import("@/lib/admin-logic");
        result = await updateTicketWaitTime(ticketId, minutes);
        break;
      case "toggle-open":
        const today = new Date().toISOString().split("T")[0];
        const currentQueue = await prisma.queue.findUnique({
          where: { serviceId_date: { serviceId, date: today } }
        });
        if (!currentQueue) {
          // If no queue exists today, create it toggled to open
          result = await prisma.queue.create({
            data: { serviceId, date: today, isOpen: true }
          });
        } else {
          result = await prisma.queue.update({
            where: { id: currentQueue.id },
            data: { isOpen: !currentQueue.isOpen }
          });
        }
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
