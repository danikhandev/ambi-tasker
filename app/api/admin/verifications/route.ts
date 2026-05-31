import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAdminAuth } from "@/utils/admin-auth";
import { logger } from "@/utils/logger";
import { sendNotification } from "@/services/notifications";
import { sendKYCStatusEmail } from "@/services/email/send";
import { logAdminAction } from "@/lib/admin-logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/verifications — List pending provider verifications
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "providers.manage");
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING_VERIFICATION";

    const rawProviders = await prisma.providerProfile.findMany({
      where: { verificationStatus: status as any },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
            createdAt: true,
          },
        },
        serviceAreas: true,
      },
      orderBy: { kycSubmittedAt: "desc" },
    });

    // Generate signed URLs for private documents
    const { getSignedUrl, getPublicUrl, BUCKETS } = await import("@/services/storage");

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    // Supabase stores KYC files as public-URL format even for private buckets.
    // We must detect those, extract the path, and issue a proper signed URL.
    const KYC_PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${BUCKETS.KYC}/`;
    const KYC_SIGN_PREFIX   = `${SUPABASE_URL}/storage/v1/object/sign/${BUCKETS.KYC}/`;

    // Helper to robustly resolve image URLs (24 h expiry for admin review sessions)
    const SIGNED_URL_TTL = 86400; // 24 hours
    const resolveImageUrl = async (path: string | null): Promise<string | null> => {
        if (!path) return null;

        // Already a signed URL → return as-is
        if (path.startsWith(KYC_SIGN_PREFIX)) return path;

        // Stored as a Supabase public URL for the private KYC bucket
        // → extract relative path and generate a real signed URL
        if (path.startsWith(KYC_PUBLIC_PREFIX)) {
            const relativePath = path.slice(KYC_PUBLIC_PREFIX.length);
            try {
                return await getSignedUrl(BUCKETS.KYC, relativePath, SIGNED_URL_TTL);
            } catch {
                return null;
            }
        }

        // Already some other absolute URL (seeded data, external CDN, etc.) → use as-is
        if (path.startsWith('http://') || path.startsWith('https://')) return path;

        // Relative / storage-path format → try signed URL, fall back to public
        try {
            return await getSignedUrl(BUCKETS.KYC, path, SIGNED_URL_TTL);
        } catch {
            try {
                return getPublicUrl(BUCKETS.KYC, path);
            } catch {
                return null;
            }
        }
    };

    const providers = await Promise.all(
      rawProviders.map(async (p) => {
        const kycDocs = {
          cnicFront: await resolveImageUrl(p.cnicFrontUrl),
          cnicBack: await resolveImageUrl(p.cnicBackUrl),
          selfie: await resolveImageUrl(p.selfieUrl),
        };
        return { ...p, kycDocs };
      })
    );

    return NextResponse.json({ success: true, data: providers });
  } catch (error: unknown) {
    logger.error("Verifications GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch verifications" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/verifications — Approve or reject a provider
 * Body: { providerId, action: 'VERIFIED' | 'REJECTED' }
 */
export async function PATCH(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "providers.manage");
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { providerId, action, reason } = await req.json();

    if (!providerId || !["VERIFIED", "REJECTED"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "providerId and action (VERIFIED/REJECTED) are required" },
        { status: 400 }
      );
    }

    const provider = await prisma.providerProfile.update({
      where: { id: providerId },
      data: { 
        verificationStatus: action as any, 
        rejectionReason: action === "REJECTED" ? reason : null,
        kycVerifiedAt: action === "VERIFIED" ? new Date() : null,
        isAvailable: action === "VERIFIED" ? true : false, // Auto-enable on approval
        ...(action === "VERIFIED" ? {
          user: {
            update: {
              isActive: true
            }
          }
        } : {})
      } as any,
      include: { user: true },
    }) as any; // Cast to any to bypass stale types until npx prisma generate is run

    // Notify the provider via push/in-app
    await sendNotification({
      userId: provider.userId,
      title: action === "VERIFIED" ? "KYC Approved ✓" : "KYC Rejected",
      body:
        action === "VERIFIED"
          ? "Your identity verification has been approved. You can now receive bookings!"
          : `Your identity verification was rejected: ${reason || "Please re-submit your documents."}`,
      type: "SYSTEM",
      actionUrl: "/provider/dashboard",
    });

    // Notify the provider via Email
    try {
      await sendKYCStatusEmail(
        provider.user.email,
        provider.user.name,
        action as "VERIFIED" | "REJECTED"
      );
    } catch (emailError) {
      logger.error("Failed to send KYC email:", emailError);
      // We don't fail the request if email fails, but we log it
    }

    logger.info(
      `Admin ${admin.email} ${action.toLowerCase()} provider: ${provider.user.email}`
    );

    // Create Audit Log
    await logAdminAction({
      adminId: admin.id,
      action: action === "VERIFIED" ? "KYC_APPROVE" : "KYC_REJECT",
      targetType: "PROVIDER",
      targetId: providerId,
      details: action === "VERIFIED" 
        ? `Provider KYC status changed to VERIFIED (Activated)` 
        : `Provider KYC status changed to REJECTED: ${reason || "No reason provided"}`
    });

    return NextResponse.json({
      success: true,
      message: `Provider ${action.toLowerCase()} successfully`,
      data: provider,
    });
  } catch (error: unknown) {
    logger.error("Verification update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update verification" },
      { status: 500 }
    );
  }
}