import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId");
  const dateParam = searchParams.get("date");

  if (!serviceId) {
    return NextResponse.json({ error: "serviceId required" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];
  const date = dateParam || today;

  const queue = await prisma.queue.findUnique({
    where: { serviceId_date: { serviceId, date } },
    include: {
      service: true,
      tickets: {
        orderBy: { ticketNumber: "asc" },
      },
    },
  });

  if (!queue) {
    // Return empty CSV
    const csv = "ticketNumber,status,createdAt,calledAt,servedAt,customerName,customerPhone\n";
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="queue-export-${date}.csv"`,
      },
    });
  }

  const escape = (val: string | null | undefined) => {
    if (val == null) return "";
    // Escape double quotes and wrap in quotes if needed
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const formatDate = (d: Date | null | undefined) => {
    if (!d) return "";
    return new Date(d).toISOString().replace("T", " ").substring(0, 19);
  };

  const headers = [
    "ticketNumber",
    "status",
    "createdAt",
    "calledAt",
    "servedAt",
    "customerName",
    "customerPhone",
  ];

  const rows = queue.tickets.map((t) =>
    [
      t.ticketNumber,
      escape(t.status),
      formatDate(t.createdAt),
      formatDate(t.calledAt),
      formatDate(t.servedAt),
      escape(t.customerName),
      escape(t.customerPhone),
    ].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  const serviceName = queue.service.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${serviceName}-${date}.csv"`,
    },
  });
}
