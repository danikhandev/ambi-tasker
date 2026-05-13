import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { verifyOtp } from "@/services/auth/otp-service";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * API: /api/auth/verify
 * Description: Verifies the 6-digit OTP sent to the user's email.
 * If successful, activates the user account.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, code, type } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: "Email and verification code are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpType = type || "EMAIL_VERIFY";

    // 1. Verify OTP using the service
    const verifyResult = await verifyOtp(normalizedEmail, code, otpType);

    if (!verifyResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: verifyResult.error === "Verification code has expired" ? "OTP expired, request again" : "Access denied"
        },
        { status: 400 }
      );
    }

    // 2. Update User Activation Status
    if (otpType === "EMAIL_VERIFY") {
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          isEmailVerified: true,
          isActive: true, // Activate account upon email verification
        },
      });
      logger.info(`Account activated for: ${normalizedEmail}`);
    }

    return NextResponse.json({
      success: true,
      message: "Verification successful. Account activated.",
    });
  } catch (error: unknown) {
    logger.error("Verification API Error:", error);
    return NextResponse.json(
      { success: false, error: "System failed to process verification." },
      { status: 500 }
    );
  }
}
