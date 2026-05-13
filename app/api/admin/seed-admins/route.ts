import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/utils/logger";
import { prisma } from "@/services/prisma";
import { hashPassword } from "@/services/auth/utils";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/seed-admins
 *
 * Seeds admin accounts into the Prisma admins table with bcrypt-hashed passwords.
 * Only creates accounts that don't already exist.
 *
 * Admin Accounts:
 * 1. admin@ambitasker.com          / Admin@1234   / SUPER_ADMIN
 * 2. superadmin@ambitasker.com     / Admin@1234   / SUPER_ADMIN
 * 3. haroonadmin@ambitasker.com    / Haroon@1234  / SUB_ADMIN
 * 4. danyaladmin@ambitasker.com    / Danyal@1234  / SUB_ADMIN
 */

const ADMIN_ACCOUNTS = [
  {
    email: "admin@ambitasker.com",
    password: "Admin@1234",
    name: "System Admin",
    role: "SUPER_ADMIN",
    permissions: null, // Super Admins have all perms implicitly
  },
  {
    email: "superadmin@ambitasker.com",
    password: "Admin@1234",
    name: "Super Admin",
    role: "SUPER_ADMIN",
    permissions: null,
  },
  {
    email: "haroonadmin@ambitasker.com",
    password: "Haroon@1234",
    name: "Haroon (Sub Admin)",
    role: "SUB_ADMIN",
    permissions: [
      "users.manage",
      "providers.manage",
      "bookings.manage",
      "payments.view",
      "services.manage",
      "notifications.send",
    ],
  },
  {
    email: "danyaladmin@ambitasker.com",
    password: "Danyal@1234",
    name: "Danyal (Sub Admin)",
    role: "SUB_ADMIN",
    permissions: [
      "users.manage",
      "providers.manage",
      "bookings.manage",
      "payments.view",
      "services.manage",
      "notifications.send",
    ],
  },
];

export async function POST(req: NextRequest) {
  const results: { email: string; status: string; error?: string }[] = [];

  try {
    // Security: Only allow internal/setup calls or existing super admins
    const isInternal = req.headers.get("internal-setup") === "true";

    if (!isInternal) {
      // Check if there are already admins — if so, require auth
      const existingAdmins = await prisma.admin.count();
      if (existingAdmins > 0) {
        // Import admin-auth check
        const { getAdminAuth } = await import("@/utils/admin-auth");
        const auth = await getAdminAuth(req, "admins.manage");
        if (!auth) {
          return NextResponse.json(
            { success: false, error: "Unauthorized: Admin access required" },
            { status: 403 }
          );
        }
      }
    }

    for (const admin of ADMIN_ACCOUNTS) {
      try {
        const existingAdmin = await prisma.admin.findUnique({
          where: { email: admin.email.toLowerCase() },
        });

        if (existingAdmin) {
          results.push({ email: admin.email, status: "already_exists" });
          continue;
        }

        // Hash the password with bcrypt
        const hashedPassword = await hashPassword(admin.password);

        await prisma.admin.create({
          data: {
            name: admin.name,
            email: admin.email.toLowerCase(),
            passwordHash: hashedPassword,
            role: admin.role,
            permissions: admin.permissions || [],
            status: "active",
            requiresPasswordChange: admin.role === "SUB_ADMIN",
          },
        });

        results.push({ email: admin.email, status: "created" });
      } catch (e: any) {
        results.push({ email: admin.email, status: "error", error: e.message });
      }
    }

    logger.info(`Admin seed completed: ${JSON.stringify(results)}`);

    return NextResponse.json({
      success: true,
      message: "Admin seed process completed",
      results,
      // Show credentials only in development
      ...(process.env.NODE_ENV !== "production"
        ? {
            accounts: ADMIN_ACCOUNTS.map((a) => ({
              email: a.email,
              password: a.password,
              role: a.role,
              name: a.name,
            })),
          }
        : {}),
    });
  } catch (error: any) {
    logger.error("Admin Seed Error:", error);
    return NextResponse.json(
      { success: false, error: error.message, results },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "POST to this endpoint to seed admin accounts",
    accounts: ADMIN_ACCOUNTS.map((a) => ({
      email: a.email,
      role: a.role,
      name: a.name,
      note: "Passwords are hashed with bcrypt before storage",
    })),
  });
}
