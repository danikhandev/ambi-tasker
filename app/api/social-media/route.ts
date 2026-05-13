import { NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Try to fetch from the new centralized settings first
    const adminSettings = await prisma.adminSetting.findFirst({
      select: { socialLinks: true }
    });

    if (adminSettings && adminSettings.socialLinks && Array.isArray(adminSettings.socialLinks)) {
      const activeLinks = (adminSettings.socialLinks as any[]).filter(l => l.isActive);
      if (activeLinks.length > 0) {
        return NextResponse.json(activeLinks.map(l => ({
          platform: l.platform,
          url: l.url
        })));
      }
    }

    // Fallback to legacy collection if new settings are empty/missing
    const links = await prisma.socialMediaLink.findMany({
      where: { isActive: true },
      select: {
        platform: true,
        url: true,
      }
    });

    return NextResponse.json(links);
  } catch (error: unknown) {
    logger.error("Social Media Links GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch social links" }, { status: 500 });
  }
}
