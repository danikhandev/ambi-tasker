import { NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function GET() {
  try {
    const posters = await prisma.poster.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" }
    });
    return NextResponse.json({ success: true, data: posters });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
