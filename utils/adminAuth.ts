import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET_KEY } from "@/services/auth/utils";
import { prisma } from "@/services/prisma";
import { AdminPermission } from "@/constants/permissions";

/**
 * Utility to verify admin status and permissions in API routes
 */
export async function verifyAdminAccess(
  req: NextRequest, 
  requiredPermission?: AdminPermission
): Promise<{ 
  authorized: boolean; 
  adminId?: string; 
  error?: string; 
  errorStatus?: number 
}> {
  const token = req.cookies.get("admin-auth-token")?.value;

  if (!token) {
    return { authorized: false, error: "Authentication required", errorStatus: 401 };
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
    
    if (!payload.isAdmin || !payload.adminId) {
      return { authorized: false, error: "Invalid administrative token", errorStatus: 403 };
    }

    const adminId = payload.adminId as string;
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, role: true, permissions: true, status: true }
    });

    if (!admin || admin.status !== "active") {
      return { authorized: false, error: "Administrative account inactive or deleted", errorStatus: 403 };
    }

    if (requiredPermission && admin.role !== "SUPER_ADMIN") {
      const permissions = (admin.permissions as string[]) || [];
      if (!permissions.includes(requiredPermission)) {
        return { authorized: false, error: `Missing required permission: ${requiredPermission}`, errorStatus: 403 };
      }
    }

    return { authorized: true, adminId };
  } catch (error) {
    return { authorized: false, error: "Token expired or invalid", errorStatus: 401 };
  }
}

/**
 * Helper to generate an unauthorized response
 */
export function unauthorizedResponse(error: string = "Unauthorized", status: number = 403) {
  return NextResponse.json({ success: false, error }, { status });
}
