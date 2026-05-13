import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/settings — Get current user and provider settings
 */
export async function GET(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.user.id },
      include: {
        providerProfile: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
    }

    const dbUserAny = dbUser as any;
    return NextResponse.json({
      success: true,
      settings: dbUserAny.settings ? (typeof dbUserAny.settings === 'string' ? JSON.parse(dbUserAny.settings) : dbUserAny.settings) : {},
      providerSettings: dbUserAny.providerProfile?.settings ? (typeof dbUserAny.providerProfile.settings === 'string' ? JSON.parse(dbUserAny.providerProfile.settings) : dbUserAny.providerProfile.settings) : {},
    });
  } catch (error: unknown) {
    logger.error("Settings fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch settings" }, { status: 500 });
  }
}

/**
 * PATCH /api/user/settings — Update current user's preferences
 */
export async function PATCH(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const body = await req.json();
    const { 
      type, // 'USER' or 'PROVIDER'
      settings
    } = body;

    if (!settings || typeof settings !== 'object') {
        return NextResponse.json({ success: false, error: "Invalid settings payload" }, { status: 400 });
    }

    if (type === 'PROVIDER') {
        // Find provider profile
        const providerProfile = await prisma.providerProfile.findUnique({ where: { userId: guard.user.id } });
        if (!providerProfile) {
             return NextResponse.json({ success: false, error: "Provider profile not found" }, { status: 404 });
        }
        
        const providerProfileAny = providerProfile as any;
        let existingSettings = providerProfileAny.settings ? (typeof providerProfileAny.settings === 'string' ? JSON.parse(providerProfileAny.settings) : providerProfileAny.settings) : {};
        const mergedSettings = { ...existingSettings, ...settings };

        await prisma.providerProfile.update({
            where: { userId: guard.user.id },
            data: { settings: mergedSettings } as any
        });

        return NextResponse.json({ success: true, message: "Provider settings updated", settings: mergedSettings });
    } else {
        // User settings
        const user = await prisma.user.findUnique({ where: { id: guard.user.id } });
        const userAny = user as any;
        let existingSettings = userAny?.settings ? (typeof userAny.settings === 'string' ? JSON.parse(userAny.settings) : userAny.settings) : {};
        const mergedSettings = { ...existingSettings, ...settings };

        await prisma.user.update({
            where: { id: guard.user.id },
            data: { settings: mergedSettings } as any
        });

        return NextResponse.json({ success: true, message: "User settings updated", settings: mergedSettings });
    }
  } catch (error: unknown) {
    logger.error("Settings update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 });
  }
}
