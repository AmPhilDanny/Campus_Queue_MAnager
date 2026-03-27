import prisma from "./db";

export async function getOrCreateTodayQueue(serviceId: string) {
  const today = new Date().toISOString().split("T")[0];

  let queue = await prisma.queue.findUnique({
    where: {
      serviceId_date: { serviceId, date: today },
    },
  });

  if (!queue) {
    // Use upsert to handle concurrent "first ticket of day" races gracefully
    queue = await prisma.queue.upsert({
      where: { serviceId_date: { serviceId, date: today } },
      update: {},
      create: {
        serviceId,
        date: today,
        isOpen: true,
        currentNumber: 0,
        waitingCount: 0,
        avgWaitMs: 0,
      },
    });
  }

  return queue;
}

async function _attemptCreateTicket(
  queue: { id: string },
  serviceId: string,
  customerName?: string,
  customerPhone?: string,
  studentNumber?: string,
  department?: string,
  course?: string,
  email?: string,
  description?: string,
  additionalData?: any
) {
  return prisma.$transaction(async (tx: any) => {
    // Use aggregate max to get the highest ticketNumber — safe under concurrency
    const agg = await tx.ticket.aggregate({
      where: { queueId: queue.id },
      _max: { ticketNumber: true },
    });

    const ticketNumber = (agg._max.ticketNumber ?? 0) + 1;

    const ticket = await tx.ticket.create({
      data: {
        serviceId,
        queueId: queue.id,
        ticketNumber,
        customerName,
        customerPhone,
        studentNumber,
        department,
        course,
        email,
        description,
        additionalData,
        status: "waiting",
      },
    });

    await tx.queue.update({
      where: { id: queue.id },
      data: { waitingCount: { increment: 1 } },
    });

    return ticket;
  });
}

export async function createTicket(
  serviceId: string,
  customerName?: string,
  customerPhone?: string,
  studentNumber?: string,
  department?: string,
  course?: string,
  email?: string,
  description?: string,
  additionalData?: any
) {
  const queue = await getOrCreateTodayQueue(serviceId);

  try {
    return await _attemptCreateTicket(
      queue, serviceId, customerName, customerPhone,
      studentNumber, department, course, email, description, additionalData
    );
  } catch (err: any) {
    // Retry once on unique-constraint violation (concurrent ticket creation race)
    const isConstraintError =
      err?.code === "P2002" ||
      err?.message?.includes("Unique constraint") ||
      err?.message?.includes("UNIQUE constraint failed");

    if (isConstraintError) {
      return await _attemptCreateTicket(
        queue, serviceId, customerName, customerPhone,
        studentNumber, department, course, email, description, additionalData
      );
    }
    throw err;
  }
}
