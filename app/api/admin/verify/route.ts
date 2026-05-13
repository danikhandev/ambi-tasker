import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, validateRole, unauthorizedResponse } from "@/services/auth/security";

export async function POST(req: NextRequest) {
    const user = await getAuthUser(req);
    if (!validateRole(user, 'ADMIN')) {
        return unauthorizedResponse("Admin clearance required for verification updates.");
    }
    return NextResponse.json({ success: true });
}