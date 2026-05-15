import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { hashPassword } from "@/services/auth/utils";
import { getAdminAuth } from "@/utils/admin-auth";
import { logger } from "@/utils/logger";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/create-provider — Admin creates a provider account
 * Using raw SQL for the provider profile creation to bypass stale Prisma client issues.
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

    // Create user + provider profile in a transaction using raw SQL for the profile
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
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
          isEmailVerified: true,
          isActive: true,
        },
      });

      const providerId = uuidv4();
      const verificationStatus = providerStatus === "VERIFIED" ? "VERIFIED" : "PENDING";

      // 2. Create Provider Profile via Raw SQL
      // Note: We use the column names confirmed from the DB: user_id, approval_status, etc.
      await tx.$executeRawUnsafe(`
        INSERT INTO providers (
          id, 
          user_id, 
          professional_title, 
          service_description, 
          hourly_rate, 
          experience_years, 
          approval_status,
          is_available,
          earnings_total,
          rating,
          rating_count,
          service_radius
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::"VerificationStatus", $8, $9, $10, $11, $12)
      `, 
        providerId, 
        user.id, 
        category, 
        serviceDescription || null, 
        hourlyRate ? parseFloat(hourlyRate) : null, 
        experienceYears ? parseInt(experienceYears) : 0, 
        verificationStatus,
        true, // is_available
        0.0,  // earnings_total
        0.0,  // rating
        0,    // rating_count
        10.0  // service_radius
      );

      // 3. Connect Service Area if provided
      if (areaId) {
        // In Prisma many-to-many join tables, A is usually the smaller alphabetical model
        // Area (A) vs ProviderProfile (P). So A=AreaId, B=ProviderProfileId.
        await tx.$executeRawUnsafe(`
          INSERT INTO "_ProviderServiceAreas" ("A", "B") VALUES ($1, $2)
        `, areaId, providerId);
      }

      return { user, providerId, verificationStatus };
    });

    logger.info(
      `Admin ${admin.email} created provider: ${normalizedEmail} (${category})`
    );

    return NextResponse.json({
      success: true,
      message: "Provider created successfully",
      provider: {
        id: result.providerId,
        userId: result.user.id,
        name: result.user.name,
        email: result.user.email,
        category,
        verificationStatus: result.verificationStatus,
      },
    }, { status: 201 });

  } catch (error: any) {
    logger.error("Admin create provider fatal error:", {
      message: error.message,
      code: error.code,
    });
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create provider" },
      { status: 500 }
    );
  }
}
