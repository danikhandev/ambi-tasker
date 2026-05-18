import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { logger } from "@/utils/logger";
import { isValidPassword } from "@/services/auth/utils";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/reset-password
 * Updates the user's password using a valid reset token.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, resetToken, newPassword } = await req.json();

    if (!email || !resetToken || !newPassword) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    if (!isValidPassword(newPassword)) {
      return NextResponse.json({ 
        success: false, 
        error: "Password must be at least 8 characters long" 
      }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.resetToken !== resetToken || !user.resetTokenExpiry) {
      return NextResponse.json({ success: false, error: "Invalid or expired reset session" }, { status: 400 });
    }

    // Check if token expired
    if (new Date() > user.resetTokenExpiry) {
      return NextResponse.json({ success: false, error: "Reset session has expired" }, { status: 400 });
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and CLEAR reset fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetOtp: null,
        resetOtpExpiry: null,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    logger.info(`Password successfully reset for user: ${normalizedEmail}`);

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. You can now log in.",
    });
  } catch (error: any) {
    logger.error("Reset password error:", error);
    return NextResponse.json({ success: false, error: "Failed to reset password" }, { status: 500 });
  }
}
