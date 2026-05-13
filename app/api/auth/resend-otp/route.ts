import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { createAndSendOtp } from "@/services/auth/otp-service";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Don't reveal whether the email exists
      return NextResponse.json({
        success: true,
        message: "If an account exists, a verification code has been sent.",
      });
    }

    if (user.isEmailVerified) {
      return NextResponse.json(
        { success: false, error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Rate limit: check if an OTP was sent in the last 60 seconds
    const recentOtp = await prisma.otpCode.findFirst({
      where: {
        identifier: normalizedEmail,
        type: "EMAIL_VERIFY",
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentOtp) {
      return NextResponse.json(
        { success: false, error: "Please wait 60 seconds before requesting a new code" },
        { status: 429 }
      );
    }

    // ─── Generate and Send OTP via Service ──────────────────────
    const otpResult = await createAndSendOtp(normalizedEmail, "EMAIL_VERIFY", user.name);

    if (!otpResult.success) {
      throw new Error(otpResult.error || "Failed to deliver code");
    }

    return NextResponse.json({
      success: true,
      message: "A new verification code has been sent to your email.",
    });
  } catch (error: unknown) {
    logger.error("Resend OTP error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resend code" },
      { status: 500 }
    );
  }
}
