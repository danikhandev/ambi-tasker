import { NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.adminSetting.findFirst({
      select: {
        appName: true,
        logoUrl: true,
        faviconUrl: true,
        footerCopyrightText: true,
      },
    });

    if (!settings) {
      return NextResponse.json({
        appName: "AmbiTasker",
        logoUrl: null,
        faviconUrl: null,
      });
    }

    return NextResponse.json(settings);
  } catch (error: unknown) {
    logger.error("Branding GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch branding settings" },
      { status: 500 }
    );
  }
}
