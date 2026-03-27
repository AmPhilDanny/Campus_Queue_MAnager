import { NextResponse } from "next/server";
import { createTicket } from "@/lib/queue-logic";

export async function POST(req: Request) {
  try {
    const { 
      serviceId, 
      customerName, 
      customerPhone,
      studentNumber,
      department,
      course,
      email,
      description,
      additionalData
    } = await req.json();

    if (!serviceId) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
    }

    const ticket = await createTicket(
      serviceId, 
      customerName, 
      customerPhone,
      studentNumber,
      department,
      course,
      email,
      description,
      additionalData
    );
    return NextResponse.json(ticket);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
