import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAdminAuth } from "@/utils/admin-auth";

export const dynamic = 'force-dynamic';

// POST - Update/save admin avatar URL
export async function POST(req: NextRequest) {
    try {
        const auth = await getAdminAuth(req);
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { adminId, avatarUrl } = await req.json();
        
        if (!adminId || !avatarUrl) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Only allow updating own avatar unless it's a super admin
        if (auth.id !== adminId && auth.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: "Unauthorized to update this profile" }, { status: 403 });
        }

        await prisma.admin.update({
            where: { id: adminId },
            data: { avatar: avatarUrl }
        });

        return NextResponse.json({ success: true, message: "Admin avatar updated", avatarUrl });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to update avatar" }, { status: 500 });
    }
}

// DELETE - Remove admin avatar
export async function DELETE(req: NextRequest) {
    try {
        const auth = await getAdminAuth(req);
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const adminId = searchParams.get("adminId");

        if (!adminId) return NextResponse.json({ error: "Missing adminId" }, { status: 400 });

        // Only allow removing own avatar unless it's a super admin
        if (auth.id !== adminId && auth.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: "Unauthorized to update this profile" }, { status: 403 });
        }

        await prisma.admin.update({
            where: { id: adminId },
            data: { avatar: null }
        });

        return NextResponse.json({ success: true, message: "Admin avatar removed" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to remove avatar" }, { status: 500 });
    }
}
