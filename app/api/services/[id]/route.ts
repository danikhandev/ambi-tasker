import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/services/[id] — Get single service details
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: service });
  } catch (error: unknown) {
    logger.error("Service details GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch service details" },
      { status: 500 }
    );
  }
}
