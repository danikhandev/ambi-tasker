/**
 * OTP Service for AmbiTasker
 * Handles generation, storage, delivery, and verification of One-Time Passwords.
 */

import { prisma } from "@/services/prisma";
import { generateOTP } from "./utils";
import { sendOTPEmail, sendAdminOTPEmail, sendPasswordResetEmail } from "@/services/email/send";
import { logger } from "@/utils/logger";

export type OtpType = "EMAIL_VERIFY" | "PHONE_VERIFY" | "PASSWORD_RESET" | "ADMIN_LOGIN";

export interface OtpResponse {
  success: boolean;
  error?: string;
  expiresAt?: Date;
}

/**
 * Create and send an OTP to a user
 */
export async function createAndSendOtp(
  email: string,
  type: OtpType,
  name: string = "User"
): Promise<OtpResponse> {
  try {
    // 1. Generate 6-digit OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // 2. Store in database (Upsert or Create new)
    // We deactivate previous unused OTPs of the same type for this identifier
    await prisma.otpCode.updateMany({
      where: {
        identifier: email,
        type,
        used: false,
      },
      data: {
        used: true, // Mark as "used" or "cancelled" so only the latest one works
      },
    });

    await prisma.otpCode.create({
      data: {
        identifier: email,
        code,
        type,
        expiresAt,
      },
    });

    // 3. Send via Email
    let emailResult;
    if (type === "ADMIN_LOGIN") {
      emailResult = await sendAdminOTPEmail(email, name, code);
    } else if (type === "PASSWORD_RESET") {
      emailResult = await sendPasswordResetEmail(email, name, code);
    } else {
      emailResult = await sendOTPEmail(email, name, code);
    }

    if (!emailResult.success) {
      logger.error(`SMTP delivery failed for ${email}.`);
      
      if (process.env.NODE_ENV === "development") {
        console.log(`\n-----------------------------------------`);
        console.log(`🔑 DEBUG OTP [${type}] for ${email}: ${code}`);
        console.log(`-----------------------------------------\n`);
      }
      
      throw new Error("Failed to deliver OTP email");
    }

    logger.info(`OTP (${type}) sent to ${email}`);
    return { success: true, expiresAt };
  } catch (error: any) {
    logger.error(`Error in createAndSendOtp: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Verify an OTP provided by a user
 */
export async function verifyOtp(
  email: string,
  code: string,
  type: OtpType
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Find the latest unused OTP for this identifier and type
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        identifier: email,
        code,
        type,
        used: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return { success: false, error: "Invalid verification code" };
    }

    // 2. Check expiry
    if (new Date() > otpRecord.expiresAt) {
      return { success: false, error: "Verification code has expired" };
    }

    // 3. Mark as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    logger.info(`OTP (${type}) verified for ${email}`);
    return { success: true };
  } catch (error: any) {
    logger.error(`Error in verifyOtp: ${error.message}`);
    return { success: false, error: "Verification failed. Please try again." };
  }
}
