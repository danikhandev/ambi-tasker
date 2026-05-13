import { NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "social_media_links" },
    });

    const defaultLinks = {
      facebook: "",
      instagram: "",
      twitter: "",
      linkedin: "",
      youtube: "",
      tiktok: "",
      website: "",
    };

    if (!setting) {
      return NextResponse.json({ success: true, data: defaultLinks });
    }

    try {
      const parsedLinks = JSON.parse(setting.value);
      return NextResponse.json({ 
        success: true, 
        data: { ...defaultLinks, ...parsedLinks } 
      });
    } catch (e) {
      logger.error("Failed to parse social_media_links setting:", e);
      return NextResponse.json({ success: true, data: defaultLinks });
    }
  } catch (error: unknown) {
    logger.error("Social Links GET Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch social links" }, { status: 500 });
  }
}
