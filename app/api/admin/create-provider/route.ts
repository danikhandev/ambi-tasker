import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { hashPassword } from "@/services/auth/utils";
import { getAdminAuth } from "@/utils/admin-auth";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/create-provider — Admin creates a provider account
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "providers.manage");
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      password,
      phone,
      category,
      hourlyRate,
      experienceYears,
      serviceDescription,
      districtId,
      cityId,
      areaId,
      status: providerStatus,
    } = body;

    // Validation
    if (!name || !email || !password || !category) {
      return NextResponse.json(
        { success: false, error: "name, email, password, and category are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHashed = await hashPassword(password);

    // Create user + provider profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: name.trim(),
          passwordHash: passwordHashed,
          role: "PROVIDER",
          phone: phone || null,
          districtId: districtId || null,
          cityId: cityId || null,
          areaId: areaId || null,
          isEmailVerified: true, // Admin-created accounts are pre-verified
          isActive: true,
        },
      });

      const verificationStatus =
        providerStatus === "VERIFIED" ? "VERIFIED" : "PENDING";

      const provider = await tx.providerProfile.create({
        data: {
          userId: user.id,
          professionalTitle: category,
          serviceDescription: serviceDescription || null,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
          experienceYears: experienceYears ? parseInt(experienceYears) : 0,
          verificationStatus,
          serviceAreas: {
            connect: areaId ? [{ id: areaId }] : [],
          },
        },
      });

      return { user, provider };
    });

    logger.info(
      `Admin ${admin.email} created provider: ${normalizedEmail} (${category})`
    );

    return NextResponse.json({
      success: true,
      message: "Provider created successfully",
      provider: {
        id: result.provider.id,
        userId: result.user.id,
        name: result.user.name,
        email: result.user.email,
        category,
        verificationStatus: result.provider.verificationStatus,
      },
    }, { status: 201 });
  } catch (error: unknown) {
    logger.error("Admin create provider error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create provider" },
      { status: 500 }
    );
  }
}
