import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";
import { uploadFile, getSignedUrl, BUCKETS } from "@/services/storage";
import { KycEngine } from "@/services/kyc/engine";

export const dynamic = "force-dynamic";

/**
 * KYC Submission & Verification Route
 * 
 * Implements strict identity verification for Ambi Tasker providers.
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    if (guard.user.role !== "PROVIDER") {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    const formData = await req.formData();
    const cnicFront = formData.get("cnicFront") as File;
    const cnicBack = formData.get("cnicBack") as File;
    const selfie = formData.get("selfie") as File;
    const cnicNumber = formData.get("cnicNumber") as string;

    // 1. Image Validation
    if (!cnicFront || !cnicBack || !selfie || !cnicNumber) {
      return NextResponse.json({ success: false, error: "Missing required KYC data" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of [cnicFront, cnicBack, selfie]) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ success: false, error: `Invalid file type: ${file.name}. Only JPG/PNG allowed.` }, { status: 400 });
      }
      if (file.size > maxSize) {
        return NextResponse.json({ success: false, error: `File too large: ${file.name}` }, { status: 400 });
      }
    }

    const userId = guard.user.id;

    // 2. Secure Storage Upload
    const uploadTasks = [
      uploadFile(BUCKETS.KYC, `providers/${userId}/kyc/cnic-front.jpg`, cnicFront, cnicFront.type),
      uploadFile(BUCKETS.KYC, `providers/${userId}/kyc/cnic-back.jpg`, cnicBack, cnicBack.type),
      uploadFile(BUCKETS.KYC, `providers/${userId}/kyc/selfie.jpg`, selfie, selfie.type),
    ];

    const results = await Promise.all(uploadTasks);
    
    if (!results[0]?.path || !results[1]?.path || !results[2]?.path) {
      throw new Error("One or more files failed to upload");
    }

    // 3. Automated Verification Engine (Isolated Logic)
    const verification = await KycEngine.verify(userId, {
      front: results[0].path,
      back: results[1].path,
      selfie: results[2].path
    }, cnicNumber);

    // 4. Update Initial Record to mark submission
    await prisma.providerProfile.update({
        where: { userId },
        data: { kycSubmittedAt: new Date() }
    });

    // 5. Output Response (Standardized)
    return NextResponse.json(verification);

  } catch (error: any) {
    logger.error("KYC verification error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to process KYC",
        kycStatus: "REJECTED",
        result: "FAIL"
      },
      { status: 500 }
    );
  }
}

/**
 * Status Inquiry Route
 */
export async function GET(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const profile = await prisma.providerProfile.findUnique({
      where: { userId: guard.user.id },
      select: {
        verificationStatus: true,
        kycConfidenceScore: true,
        rejectionReason: true,
        kycSubmittedAt: true,
        cnicNumber: true
      }
    });

    if (!profile) return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });

    return NextResponse.json({ 
      providerId: guard.user.id,
      kycStatus: profile.verificationStatus,
      confidenceScore: profile.kycConfidenceScore || 0,
      result: profile.verificationStatus === "VERIFIED" ? "PASS" : 
              (profile.verificationStatus === "REJECTED" ? "FAIL" : "PENDING"),
      message: profile.rejectionReason || "Verification Status retrieved",
      nextAction: profile.verificationStatus === "REJECTED" ? "RE_UPLOAD_DOCUMENTS" : "NONE"
    });
  } catch (error: any) {
    logger.error("KYC GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch KYC status" }, { status: 500 });
  }
}
