/**
 * Auth Guards — Server-side JWT verification for API routes
 * Replaces all Supabase Auth dependencies with pure JWT (jose)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { verifyToken } from "./utils";
import { logger } from "@/utils/logger";
import { getAdminAuth } from "@/utils/admin-auth";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: "USER" | "PROVIDER" | "ADMIN";
  isEmailVerified: boolean;
}

interface GuardSuccess {
  user: AuthenticatedUser;
  error?: undefined;
}

interface GuardFailure {
  user?: undefined;
  error: NextResponse;
}

type GuardResult = GuardSuccess | GuardFailure;

// ─── Cookie Names ───────────────────────────────────────────────────────────

export const AUTH_COOKIE = "auth-user-token";
export const ADMIN_COOKIE = "admin-auth-token";

// ─── User Guard ─────────────────────────────────────────────────────────────

/**
 * Validates the user JWT from cookies, fetches user from DB.
 * Returns user data or a 401/403 error response.
 */
export async function userGuard(req: NextRequest): Promise<GuardResult> {
  try {
    const authHeader = req.headers.get("authorization");
    let token = req.cookies.get(AUTH_COOKIE)?.value;
    let isAdminToken = false;

    if (!token) {
      token = req.cookies.get(ADMIN_COOKIE)?.value;
      if (token) isAdminToken = true;
    }

    if (!token && authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return {
        error: NextResponse.json(
          { success: false, error: "Unauthorized — No token provided" },
          { status: 401 }
        ),
      };
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return {
        error: NextResponse.json(
          { success: false, error: "Unauthorized — Invalid or expired token" },
          { status: 401 }
        ),
      };
    }

    const userId = (decoded.userId || decoded.id) as string;
    if (!userId) {
      return {
        error: NextResponse.json(
          { success: false, error: "Unauthorized — Invalid token payload" },
          { status: 401 }
        ),
      };
    }

    if (isAdminToken) {
      // Fetch from Admin table
      const admin = await prisma.admin.findUnique({
        where: { id: userId },
      });

      if (!admin || admin.status !== "active") {
        return {
          error: NextResponse.json({ success: false, error: "Admin not found or inactive" }, { status: 404 }),
        };
      }

      // Find shadow user record by email
      const shadowUser = await prisma.user.findUnique({
        where: { email: admin.email }
      });

      if (!shadowUser) {
        return {
          error: NextResponse.json({ success: false, error: "Admin shadow user not found" }, { status: 404 }),
        };
      }

      return {
        user: {
          id: shadowUser.id,
          email: shadowUser.email,
          name: shadowUser.name,
          role: "ADMIN",
          isEmailVerified: true,
        },
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        error: NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        ),
      };
    }

    if (!user.isActive) {
      return {
        error: NextResponse.json(
          { success: false, error: "Account has been deactivated" },
          { status: 403 }
        ),
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  } catch (error) {
    logger.error("User guard error:", error);
    return {
      error: NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      ),
    };
  }
}

// ─── Provider Guard ─────────────────────────────────────────────────────────

/**
 * Validates that user is an approved PROVIDER.
 */
export async function providerGuard(req: NextRequest): Promise<GuardResult> {
  const result = await userGuard(req);
  if (result.error) return result;

  if (result.user.role !== "PROVIDER" && result.user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { success: false, error: "Forbidden — Provider access required" },
        { status: 403 }
      ),
    };
  }

  return result;
}

// ─── Role Guard ─────────────────────────────────────────────────────────────

/**
 * Generic role guard — validates the user has one of the allowed roles.
 */
export async function roleGuard(
  req: NextRequest,
  allowedRoles: ("USER" | "PROVIDER" | "ADMIN")[]
): Promise<GuardResult> {
  const result = await userGuard(req);
  if (result.error) return result;

  if (!allowedRoles.includes(result.user.role)) {
    return {
      error: NextResponse.json(
        { success: false, error: `Forbidden — Requires one of: ${allowedRoles.join(", ")}` },
        { status: 403 }
      ),
    };
  }

  return result;
}

// ─── Admin Guard ────────────────────────────────────────────────────────────

/**
 * Validates admin auth from cookies.
 */
export async function adminGuard(req: NextRequest) {
  const admin = await getAdminAuth(req);
  if (!admin) {
    return { success: false };
  }
  return { success: true, admin };
}

// ─── Cookie Helpers ─────────────────────────────────────────────────────────

/**
 * Sets the auth JWT cookie on a response.
 */
export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE, token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
  return response;
}

/**
 * Clears the auth JWT cookie.
 */
export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE, "", {
    path: "/",
    httpOnly: true,
    maxAge: 0,
  });
  return response;
}
