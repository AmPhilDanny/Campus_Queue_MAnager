import prisma from "./db";
import { getOrCreateTodayQueue } from "./queue-logic";

async function sendNotification(ticket: any, serviceName: string) {
  try {
    const settingsArr = await prisma.setting.findMany();
    const settings = Object.fromEntries(settingsArr.map(s => [s.key, s.value]));
    
    if (settings.notification_enabled !== "true") return;

    const template = settings.notification_template || "It's your turn at {service}. Ticket {ticketNumber}.";
    const message = template
      .replace(/{service}/g, serviceName)
      .replace(/{ticketNumber}/g, String(ticket.ticketNumber))
      .replace(/{customerName}/g, ticket.customerName || "Student")
      .replace(/{id}/g, ticket.id);

    // 1. Email Placeholder (MVP: Log to console)
    if (ticket.email || settings.test_email) {
      console.log(`[EMAIL NOTIFICATION] To: ${ticket.email || settings.test_email} | Message: ${message}`);
    }

    // 2. SMS Webhook Placeholder (MVP: POST to configured URL)
    if (ticket.customerPhone && settings.sms_webhook_url) {
      console.log(`[SMS WEBHOOK] Triggering for ${ticket.customerPhone}...`);
      // Non-blocking fetch
      fetch(settings.sms_webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: ticket.customerPhone,
          message,
          serviceName,
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
        }),
      }).catch(err => console.error("[SMS WEBHOOK ERROR]", err.message));
    }
  } catch (err: any) {
    console.error("[NOTIFICATION ERROR]", err.message);
  }
}

export async function callNextTicket(serviceId: string) {
  const queue = await getOrCreateTodayQueue(serviceId);

  return await prisma.$transaction(async (tx) => {
    const nextTicket = await tx.ticket.findFirst({
      where: {
        serviceId,
        queueId: queue.id,
        status: "waiting",
      },
      orderBy: {
        ticketNumber: "asc",
      },
    });

    if (!nextTicket) return null;

    const updatedTicket = await tx.ticket.update({
      where: { id: nextTicket.id },
      data: {
        status: "called",
        calledAt: new Date(),
      },
    });

    await tx.queue.update({
      where: { id: queue.id },
      data: {
        currentNumber: nextTicket.ticketNumber,
        waitingCount: {
          decrement: 1,
        },
      },
    });

    // Trigger notification (Non-blocking)
    const service = await tx.service.findUnique({ where: { id: serviceId } });
    sendNotification(updatedTicket, service?.name || "Campus Office");

    return updatedTicket;
  });
}

export async function serveTicket(ticketId: string) {
  return await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.update({
      where: { id: ticketId },
      data: {
        status: "served",
        servedAt: new Date(),
      },
    });

    // Update avgWaitMs
    const waitTime = ticket.servedAt!.getTime() - ticket.createdAt.getTime();
    const queue = await tx.queue.findUnique({ where: { id: ticket.queueId } });
    
    if (queue) {
      const servedCount = await tx.ticket.count({
        where: { queueId: queue.id, status: "served" },
      });
      const newAvg = (queue.avgWaitMs * (servedCount - 1) + waitTime) / servedCount;
      
      await tx.queue.update({
        where: { id: queue.id },
        data: { avgWaitMs: newAvg },
      });
    }

    return ticket;
  });
}

export async function skipTicket(ticketId: string) {
  return await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: "skipped",
    },
  });
}

export async function recallSkippedTicket(ticketId: string) {
  return await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.update({
      where: { id: ticketId },
      data: {
        status: "waiting",
      },
    });

    await tx.queue.update({
      where: { id: ticket.queueId },
      data: {
        waitingCount: {
          increment: 1,
        },
      },
    });

    return ticket;
  });
}

export async function updateTicketWaitTime(ticketId: string, minutes: number | null) {
  return await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      manualWaitTime: minutes,
    },
  });
}
