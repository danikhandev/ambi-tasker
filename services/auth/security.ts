import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/utils/logger";
import { verifyToken } from "./utils";

export interface AuthUser {
  email: string;
  isProvider: boolean;
  isAdmin?: boolean;
}

/**
 * Validates the auth token and returns user details.
 * Prevents unauthorized API access.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  // Check User Token
  const userToken = req.cookies.get("auth-user-token")?.value;
  if (userToken) {
    try {
      const decoded = await verifyToken(userToken);
      if (decoded) {
        return {
          email: decoded.email as string,
          isProvider: decoded.isProvider === true,
        };
      }
    } catch (err) {
      logger.error("Auth Token Verification Failed", err);
      return null;
    }
  }

  // Check Admin Token — always verify via JWT, never accept plaintext values
  const adminToken = req.cookies.get("admin-auth-token")?.value;
  if (adminToken) {
    try {
      const decoded = await verifyToken(adminToken);
      if (decoded && decoded.isAdmin === true) {
        return {
          email: decoded.email as string,
          isProvider: false,
          isAdmin: true,
        };
      }
    } catch (err) {
      logger.error("Admin Token Verification Failed", err);
    }
  }

  return null;
}

/**
 * Middleware-like role guard for API routes.
 */
export function validateRole(
  user: AuthUser | null,
  role: "USER" | "PROVIDER" | "ADMIN"
): boolean {
  if (!user) return false;
  if (role === "ADMIN") return user.isAdmin === true;
  if (role === "PROVIDER") return user.isProvider === true || user.isAdmin === true;
  return true; // Any authenticated user
}

/**
 * Standardized error response for unauthorized access.
 */
export function unauthorizedResponse(
  message: string = "Unauthorized Access Restricted"
) {
  logger.warn(`Unauthorized Access Attempt: ${message}`);
  return NextResponse.json(
    { success: false, error: "UNAUTHORIZED", message },
    { status: 401 }
  );
}
