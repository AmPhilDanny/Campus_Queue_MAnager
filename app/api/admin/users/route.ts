import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { isSuperAdmin } from "@/lib/admin-auth";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admins = await prisma.admin.findMany({
    include: { office: true },
    orderBy: { createdAt: "desc" },
  });

  // Remove passwords from response
  const safeAdmins = admins.map(({ password, ...rest }) => rest);
  return NextResponse.json(safeAdmins);
}

export async function POST(req: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { email, password, role, officeId } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        role,
        officeId: officeId || null,
      },
    });

    const { password: _, ...safeAdmin } = admin;
    return NextResponse.json(safeAdmin);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id, email, password, role, officeId } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing admin ID" }, { status: 400 });
    }

    const data: any = {
      email,
      role,
      officeId: officeId || null,
    };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const admin = await prisma.admin.update({
      where: { id },
      data,
    });

    const { password: _, ...safeAdmin } = admin;
    return NextResponse.json(safeAdmin);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update admin" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing admin ID" }, { status: 400 });
    }

    await prisma.admin.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete admin" }, { status: 500 });
  }
}
