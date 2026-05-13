import { NextRequest, NextResponse } from "next/server";
import { userGuard } from "@/services/auth/guards";

export const dynamic = "force-dynamic";

/**
 * POST /api/user/switch-role — Set user perspective cookie
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const { perspective } = await req.json();

    const response = NextResponse.json({ success: true });

    // Set perspective cookie for middleware to use
    response.cookies.set("user-perspective", perspective === "provider" ? "provider" : "user", {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: "Failed to switch role" },
      { status: 500 }
    );
  }
}