import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAdminAuth } from "@/utils/admin-auth";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const admin = await getAdminAuth(req, "notifications.send");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { conversationId } = await params;

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, profileImage: true, role: true } }
      }
    });

    const formatted = messages.map(msg => ({
      ...msg,
      sender: {
        ...msg.sender,
        name: (msg.sender.role === "ADMIN" && msg.sender.name && msg.sender.name.toLowerCase().includes("primary admin")) 
          ? "Super Admin" 
          : msg.sender.name
      }
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: unknown) {
    logger.error("Admin Messages GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch messages" }, { status: 500 });
  }
}
