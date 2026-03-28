import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const settingsArray = await (prisma as any).setting.findMany();
  const sensitiveKeys = ["google_ai_api_key"];
  
  const settings = settingsArray.reduce((acc: any, curr: any) => {
    if (!sensitiveKeys.includes(curr.key)) {
      acc[curr.key] = curr.value;
    }
    return acc;
  }, {} as Record<string, string>);

  return NextResponse.json(settings);
}
