import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAdminAuth } from "@/utils/admin-auth";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "providers.manage");
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const db = prisma as any;
    
    // Get count of providers waiting for verification
    const count = await db.providerProfile.count({
      where: {
        verificationStatus: {
          in: ["PENDING", "UNDER_REVIEW"]
        }
      }
    });

    return NextResponse.json({ success: true, count });
  } catch (error: unknown) {
    logger.error("Pending verification count GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pending verification count" },
      { status: 500 }
    );
  }
}
