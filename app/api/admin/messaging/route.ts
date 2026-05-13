import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAdminAuth } from "@/utils/admin-auth";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "notifications.send"); // Assuming messaging is under notifications perm
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const conversations = await prisma.conversation.findMany({
      include: {
        user: { select: { id: true, name: true, profileImage: true, role: true } },
        provider: { select: { id: true, name: true, profileImage: true, role: true } },
        _count: { select: { messages: true } }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    const formatted = conversations.map(c => ({
       id: c.id,
       user: c.user,
       provider: c.provider,
       lastMessageAt: c.lastMessageAt,
       messageCount: c._count.messages
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: unknown) {
    logger.error("Admin Conversations GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch conversations" }, { status: 500 });
  }
}
