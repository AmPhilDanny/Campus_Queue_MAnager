import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (session?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as unknown as File | null;
    const type = formData.get("type") as string; // 'logo' or 'favicon'

    if (!file || typeof (file as any).arrayBuffer !== 'function') {
      return NextResponse.json({ error: "No valid file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');
    const mimeType = file.type || (type === 'favicon' ? 'image/x-icon' : 'image/png');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return NextResponse.json({ url: dataUrl });
  } catch (err: any) {
    return NextResponse.json({ error: "Upload failed: " + err.message }, { status: 500 });
  }
}
