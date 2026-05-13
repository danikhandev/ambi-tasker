import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { logger } from "./logger";
import { JWT_SECRET_KEY } from "@/services/auth/utils";
import { prisma } from "@/services/prisma";

const JWT_SECRET = JWT_SECRET_KEY;

export interface DecodedAdminToken {
  role: "SUPER_ADMIN" | "SUB_ADMIN";
  isAdmin: boolean;
  isSuperAdmin: boolean;
  email: string;
  id: string;
  name: string;
  permissions: string[];
  requiresPasswordChange: boolean;
  iat: number;
  exp: number;
}

/**
 * Validates the admin auth token from the request cookies.
 * Verifies the JWT signature and expiration, then checks for the required permission.
 * Returns the decoded token if valid and authorized, or null if unauthorized.
 */
export async function getAdminAuth(
  req: NextRequest,
  requiredPermission?: string
): Promise<DecodedAdminToken | null> {
  try {
    const adminToken = req.cookies.get("admin-auth-token")?.value;
    if (!adminToken) return null;

    // Verify JWT signature and expiration
    const { payload } = await jwtVerify(adminToken, JWT_SECRET);

    if (!payload || !payload.isAdmin) {
      return null;
    }

    const decoded = payload as unknown as DecodedAdminToken;

    // ─── PRODUCTION ENFORCEMENT: DB Check ───
    // Verify the admin still exists and is active in the database
    const dbAdmin = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: { status: true, role: true, permissions: true }
    });

    if (!dbAdmin || dbAdmin.status !== "active") {
        logger.warn(`Access denied for ${decoded.email}: Account ${!dbAdmin ? 'not found' : 'inactive'}`);
        return null;
    }

    // Sync roles and permissions from DB (prevents stale tokens)
    const currentRole = dbAdmin.role as "SUPER_ADMIN" | "SUB_ADMIN";
    const currentPermissions = (dbAdmin.permissions as string[]) || [];

    // Permission check
    if (requiredPermission) {
      // Super admins always have all permissions
      if (currentRole === "SUPER_ADMIN") return decoded;

      if (!currentPermissions.includes(requiredPermission)) {
        logger.warn(
          `Admin ${decoded.email} denied access. Missing permission: ${requiredPermission}`
        );
        return null;
      }
    }

    return decoded;
  } catch (error: any) {
    // JWT verification failed (invalid signature, expired, malformed)
    if (error?.code === "ERR_JWT_EXPIRED") {
      logger.info("Admin token expired");
    } else {
      logger.error("Admin Auth Verification Error:", error?.message || error);
    }
    return null;
  }
}
