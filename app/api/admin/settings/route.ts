import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settingsArray = await (prisma as any).setting.findMany();
  const settings = Object.fromEntries(settingsArray.map((s: any) => [s.key, s.value]));

  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isSuper = session.role === "SUPER_ADMIN";

  try {
    const data = await req.json();
    
    // Define which keys can be updated by non-super admins
    const allowedForAdmin = ["notification_template", "notification_enabled", "sms_webhook_url"];
    
    const updates = Object.entries(data)
      .filter(([key]) => isSuper || allowedForAdmin.includes(key))
      .map(([key, value]) => {
        return (prisma as any).setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      });

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid settings to update" }, { status: 400 });
    }

    await prisma.$transaction(updates);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
