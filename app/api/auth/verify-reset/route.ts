import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/verify-reset
 * Verifies the OTP provided by the user.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, error: "Email and OTP are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      return NextResponse.json({ success: false, error: "Invalid or expired reset request" }, { status: 400 });
    }

    // Check if OTP matches
    if (user.resetOtp !== otp) {
      return NextResponse.json({ success: false, error: "Incorrect verification code" }, { status: 400 });
    }

    // Check if expired
    if (new Date() > user.resetOtpExpiry) {
      return NextResponse.json({ success: false, error: "Reset code has expired" }, { status: 400 });
    }

    // Success - provide the reset token to the frontend for the final step
    // This adds a layer of security ensuring the reset-password step is authorized by this verification
    return NextResponse.json({
      success: true,
      message: "Code verified successfully.",
      resetToken: user.resetToken, // Used to authorize the password update
    });
  } catch (error: any) {
    logger.error("Verify reset error:", error);
    return NextResponse.json({ success: false, error: "Failed to verify code" }, { status: 500 });
  }
}
