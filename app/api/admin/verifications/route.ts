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
    const { getSignedUrl, BUCKETS } = await import("@/services/storage");
    const providers = await Promise.all(
      rawProviders.map(async (p) => {
        const kycDocs = {
          cnicFront: p.cnicFrontUrl ? await getSignedUrl(BUCKETS.KYC, p.cnicFrontUrl).catch(() => null) : null,
          cnicBack: p.cnicBackUrl ? await getSignedUrl(BUCKETS.KYC, p.cnicBackUrl).catch(() => null) : null,
          selfie: p.selfieUrl ? await getSignedUrl(BUCKETS.KYC, p.selfieUrl).catch(() => null) : null,
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