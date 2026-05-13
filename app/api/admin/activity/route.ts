import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/utils/admin-auth";
import { prisma } from "@/services/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await getAdminAuth(req);
  if (!admin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  try {
    const logs = await prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        admin: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error("Failed to fetch admin logs:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch logs" }, { status: 500 });
  }
}
