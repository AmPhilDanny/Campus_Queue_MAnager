import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
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
    const originalName = file.name || "unnamed-file";
    const extension = originalName.split('.').pop() || (type === 'favicon' ? 'ico' : 'png');
    const fileName = `${type}-${Date.now()}.${extension}`;
    const uploadDir = join(process.cwd(), "public", "uploads");
    
    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${fileName}`;
    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: "Upload failed: " + err.message }, { status: 500 });
  }
}
