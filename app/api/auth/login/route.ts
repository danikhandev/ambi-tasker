import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { comparePassword, generateToken } from "@/services/auth/utils";
import { setAuthCookie, AUTH_COOKIE } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

// Rate limiting store (in-memory, resets on server restart)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

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
    const { email, password } = body;

    // ─── Validation ──────────────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ─── Rate limit check ─────────────────────────────────────────
    const rateCheck = checkRateLimit(normalizedEmail);
    if (!rateCheck.allowed) {
      logger.warn(`Rate limit hit for login attempt: ${normalizedEmail}`);
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed attempts. Please try again in ${Math.ceil((rateCheck.retryAfterSeconds || 900) / 60)} minutes.`,
        },
        { status: 429 }
      );
    }

    // ─── Find user in database ───────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        providerProfile: true,
        district: true,
        area: true,
      },
    });

    // STEP 1 & 2: Check if User Exists
    console.log("USER FOUND:", user);

    if (!user) {
      recordFailedAttempt(normalizedEmail);
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // ─── Check account status ────────────────────────────────────
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: "Account has been deactivated. Contact support." },
        { status: 403 }
      );
    }

    // ─── Verify password ─────────────────────────────────────────
    // STEP 3: Password Check (Hardened)
    const passwordValid = await comparePassword(password, user.passwordHash);
    if (!passwordValid) {
      recordFailedAttempt(normalizedEmail);
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // STEP 5: Fix Role Issues
    if (!user.role) {
      return NextResponse.json(
        { success: false, error: "Role missing or account corrupted" },
        { status: 403 }
      );
    }

    // ─── Check email verification ────────────────────────────────
    if (!user.isEmailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "Email not verified. Please verify your email first.",
          code: "EMAIL_NOT_VERIFIED",
          email: user.email,
        },
        { status: 403 }
      );
    }

    // ─── Generate JWT ────────────────────────────────────────────
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      isProvider: user.role === "PROVIDER",
    }, "7d");

    // ─── Build response user object ──────────────────────────────
    const responseUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      profileImage: user.profileImage,
      isEmailVerified: user.isEmailVerified,
      district: user.district?.name || null,
      area: user.area?.name || null,
      providerProfile: user.providerProfile
        ? {
            id: user.providerProfile.id,
            professionalTitle: user.providerProfile.professionalTitle,
            verificationStatus: user.providerProfile.verificationStatus,
            rating: user.providerProfile.rating,
            isAvailable: user.providerProfile.isAvailable,
          }
        : null,
    };

    logger.info(`Login success: ${user.email} (role: ${user.role})`);

    // ─── Set cookie and respond ──────────────────────────────────
    const response = NextResponse.json({
      success: true,
      user: responseUser,
      token: token,
    });

    return setAuthCookie(response, token);
  } catch (error: any) {
    logger.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again.", details: error?.message || error?.toString() },
      { status: 500 }
    );
  }
}