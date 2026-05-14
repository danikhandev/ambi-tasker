import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/stats
 * Fetches real-time platform statistics for public display.
 */
export async function GET(req: NextRequest) {
  try {
    // Fetch real-time counts
    const realUserCount = await prisma.user.count();
    
    // Fetch settings for manual base number and pattern
    const settings = await prisma.adminSetting.findFirst() as any;
    
    const baseCount = settings?.trustedUsersCount || 0;
    const pattern = settings?.trustedBadgeText || "Trusted by {count} happy customers";
    
    const totalDisplayCount = realUserCount + baseCount;
    
    // Support localization if needed via query param
    const lang = req.nextUrl.searchParams.get("lang") || "en";
    
    // Basic formatting
    let formattedCount = totalDisplayCount.toLocaleString();
    if (totalDisplayCount >= 1000) {
      formattedCount = (totalDisplayCount / 1000).toFixed(1) + "k+";
    }

    const badgeText = pattern.replace("{count}", formattedCount);

    return NextResponse.json({
      success: true,
      data: {
        count: totalDisplayCount,
        formattedCount,
        badgeText,
        realCount: realUserCount
      }
    });
  } catch (error: any) {
    logger.error("Public Stats API Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        data: { 
          badgeText: "Trusted by 10,000+ people",
          formattedCount: "10k+"
        } 
      },
      { status: 200 } // Return fallback data even on error for UI stability
    );
  }
}
