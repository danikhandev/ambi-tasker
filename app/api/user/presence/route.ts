import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAuth } from "@/utils/auth";
import { logger } from "@/utils/logger";

export async function POST(req: NextRequest) {
    const { user } = await getAuth(req);
    const userId = user?.id;
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    try {
        const { isOnline } = await req.json();

        await prisma.user.update({
            where: { id: userId },
            data: {
                isOnline: !!isOnline,
                lastActiveAt: new Date(),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error("Presence Update Error", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
