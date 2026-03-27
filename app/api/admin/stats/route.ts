import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  
  const totalTickets = await prisma.ticket.count({
    where: { createdAt: { gte: new Date(today) } }
  });

  const servedCount = await prisma.ticket.count({
    where: { status: "served", createdAt: { gte: new Date(today) } }
  });

  const queues = await prisma.queue.findMany({
    where: { date: today }
  });

  const totalWait = queues.reduce((acc, q) => acc + q.avgWaitMs, 0);
  const avgWait = queues.length > 0 ? (totalWait / queues.length / 60000).toFixed(1) : 0;

  return NextResponse.json({ totalTickets, servedCount, avgWait });
}
