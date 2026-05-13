import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import crypto from "crypto";
import { logger } from "@/utils/logger";
import { prisma } from "@/services/prisma";
import { createAndSendOtp, verifyOtp } from "@/services/auth/otp-service";
import { comparePassword, JWT_SECRET_KEY } from "@/services/auth/utils";

export const dynamic = "force-dynamic";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function checkRateLimit(email: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(email);
  if (record && now < record.resetAt) {
    if (record.count >= MAX_ATTEMPTS) {
      return { allowed: false, retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000) };
    }
  }
  return { allowed: true };
}

function recordFailedAttempt(email: string) {
  const now = Date.now();
  const existing = loginAttempts.get(email);
  if (!existing || now >= existing.resetAt) {
    loginAttempts.set(email, { count: 1, resetAt: now + LOCKOUT_MS });
  } else {
    loginAttempts.set(email, { count: existing.count + 1, resetAt: existing.resetAt });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, otp, step = "credentials" } = body;

    if (!email) return NextResponse.json({ success: false, error: "Email required" }, { status: 400 });
    const normalizedEmail = email.toLowerCase().trim();

    const rateCheck = checkRateLimit(normalizedEmail);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: `Locked for ${rateCheck.retryAfterSeconds}s` }, { status: 429 });
    }

    console.log(`[ADMIN LOGIN] Normalized Email: "${normalizedEmail}"`);
    const adminRecord = await prisma.admin.findUnique({ where: { email: normalizedEmail } });
    
    if (!adminRecord) {
      console.log(`[ADMIN LOGIN] Admin record NOT found for email: "${normalizedEmail}"`);
      return NextResponse.json({ success: false, error: "Access denied: Record not found" }, { status: 403 });
    }

    console.log(`[ADMIN LOGIN] Admin record FOUND:`, { id: adminRecord.id, status: adminRecord.status });

    if (adminRecord.status !== "active") {
      console.log(`[ADMIN LOGIN] Admin account is INACTIVE`);
      return NextResponse.json({ success: false, error: "Account is inactive." }, { status: 403 });
    }

    if (step === "credentials") {
      if (!password) return NextResponse.json({ success: false, error: "Password required" }, { status: 400 });
      const trimmedPassword = typeof password === 'string' ? password.trim() : password;
      
      // ─── 2. STRICT ADMIN PASSWORD REQUIREMENT ──────────────────────
      const AUTHORIZED_PASSWORD = "dhambit..**";
      if (trimmedPassword !== AUTHORIZED_PASSWORD) {
        recordFailedAttempt(normalizedEmail);
        return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
      }

      // ─── Generate and Send OTP ──────────────────────────────────
      const otpResult = await createAndSendOtp(normalizedEmail, "ADMIN_LOGIN", adminRecord.name);

      if (!otpResult.success) {
        return NextResponse.json({ success: false, error: "Failed to deliver security code" }, { status: 500 });
      }

      return NextResponse.json({ success: true, requires2FA: true, message: "OTP sent to admin email" });
    }

    if (step === "2fa") {
      if (!otp) return NextResponse.json({ success: false, error: "OTP required" }, { status: 400 });
      
      // ─── Verify OTP via Service ──────────────────────────────────
      const verification = await verifyOtp(normalizedEmail, otp, "ADMIN_LOGIN");

      if (!verification.success) {
        return NextResponse.json({ 
          success: false, 
          error: verification.error === "Verification code has expired" ? "OTP expired, request again" : "Access denied: Invalid OTP" 
        }, { status: 401 });
      }

      const token = await new SignJWT({
        id: adminRecord.id,
        email: adminRecord.email,
        role: adminRecord.role,
        isAdmin: true,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("12h")
        .sign(JWT_SECRET_KEY);

      // ─── SYNC ADMIN TO USER TABLE (For Chat & Profile) ───────────
      let userRecord = await prisma.user.findUnique({ where: { email: adminRecord.email } });
      if (!userRecord) {
        userRecord = await prisma.user.create({
          data: {
            email: adminRecord.email,
            name: adminRecord.name || "Super Admin",
            role: "ADMIN",
            passwordHash: crypto.randomBytes(32).toString('hex'), // Randomized placeholder
            isEmailVerified: true,
            isActive: true
          }
        });
      }

      // Generate User Token (for standard site features)
      const userToken = await new SignJWT({
        userId: userRecord.id,
        email: userRecord.email,
        role: "ADMIN",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(JWT_SECRET_KEY);

      const response = NextResponse.json({
        success: true,
        admin: {
          id: adminRecord.id,
          email: adminRecord.email,
          name: adminRecord.name || "Administrator",
          role: adminRecord.role,
          permissions: adminRecord.permissions || [],
          requiresPasswordChange: adminRecord.requiresPasswordChange || false,
        },
      });

      // Set Admin Auth Cookie
      response.cookies.set("admin-auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 12,
        path: "/",
      });

      // Set User Auth Cookie (to enable Chat/Messages)
      response.cookies.set("auth-user-token", userToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ success: false, error: "Invalid Step" }, { status: 400 });
  } catch (error: any) {
    logger.error("Admin Login API Exception", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}