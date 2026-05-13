import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { adminGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/settings
 * Fetches the centralized platform settings.
 * Returns the first (and only) record or creates a default one.
 */
export async function GET(req: NextRequest) {
  try {
    const guard = await adminGuard(req);
    if (!guard.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await prisma.adminSetting.findFirst();

    // If no settings exist, create the default record
    if (!settings) {
      settings = await prisma.adminSetting.create({
        data: {
          appName: "AmbiTasker",
          platformFeePercentage: 10.0,
          currency: "PKR",
          timezone: "UTC+5",
          paymentGateway: "PayFast",
          isPaymentEnabled: true,
          socialLinks: [],
        },
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    logger.error("Admin Settings GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch platform settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings
 * Updates platform settings. Only SUPER_ADMIN can update.
 */
export async function PUT(req: NextRequest) {
  try {
    const guard = await adminGuard(req);
    if (!guard.success || guard.admin?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Super Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // PRODUCTION LEVEL: Strict allow-list of fields to prevent accidental or malicious injections
    const allowedFields = [
      "appName", "logoUrl", "faviconUrl", "footerCopyrightText", "platformFeePercentage", 
      "currency", "timezone", "paymentGateway", "isPaymentEnabled",
      "supportEmail", "supportPhone", "emailNotificationsEnabled",
      "pushNotificationsEnabled", "twoFactorAuthEnabled", "loginAlertsEnabled",
      "socialLinks"
    ];

    const updateData: any = {};
    const changes: any = {};
    
    let currentSettings = await prisma.adminSetting.findFirst();

    // If it doesn't exist, we'll create it later
    const existingData = currentSettings || {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Type validation
        if (field === "platformFeePercentage" && typeof body[field] !== "number") continue;
        if (field.endsWith("Enabled") && typeof body[field] !== "boolean") continue;
        
        // Tracking changes for Audit Log
        if (body[field] !== (existingData as any)[field]) {
          updateData[field] = body[field];
          changes[field] = {
            old: (existingData as any)[field],
            new: body[field]
          };
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true, message: "No changes detected", data: currentSettings });
    }

    let updatedSettings;
    if (!currentSettings) {
      updatedSettings = await prisma.adminSetting.create({
        data: updateData,
      });
    } else {
      updatedSettings = await prisma.adminSetting.update({
        where: { id: currentSettings.id },
        data: updateData,
      });
    }

    // Log the administrative action with specific details
    await prisma.adminLog.create({
      data: {
        adminId: guard.admin.id,
        action: "UPDATE_PLATFORM_SETTINGS",
        targetType: "AdminSetting",
        targetId: updatedSettings.id,
        details: JSON.stringify(changes),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Platform settings updated and logged",
      data: updatedSettings,
    });
  } catch (error: any) {
    logger.error("Admin Settings PUT Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update platform settings" },
      { status: 500 }
    );
  }
}
