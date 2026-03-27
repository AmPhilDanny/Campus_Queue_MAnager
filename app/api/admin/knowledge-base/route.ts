import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const session = await getAdminSession();
  if (session?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const kb = await prisma.knowledgeBase.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(kb);
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (session?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content, source, category } = await req.json();
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const item = await prisma.knowledgeBase.create({
      data: { content, source, category },
    });

    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create knowledge base entry" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getAdminSession();
  if (session?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, content, source, category, isActive } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const item = await prisma.knowledgeBase.update({
      where: { id },
      data: { content, source, category, isActive },
    });

    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getAdminSession();
  if (session?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    await prisma.knowledgeBase.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
