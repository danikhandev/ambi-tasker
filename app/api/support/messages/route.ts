import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard, adminGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";
import { sendNotification } from "@/services/notifications";

export const dynamic = "force-dynamic";

/**
 * GET /api/support/messages
 * Query: ?conversationId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ success: false, error: "conversationId is required" }, { status: 400 });
    }

    // Verify access
    const adminRes = await adminGuard(req);
    const userRes = await userGuard(req);

    const conversation = await (prisma as any).supportConversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    if (!adminRes.success && userRes.user?.id !== conversation.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const messages = await (prisma as any).supportMessage.findMany({
      where: { conversationId },
      include: {
        attachments: true
      },
      orderBy: { createdAt: "asc" }
    });

    // Mark as read for the current viewer
    const senderRole = adminRes.success ? "ADMIN" : userRes.user?.role || "USER";
    await (prisma as any).supportMessage.updateMany({
      where: {
        conversationId,
        senderRole: senderRole === "ADMIN" ? { in: ["USER", "PROVIDER"] } : "ADMIN",
        isRead: false
      },
      data: { isRead: true }
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    logger.error("Support Messages GET error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/support/messages
 * Body: { conversationId, content, attachments }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, content, attachments } = body;

    if (!conversationId || !content?.trim()) {
      return NextResponse.json({ success: false, error: "conversationId and content are required" }, { status: 400 });
    }

    const adminRes = await adminGuard(req) as { success: boolean, admin?: { id: string } };
    const userRes = await userGuard(req);

    if (!adminRes.success && !userRes.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const conversation = await (prisma as any).supportConversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    if (!adminRes.success && userRes.user?.id !== conversation.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const senderId = adminRes.success && adminRes.admin ? adminRes.admin.id : userRes.user!.id;
    const senderRole = adminRes.success ? "ADMIN" : userRes.user!.role;

    const newMessage = await (prisma as any).supportMessage.create({
      data: {
        conversationId,
        senderId,
        senderRole,
        content: content.trim(),
        attachments: attachments ? {
          create: attachments.map((a: any) => ({
            fileUrl: a.fileUrl,
            fileName: a.fileName,
            fileType: a.fileType,
            fileSize: a.fileSize
          }))
        } : undefined
      },
      include: {
        attachments: true
      }
    });

    // Update conversation last activity
    await (prisma as any).supportConversation.update({
      where: { id: conversationId },
      data: { 
        updatedAt: new Date(),
        lastMessageAt: new Date(),
        status: adminRes.success ? "IN_PROGRESS" : undefined // Auto-mark as in progress if admin replies
      }
    });

    // Send notification to the other party
    if (adminRes.success) {
      // Notify User
      if (conversation.userId) {
        await sendNotification({
          userId: conversation.userId,
          title: "Support Reply",
          body: content.trim().substring(0, 80),
          type: "SYSTEM",
          actionUrl: "/support"
        });
      }
    } else {
      // Notify Admins (could be a broadcast or specific logic)
      // For now, we'll just log it or rely on the dashboard
    }

    return NextResponse.json({ success: true, data: newMessage }, { status: 201 });
  } catch (error) {
    logger.error("Support Messages POST error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
