import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { hashPassword, isValidEmail, isValidPassword, isValidPhone } from "@/services/auth/utils";
import { createAndSendOtp } from "@/services/auth/otp-service";
import { logger } from "@/utils/logger";
import { AVAILABILITY_MESSAGE } from "@/constants/locationConfig";
import { validateLocationHierarchy } from "@/utils/location-validation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, role, phone, districtId, cityId, areaId, category, cnic, latitude, longitude, address, locationCity, locationArea, serviceRadius } = body;

    // ─── Validation ──────────────────────────────────────────────
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: "All fields are required (email, password, firstName, lastName)" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Strong password required: 8+ chars, number, and special character",
          code: "AUTH_PASSWORD_WEAK"
        },
        { status: 400 }
      );
    }

    if (phone && !isValidPhone(phone)) {
      return NextResponse.json(
        { success: false, error: "Invalid Pakistani phone number format", code: "AUTH_PHONE_INVALID" },
        { status: 400 }
      );
    }

    // ─── Security: Block admin creation via public API ───────────
    if (role === "admin" || role === "ADMIN" || role === "SUPER_ADMIN") {
      logger.warn(`Security: Public attempt to register admin (${normalizedEmail})`);
      return NextResponse.json(
        { success: false, error: "Access Denied: Admin accounts cannot be created via public registration.", code: "AUTH_ROLE_RESTRICTED" },
        { status: 403 }
      );
    }

    // ─── Location validation ────────────────────────────────────
    if (!districtId || !cityId || !areaId) {
      return NextResponse.json(
        { success: false, error: "Please select your full location (District, City, and Area)", code: "LOCATION_REQUIRED" },
        { status: 400 }
      );
    }

    const locValidation = await validateLocationHierarchy(districtId, cityId, areaId);
    if (!locValidation.isValid) {
      return NextResponse.json(
        { success: false, error: locValidation.error, code: "LOCATION_INVALID" },
        { status: 400 }
      );
    }

    // ─── Check for existing user ─────────────────────────────────
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already exists" },
        { status: 400 }
      );
    }

    // ─── Check for duplicate phone ───────────────────────────────
    if (phone) {
      const existingPhone = await prisma.user.findFirst({ where: { phone } });
      if (existingPhone) {
        return NextResponse.json(
          { success: false, error: "An account with this phone number already exists" },
          { status: 400 }
        );
      }
    }

    // ─── Create user ─────────────────────────────────────────────
    const passwordHashed = await hashPassword(password);
    const userRole = (role?.toUpperCase() === "PROVIDER" ? "PROVIDER" : "USER") as "USER" | "PROVIDER";
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: fullName,
        passwordHash: passwordHashed,
        role: userRole,
        phone: phone || null,
        districtId: districtId || null,
        cityId: cityId || null,
        areaId: areaId || null,
        address: address || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        isActive: userRole === "PROVIDER" ? false : true,
        isEmailVerified: false,
        ...(userRole === "PROVIDER"
          ? {
              providerProfile: {
                create: {
                  professionalTitle: category || null,
                  verificationStatus: "NOT_SUBMITTED" as any,
                  isAvailable: false,
                  serviceRadius: serviceRadius ? parseFloat(serviceRadius) : 10.0,
                  settings: cnic ? { cnicNumber: cnic } : {},
                  serviceAreas: {
                    connect: areaId ? [{ id: areaId }] : [],
                  },
                } as any,
              },
            }
          : {}),
      },
      include: {
        providerProfile: true,
      },
    }) as any;

    // ─── Generate and send OTP via Service ──────────────────────
    const otpResult = await createAndSendOtp(normalizedEmail, "EMAIL_VERIFY", fullName);
    
    if (!otpResult.success) {
      logger.error(`Signup OTP failure for ${normalizedEmail}: ${otpResult.error}`);
      // We still return success as the user account is created, they can resend OTP
    }

    logger.info(`Registration success: ${normalizedEmail} (role: ${userRole})`);

    return NextResponse.json({
      success: true,
      message: "Registration successful. Please verify your email.",
      providerId: newUser.role === "PROVIDER" ? newUser.id : undefined,
      currentStatus: newUser.isActive ? "ACTIVE" : "INACTIVE",
      verificationStage: (newUser as any).providerProfile?.verificationStatus || "NONE",
      nextAction: newUser.role === "PROVIDER" ? "VERIFY_EMAIL" : "COMPLETE_PROFILE",
      user: { id: newUser.id, email: newUser.email },
      requiresVerification: true,
    });
  } catch (error: unknown) {
    console.error("CRITICAL SIGNUP ERROR:", error); // Direct console log for visibility
    logger.error("Signup error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to process registration" },
      { status: 500 }
    );
  }
}