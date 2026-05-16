import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAdminAuth } from "@/utils/admin-auth";

/**
 * ADMIN PROFILE API
 * Handles administrative details and dossier updates.
 */
export async function GET(req: NextRequest) {
    try {
        const adminAuth = await getAdminAuth(req);
        if (!adminAuth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const admin = await prisma.admin.findUnique({
            where: { id: adminAuth.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                permissions: true,
                requiresPasswordChange: true,
                avatar: true
            }
        });

        if (!admin) {
            return NextResponse.json({ error: "Admin not found" }, { status: 404 });
        }

        const masterSupport = await prisma.user.findFirst({
            where: { role: "ADMIN" },
            orderBy: { createdAt: "asc" },
            select: { id: true }
        });

        return NextResponse.json({ 
            success: true, 
            admin, 
            masterId: masterSupport?.id 
        });
    } catch (error: any) {
        console.error("Admin profile fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const adminAuth = await getAdminAuth(req);
        if (!adminAuth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name } = body;

        await prisma.admin.update({
            where: { id: adminAuth.id },
            data: {
                name: name,
            }
        });

        return NextResponse.json({ success: true, message: "Admin dossier updated successfully" });
    } catch (error: any) {
        console.error("Admin profile update error:", error);
        return NextResponse.json({ error: error.message || "Failed to update admin profile" }, { status: 500 });
    }
}
