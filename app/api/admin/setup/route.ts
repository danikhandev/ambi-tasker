import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { logger } from "@/utils/logger";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/setup
 * One-time endpoint to create/verify the admin record in the database.
 * This does NOT change the schema — just ensures the Admin row exists.
 * Protected by a setup secret to prevent public access.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { setupSecret } = body;

    // Protect with a simple env secret
    const expectedSecret = process.env.ADMIN_SETUP_SECRET || "ambi-setup-2026";
    if (setupSecret !== expectedSecret) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const ADMIN_EMAIL = "adminambitasker@gmail.com";
    const ADMIN_PASSWORD = "dhambit..**";
    const ADMIN_NAME = "AmbiTasker Admin";

    // Check if admin already exists
    const existing = await prisma.admin.findUnique({ where: { email: ADMIN_EMAIL } });

    if (existing) {
      // Update status to ensure it's active
      await prisma.admin.update({
        where: { email: ADMIN_EMAIL },
        data: {
          status: "active",
          name: ADMIN_NAME,
          role: "SUPER_ADMIN",
        },
      });
      logger.info(`Admin record verified/updated for ${ADMIN_EMAIL}`);
      return NextResponse.json({
        success: true,
        message: "Admin record already exists and is active.",
        email: ADMIN_EMAIL,
      });
    }

    // Create admin record
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const admin = await prisma.admin.create({
      data: {
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        passwordHash,
        role: "SUPER_ADMIN",
        status: "active",
        requiresPasswordChange: false,
        permissions: [],
      },
    });

    logger.info(`Admin record created for ${ADMIN_EMAIL}`);
    return NextResponse.json({
      success: true,
      message: "Admin record created successfully.",
      email: admin.email,
    });
  } catch (error: any) {
    logger.error("Admin setup error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Setup failed" },
      { status: 500 }
    );
  }
}
