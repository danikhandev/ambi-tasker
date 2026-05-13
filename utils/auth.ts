import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "serve_u_super_secret_jwt_key_2026_safe_production"
);

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export async function getAuth(req: NextRequest): Promise<{ user: AuthenticatedUser | null }> {
  try {
    const token = req.cookies.get("auth-user-token")?.value;
    if (!token) return { user: null };

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    return {
      user: {
        id: payload.userId as string,
        email: payload.email as string,
        role: (payload.role as string) || "USER",
      }
    };
  } catch (error) {
    return { user: null };
  }
}
