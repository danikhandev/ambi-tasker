import { NextResponse } from "next/server";
import { AUTH_COOKIE, ADMIN_COOKIE } from "@/services/auth/guards";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });

  // Clear all auth cookies
  response.cookies.set(AUTH_COOKIE, "", {
    path: "/",
    httpOnly: true,
    maxAge: 0,
  });

  response.cookies.set(ADMIN_COOKIE, "", {
    path: "/",
    httpOnly: true,
    maxAge: 0,
  });

  response.cookies.set("user-perspective", "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}
