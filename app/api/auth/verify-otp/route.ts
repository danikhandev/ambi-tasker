import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { logger } from "@/utils/logger";
import { verifyOtp } from "@/services/auth/otp-service";
import { sendWelcomeEmail } from "@/services/email/send";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and OTP code are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ─── Verify OTP via Service ──────────────────────────────────
    const verification = await verifyOtp(normalizedEmail, otp, "EMAIL_VERIFY");

    if (!verification.success) {
      return NextResponse.json(
        { success: false, error: verification.error || "Invalid or expired code" },
        { status: 400 }
      );
    }

    // ─── Mark user email as verified ─────────────────────────────
    const user = await prisma.user.update({
      where: { email: normalizedEmail },
      data: { isEmailVerified: true },
    });

    // ─── Send Welcome Email ──────────────────────────────────────
    try {
        await sendWelcomeEmail(user.email, user.name);
    } catch (err) {
        logger.error("Welcome email failed", err);
    }

    logger.info(`Email verified: ${normalizedEmail}`);

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error: unknown) {
    logger.error("OTP verification error:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
