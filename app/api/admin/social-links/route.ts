import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { adminGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const guard = await adminGuard(req);
    if (!guard.success) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      return NextResponse.json({ success: true, data: defaultLinks });
    }
  } catch (error: unknown) {
    logger.error("Admin Social Links GET Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch social links" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await adminGuard(req);
    if (!guard.success || guard.admin?.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized. Super Admin only." }, { status: 403 });
    }

    const { links } = await req.json();
    
    if (!links || typeof links !== "object") {
        return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    // Validation
    const urlRegex = /^https:\/\/[^\s$.?#].[^\s]*$/;
    const errors: string[] = [];
    const validKeys = ["facebook", "instagram", "twitter", "linkedin", "youtube", "tiktok", "website"];
    
    const validatedLinks: any = {};
    
    for (const key of validKeys) {
        const val = links[key];
        if (val && val.trim() !== "") {
            if (!urlRegex.test(val)) {
                errors.push(`${key} must be a valid URL starting with https://`);
            } else {
                validatedLinks[key] = val.trim();
            }
        } else {
            validatedLinks[key] = "";
        }
    }

    if (errors.length > 0) {
        return NextResponse.json({ success: false, error: errors.join(", ") }, { status: 400 });
    }

    await prisma.systemSetting.upsert({
      where: { key: "social_media_links" },
      update: { value: JSON.stringify(validatedLinks) },
      create: { key: "social_media_links", value: JSON.stringify(validatedLinks) },
    });

    // Log the change
    await prisma.adminLog.create({
        data: {
            adminId: guard.admin.id,
            action: "UPDATE_SOCIAL_LINKS",
            targetType: "systemSetting",
            details: `Updated social media links: ${Object.keys(validatedLinks).filter(k => validatedLinks[k]).join(", ")}`,
        }
    });

    return NextResponse.json({ 
        status: "success",
        updatedFields: Object.keys(validatedLinks).filter(k => links[k] !== undefined),
        message: "Social media links updated successfully" 
    });
  } catch (error: unknown) {
    logger.error("Admin Social Links POST Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update social links" }, { status: 500 });
  }
}
