import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { adminGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const guard = await adminGuard(req);
    if (!guard.success) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settings = await prisma.systemSetting.findMany();
    const formatted = settings.reduce((acc, obj) => ({ ...acc, [obj.key]: obj.value === 'true' ? true : obj.value === 'false' ? false : obj.value }), {} as any);

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: unknown) {
    logger.error("Admin Settings GET Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch system settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await adminGuard(req);
    if (!guard.success || guard.admin?.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized. Super Admin only." }, { status: 403 });
    }

    const { settings } = await req.json();
    if (!settings || typeof settings !== "object") {
        return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    for (const [key, value] of Object.entries(settings)) {
        await prisma.systemSetting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) },
        });
    }

    // Log the change
    await prisma.adminLog.create({
        data: {
            adminId: guard.admin.id,
            action: "UPDATE_SYSTEM_SETTINGS",
            targetType: "systemSetting",
            details: `Updated ${Object.keys(settings).length} settings.`,
        }
    });

    return NextResponse.json({ success: true, message: "System settings saved." });
  } catch (error: unknown) {
    logger.error("Admin Settings POST Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update system settings" }, { status: 500 });
  }
}
