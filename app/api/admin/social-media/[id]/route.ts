import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { adminGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = await adminGuard(req);
    if (!guard.success || guard.admin?.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized. Super Admin only." }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { platform, url, isActive } = body;

    const existing = await prisma.socialMediaLink.findUnique({
        where: { id }
    });

    if (!existing) {
        return NextResponse.json({ error: "Link not found." }, { status: 404 });
    }

    // If platform is changing, check uniqueness
    if (platform && platform.toLowerCase() !== existing.platform) {
        const platformExists = await prisma.socialMediaLink.findUnique({
            where: { platform: platform.toLowerCase() }
        });
        if (platformExists) {
            return NextResponse.json({ error: `Platform '${platform}' already exists.` }, { status: 400 });
        }
    }

    // Validate URL if changing
    if (url) {
        const urlRegex = /^https:\/\/[^\s$.?#].[^\s]*$/;
        if (!urlRegex.test(url)) {
            return NextResponse.json({ error: "Invalid URL format. Must start with https://" }, { status: 400 });
        }
    }

    const updated = await prisma.socialMediaLink.update({
      where: { id },
      data: {
        platform: platform ? platform.toLowerCase() : undefined,
        url: url ? url.trim() : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      }
    });

    // Log the change
    await prisma.adminLog.create({
        data: {
            adminId: guard.admin.id,
            action: "UPDATE_SOCIAL_MEDIA_LINK",
            targetType: "SocialMediaLink",
            details: `Updated ${updated.platform}`,
        }
    });

    return NextResponse.json({ success: true, data: updated, message: "Social media link updated successfully" });
  } catch (error: unknown) {
    logger.error("Admin Social Media PUT Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update social link" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = await adminGuard(req);
    if (!guard.success || guard.admin?.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized. Super Admin only." }, { status: 403 });
    }

    const { id } = params;

    const existing = await prisma.socialMediaLink.findUnique({
        where: { id }
    });

    if (!existing) {
        return NextResponse.json({ error: "Link not found." }, { status: 404 });
    }

    await prisma.socialMediaLink.delete({
      where: { id }
    });

    // Log the change
    await prisma.adminLog.create({
        data: {
            adminId: guard.admin.id,
            action: "DELETE_SOCIAL_MEDIA_LINK",
            targetType: "SocialMediaLink",
            details: `Deleted ${existing.platform}`,
        }
    });

    return NextResponse.json({ success: true, message: "Social media link deleted successfully" });
  } catch (error: unknown) {
    logger.error("Admin Social Media DELETE Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete social link" }, { status: 500 });
  }
}
