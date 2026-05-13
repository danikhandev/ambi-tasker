import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { adminGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

// GET all links for admin
export async function GET(req: NextRequest) {
  try {
    const guard = await adminGuard(req);
    if (!guard.success) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const links = await prisma.socialMediaLink.findMany({
      orderBy: { platform: "asc" }
    });

    return NextResponse.json({ success: true, data: links });
  } catch (error: unknown) {
    logger.error("Admin Social Media GET Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch social links" }, { status: 500 });
  }
}

// POST: Add new link
export async function POST(req: NextRequest) {
  try {
    const guard = await adminGuard(req);
    if (!guard.success || guard.admin?.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized. Super Admin only." }, { status: 403 });
    }

    const body = await req.json();
    const { platform, url, isActive } = body;

    if (!platform || !url) {
        return NextResponse.json({ error: "Platform and URL are required." }, { status: 400 });
    }

    // Validate URL
    const urlRegex = /^https:\/\/[^\s$.?#].[^\s]*$/;
    if (!urlRegex.test(url)) {
        return NextResponse.json({ error: "Invalid URL format. Must start with https://" }, { status: 400 });
    }

    // Prevent duplicate platforms
    const existing = await prisma.socialMediaLink.findUnique({
        where: { platform: platform.toLowerCase() }
    });

    if (existing) {
        return NextResponse.json({ error: `Platform '${platform}' already exists.` }, { status: 400 });
    }

    const newLink = await prisma.socialMediaLink.create({
      data: {
        platform: platform.toLowerCase(),
        url: url.trim(),
        isActive: isActive !== undefined ? isActive : true,
      }
    });

    // Log the change
    await prisma.adminLog.create({
        data: {
            adminId: guard.admin.id,
            action: "CREATE_SOCIAL_MEDIA_LINK",
            targetType: "SocialMediaLink",
            details: `Added ${platform}: ${url}`,
        }
    });

    return NextResponse.json({ success: true, data: newLink, message: "Social media link added successfully" });
  } catch (error: unknown) {
    logger.error("Admin Social Media POST Error:", error);
    return NextResponse.json({ success: false, error: "Failed to add social link" }, { status: 500 });
  }
}
