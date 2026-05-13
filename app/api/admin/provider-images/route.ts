import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/utils/admin-auth";
import { prisma } from "@/services/prisma";
import { getSignedUrl, BUCKETS } from "@/services/storage";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/provider-images
 * 
 * Generates time-limited signed URLs for provider KYC documents.
 * This keeps private bucket images secure — URLs expire after 1 hour.
 * 
 * Body: { providerProfileId: string }
 * Returns: { cnicFront, cnicBack, selfie, profileImage } as signed URLs
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "providers.manage");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { providerProfileId } = await req.json();

    if (!providerProfileId) {
      return NextResponse.json(
        { success: false, error: "providerProfileId is required" },
        { status: 400 }
      );
    }

    const provider = await prisma.providerProfile.findUnique({
      where: { id: providerProfileId },
      select: {
        cnicFrontUrl: true,
        cnicBackUrl: true,
        selfieUrl: true,
        user: {
          select: {
            profileImage: true,
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Provider not found" },
        { status: 404 }
      );
    }

    // Generate signed URLs for private KYC documents (1 hour expiry)
    const generateUrl = async (storedPath: string | null): Promise<string | null> => {
      if (!storedPath) return null;

      // If already a full URL (public URL or external), return as-is
      if (storedPath.startsWith("http://") || storedPath.startsWith("https://")) {
        return storedPath;
      }
      // Local upload paths
      if (storedPath.startsWith("/uploads/") || storedPath.startsWith("/verifications/")) {
        return storedPath;
      }

      // Generate signed URL from Supabase private bucket
      try {
        return await getSignedUrl(BUCKETS.KYC, storedPath, 3600);
      } catch (err) {
        logger.error(`Failed to generate signed URL for: ${storedPath}`, err);
        return null;
      }
    };

    const [cnicFront, cnicBack, selfie] = await Promise.all([
      generateUrl(provider.cnicFrontUrl),
      generateUrl(provider.cnicBackUrl),
      generateUrl(provider.selfieUrl),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        cnicFront,
        cnicBack,
        selfie,
        profileImage: provider.user?.profileImage || null,
      },
    });
  } catch (error: unknown) {
    logger.error("Provider images error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate image URLs" },
      { status: 500 }
    );
  }
}
