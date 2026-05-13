import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { dispatchNotification } from "@/services/notifications/dispatcher";
import { logger } from "@/utils/logger";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/forgot-password
 * Initiates the password reset process by generating an OTP and sending it via email.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Security best practice: Don't reveal if a user exists
    // But for this specific implementation, we'll return success to avoid user enumeration
    // but only send email if user exists.
    if (!user) {
      logger.info(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({ 
        success: true, 
        message: "If an account exists with this email, you will receive a reset code." 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Generate secure reset token as backup
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user with reset info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtp: otp,
        resetOtpExpiry: otpExpiry,
        resetToken: resetToken,
        resetTokenExpiry: resetTokenExpiry,
      },
    });

    // Send Email
    await dispatchNotification({
      to: user.email,
      name: user.name,
      eventName: "PASSWORD_RESET",
      metadata: { otp },
    });

    return NextResponse.json({
      success: true,
      message: "Reset code sent successfully.",
    });
  } catch (error: any) {
    logger.error("Forgot password request error:", error);
    return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 });
  }
}
