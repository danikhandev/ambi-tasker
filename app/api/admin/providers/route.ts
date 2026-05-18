import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAdminAuth } from "@/utils/admin-auth";
import { getSignedUrl, BUCKETS } from "@/services/storage";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/providers
 * 
 * Fetches provider details including their image URLs.
 * Private KYC images are generated as temporary signed URLs for secure admin viewing.
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "providers.manage");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const generateUrl = async (storedPath: string | null): Promise<string | null> => {
      if (!storedPath) return null;
      
      let relativePath = storedPath;
      if (storedPath.startsWith("http://") || storedPath.startsWith("https://")) {
        if (storedPath.includes("/kyc-documents/")) {
          const parts = storedPath.split("/kyc-documents/");
          if (parts.length > 1) {
            relativePath = parts[1];
          }
        } else {
          return storedPath;
        }
      }

      if (relativePath.startsWith("/uploads/") || relativePath.startsWith("/verifications/")) {
        return relativePath;
      }
      try {
        return await getSignedUrl(BUCKETS.KYC, relativePath, 3600);
      } catch (err) {
        logger.error(`Failed to generate signed URL for: ${relativePath}`, err);
        return null;
      }
    };

    if (id) {
      const provider = await prisma.user.findUnique({
        where: { id, role: "PROVIDER" },
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          isActive: true,
          providerProfile: {
            select: {
              cnicFrontUrl: true,
              cnicBackUrl: true,
              selfieUrl: true,
              verificationStatus: true,
              professionalTitle: true,
            }
          }
        }
      });

      if (!provider) {
        return NextResponse.json({ success: false, error: "Provider not found" }, { status: 404 });
      }

      const cnicFront = await generateUrl(provider.providerProfile?.cnicFrontUrl || null);
      const cnicBack = await generateUrl(provider.providerProfile?.cnicBackUrl || null);
      const selfie = await generateUrl(provider.providerProfile?.selfieUrl || null);

      return NextResponse.json({
        success: true,
        data: {
          id: provider.id,
          name: provider.name,
          email: provider.email,
          status: provider.providerProfile?.verificationStatus || "PENDING",
          isActive: provider.isActive,
          profileImage: provider.profileImage,
          documents: {
            cnicFront,
            cnicBack,
            selfieWithCnic: selfie
          }
        }
      });
    }

    // List all providers (limited for performance, realistically should use pagination)
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);

    const providers = await prisma.user.findMany({
      where: { role: "PROVIDER" },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        isActive: true,
        providerProfile: {
          select: {
            cnicFrontUrl: true,
            cnicBackUrl: true,
            selfieUrl: true,
            verificationStatus: true,
            professionalTitle: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    });

    const total = await prisma.user.count({ where: { role: "PROVIDER" } });

    // Generate signed URLs concurrently for the page
    const formattedProviders = await Promise.all(
      providers.map(async (provider) => {
        const [cnicFront, cnicBack, selfie] = await Promise.all([
          generateUrl(provider.providerProfile?.cnicFrontUrl || null),
          generateUrl(provider.providerProfile?.cnicBackUrl || null),
          generateUrl(provider.providerProfile?.selfieUrl || null)
        ]);

        return {
          id: provider.id,
          name: provider.name,
          email: provider.email,
          status: provider.providerProfile?.verificationStatus || "PENDING",
          isActive: provider.isActive,
          profileImage: provider.profileImage,
          documents: {
            cnicFront,
            cnicBack,
            selfieWithCnic: selfie
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: formattedProviders,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });

  } catch (error: unknown) {
    logger.error("Admin providers GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch providers" },
      { status: 500 }
    );
  }
}
