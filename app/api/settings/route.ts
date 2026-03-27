import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const settingsArray = await (prisma as any).setting.findMany();
  const settings = settingsArray.reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  return NextResponse.json(settings);
}
