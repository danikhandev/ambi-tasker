import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function GET(req: NextRequest) {
  try {
    const columns = await prisma.$queryRaw`
      SELECT attname as column_name, atttypid::regtype as data_type
      FROM pg_attribute
      WHERE attrelid = 'providers'::regclass
      AND attnum > 0
      AND NOT attisdropped;
    `;
    return NextResponse.json({ success: true, columns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
