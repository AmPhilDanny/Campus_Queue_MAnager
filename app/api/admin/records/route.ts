import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (session?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");
  const queueId = searchParams.get("id");

  try {
    if (queueId) {
      // Fetch detailed queue with all tickets
      const queue = await prisma.queue.findUnique({
        where: { id: queueId },
        include: {
          service: true,
          tickets: {
            orderBy: { ticketNumber: "asc" },
          },
        },
      });
      return NextResponse.json(queue);
    }

    const where: any = {};
    if (date) where.date = date;
    if (serviceId) where.serviceId = serviceId;

    const queues = await prisma.queue.findMany({
      where,
      include: {
        service: true,
        _count: {
          select: { tickets: true }
        }
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(queues);
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getAdminSession();
  if (session?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, queueId, ticketId, ...data } = await req.json();

    if (action === "update-queue") {
      const result = await prisma.queue.update({
        where: { id: queueId },
        data: { isOpen: data.isOpen },
      });
      return NextResponse.json(result);
    }

    if (action === "delete-ticket") {
      await prisma.ticket.delete({
        where: { id: ticketId },
      });
      // Update queue waiting count if it was waiting
      if (data.status === "waiting") {
        await prisma.queue.update({
          where: { id: queueId },
          data: { waitingCount: { decrement: 1 } },
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update record: " + err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getAdminSession();
  if (session?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const queueId = searchParams.get("id");
  const beforeDate = searchParams.get("beforeDate");

  try {
    if (queueId) {
      // Delete specific queue and its tickets
      await prisma.$transaction([
        prisma.ticket.deleteMany({ where: { queueId } }),
        prisma.queue.delete({ where: { id: queueId } }),
      ]);
    } else if (beforeDate) {
      // Delete all queues and tickets before a specific date
      const queuesToDelete = await prisma.queue.findMany({
        where: { date: { lt: beforeDate } },
        select: { id: true }
      });
      const queueIds = queuesToDelete.map(q => q.id);

      await prisma.$transaction([
        prisma.ticket.deleteMany({ where: { queueId: { in: queueIds } } }),
        prisma.queue.deleteMany({ where: { id: { in: queueIds } } }),
      ]);
    } else {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete records: " + err.message }, { status: 500 });
  }
}
