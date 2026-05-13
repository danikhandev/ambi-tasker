import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAdminAuth } from "@/utils/admin-auth";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "settings.manage");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const settings = await prisma.systemSetting.findMany();
    
    // Map to key-value object
    const config = settings.reduce((acc, curr) => {
       acc[curr.key] = curr.value;
       return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({ success: true, config });
  } catch (error: unknown) {
    logger.error("Config GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch config" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "settings.manage");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { settings } = body; // Expected { key: value, key2: value2 }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ success: false, error: "Invalid settings payload" }, { status: 400 });
    }

    const upserts = Object.entries(settings).map(([key, value]) => {
      return prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    });

    await Promise.all(upserts);

    logger.info(`Admin ${admin.email} updated system settings`);

    return NextResponse.json({ success: true, message: "Settings updated successfully" });
  } catch (error: unknown) {
    logger.error("Config POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to save config" }, { status: 500 });
  }
}
