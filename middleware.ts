import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// The same secret used in the rest of the application
const JWT_SECRET_RAW = process.env.JWT_SECRET || "serve_u_dev_jwt_secret_fallback";
const JWT_SECRET_KEY = new TextEncoder().encode(JWT_SECRET_RAW);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect Admin Routes
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const adminToken = req.cookies.get("admin-auth-token")?.value;
    
    if (!adminToken) {
      return NextResponse.redirect(new URL("/login?role=admin", req.url));
    }

    try {
      const { payload } = await jwtVerify(adminToken, JWT_SECRET_KEY);
      if (!payload.isAdmin) {
        return NextResponse.redirect(new URL("/login?role=admin", req.url));
      }
    } catch (err) {
      return NextResponse.redirect(new URL("/login?role=admin", req.url));
    }
  }

  // Protect Provider Routes
  if (pathname.startsWith("/provider")) {
    const userToken = req.cookies.get("auth-user-token")?.value;

    if (!userToken) {
      return NextResponse.redirect(new URL("/login?role=provider", req.url));
    }

    try {
      const { payload } = await jwtVerify(userToken, JWT_SECRET_KEY);
      // Ensure the role is PROVIDER
      // ADMIN role is restricted to admin routes only
      if (payload.role !== "PROVIDER" && pathname !== "/provider/verify") {
        return NextResponse.redirect(new URL("/login?role=provider", req.url));
      }
    } catch (err) {
      return NextResponse.redirect(new URL("/login?role=provider", req.url));
    }
  }

  // Protect User Routes
  if (pathname.startsWith("/user")) {
    const userToken = req.cookies.get("auth-user-token")?.value;

    if (!userToken) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      await jwtVerify(userToken, JWT_SECRET_KEY);
      // Assuming any valid user/provider can access basic user routes
    } catch (err) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/provider/:path*",
    "/user/:path*",
  ],
};
