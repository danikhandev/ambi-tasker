import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";
import { sendNotification } from "@/services/notifications";
import { KycEngine } from "@/services/kyc/engine";

export const dynamic = "force-dynamic";

/**
 * POST /api/provider/verify — Submit KYC documents for verification
 * Accepts JSON with pre-uploaded Supabase image URLs and personal/professional details
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) {
      console.error("KYC: Guard error:", guard.error);
      return guard.error;
    }

    if (guard.user.role !== "PROVIDER") {
      console.error("KYC: User is not a provider:", guard.user.role);
      return NextResponse.json(
        { success: false, error: "Only providers can submit verification documents" },
        { status: 403 }
      );
    }

    const provider = await prisma.providerProfile.findUnique({
      where: { userId: guard.user.id },
    });

    if (!provider) {
      console.error("KYC: Provider profile not found for user:", guard.user.id);
      return NextResponse.json(
        { success: false, error: "Provider profile not found" },
        { status: 404 }
      );
    }

    if (provider.verificationStatus === "VERIFIED") {
      return NextResponse.json(
        { success: false, error: "Your account is already verified" },
        { status: 400 }
      );
    }

    const body = await req.json();
    console.log("KYC: Received submission for provider:", provider.id);
    const {
      selfieImage,
      cnicFrontImage,
      cnicBackImage,
      firstName,
      lastName,
      phoneNumber,
      gender,
      district,
      city,
      area,
      address,
      experience,
      category,
      bio,
      cnicNumber,
      checkOnly = false
    } = body;

    // Validate required image URLs
    if (!selfieImage || !cnicFrontImage || !cnicBackImage) {
      console.error("KYC: Missing images");
      return NextResponse.json(
        { success: false, error: "CNIC front, CNIC back, and selfie images are all required" },
        { status: 400 }
      );
    }

    // Validate URLs are from trusted sources (Supabase storage or local uploads)
    const trustedDomains = ["supabase.co", "supabase.in", "supabase.com", "localhost"];
    for (const url of [selfieImage, cnicFrontImage, cnicBackImage]) {
      // Allow local upload paths (e.g., /uploads/verifications/...)
      if (url.startsWith("/uploads/") || url.startsWith("/verifications/")) {
        continue;
      }
      try {
        const parsedUrl = new URL(url);
        const isTrusted = trustedDomains.some((d) => parsedUrl.hostname === d || parsedUrl.hostname.endsWith(d));
        if (!isTrusted) {
          console.error("KYC: Untrusted domain:", parsedUrl.hostname);
          return NextResponse.json(
            { success: false, error: "Image URLs must be from authorized storage" },
            { status: 400 }
          );
        }
      } catch (e) {
        console.error("KYC: Invalid URL format:", url);
        return NextResponse.json(
          { success: false, error: "Invalid image URL format" },
          { status: 400 }
        );
      }
    }

    // Update user personal details
    if (!checkOnly) {
        const userUpdateData: Record<string, unknown> = {};
        if (firstName && lastName) userUpdateData.name = `${firstName} ${lastName}`.trim();
        if (phoneNumber) userUpdateData.phone = phoneNumber;
        if (gender) userUpdateData.gender = gender.toUpperCase();
        if (address) userUpdateData.address = address;

        if (Object.keys(userUpdateData).length > 0) {
        await prisma.user.update({
            where: { id: guard.user.id },
            data: userUpdateData,
        });
        }

        // Update provider profile with KYC documents and professional details
        const providerUpdateData: Record<string, unknown> = {
        cnicFrontUrl: cnicFrontImage,
        cnicBackUrl: cnicBackImage,
        selfieUrl: selfieImage,
        verificationStatus: "PENDING",
        };

        if (bio) providerUpdateData.serviceDescription = bio;
        if (category) providerUpdateData.professionalTitle = category;
        if (experience) {
        const expMap: Record<string, number> = {
            "< 1 Year": 0,
            "1–3 Years": 2,
            "3–5 Years": 4,
            "5+ Years": 6,
        };
        providerUpdateData.experienceYears = expMap[experience] ?? 0;
        }

        await prisma.providerProfile.update({
        where: { id: provider.id },
        data: providerUpdateData,
        });
    }

    // Run AI KYC Verification
    let kycResult;
    try {
        kycResult = await KycEngine.verify(guard.user.id, {
            front: cnicFrontImage,
            back: cnicBackImage,
            selfie: selfieImage
        }, cnicNumber, checkOnly);
    } catch (engineError) {
        logger.error("KYC Engine failed during verification:", engineError);
        // Fallback to manual review if engine fails
        await prisma.providerProfile.update({
          where: { id: provider.id },
          data: { verificationStatus: "UNDER_REVIEW" },
        });
        kycResult = {
            kycStatus: "UNDER_REVIEW",
            message: "Submitted for manual review due to processing delay."
        };
    }

    // Notify admins
    try {
      await sendNotification({
        title: "New KYC Submission",
        body: `${guard.user.name || guard.user.email} has submitted verification documents for review. Status: ${kycResult.kycStatus}`,
        type: "SYSTEM",
        actionUrl: "/admin/verifications",
      });
    } catch (notifyError) {
      console.warn("KYC: Notification failed (non-blocking):", notifyError);
    }

    logger.info(`KYC documents submitted by ${guard.user.email}. Status: ${kycResult.kycStatus}`);

    return NextResponse.json({
      success: true,
      message: kycResult.message || "Documents submitted successfully.",
      kycStatus: kycResult.kycStatus
    });
  } catch (error: any) {
    console.error("KYC: Fatal submission error:", error);
    logger.error("KYC submission error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit documents" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/provider/verify — Get current verification status
 */
export async function GET(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const provider = await prisma.providerProfile.findUnique({
      where: { userId: guard.user.id },
      select: {
        verificationStatus: true,
        cnicFrontUrl: true,
        cnicBackUrl: true,
        selfieUrl: true,
      },
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Provider profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        status: provider.verificationStatus,
        hasDocuments: !!(provider.cnicFrontUrl && provider.cnicBackUrl && provider.selfieUrl),
      },
    });
  } catch (error: unknown) {
    logger.error("KYC status error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check status" },
      { status: 500 }
    );
  }
}