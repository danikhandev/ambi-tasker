import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/messages/conversations — Get list of user's conversations
 */
export async function GET(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const userId = guard.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ userId: userId }, { providerId: userId }],
      },
      include: {
        user: {
          select: { id: true, name: true, profileImage: true, isOnline: true },
        },
        provider: {
          select: { id: true, name: true, profileImage: true, isOnline: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const formatted = await Promise.all(
      conversations.map(async (c) => {
        const otherUser = c.userId === userId ? c.provider : c.user;

        // Count unread messages
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: c.id,
            receiverId: userId,
            isRead: false,
          },
        });

        return {
          id: c.id,
          otherUser: {
            id: otherUser.id,
            name: otherUser.name,
            avatar: otherUser.profileImage,
            isOnline: otherUser.isOnline,
          },
          lastMessage: c.messages[0]?.messageText || "No messages yet",
          lastMessageAt: c.messages[0]?.createdAt || c.updatedAt,
          unreadCount: unreadCount,
        };
      })
    );

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: unknown) {
    logger.error("Conversations GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages/conversations — Find or create a conversation
 * Body: { targetUserId }
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "targetUserId is required" },
        { status: 400 }
      );
    }

    const currentUserId = guard.user.id;
    const currentUserRole = guard.user.role;

    // Check if target exists
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) {
      return NextResponse.json(
        { success: false, error: "Target user not found" },
        { status: 404 }
      );
    }

    // Determine consistent ordering for userId_providerId unique constraint
    const isCurrentProvider = currentUserRole === "PROVIDER";
    const convoUserId = isCurrentProvider ? targetUserId : currentUserId;
    const convoProviderId = isCurrentProvider ? currentUserId : targetUserId;

    const conversation = await prisma.conversation.upsert({
      where: {
        userId_providerId: {
          userId: convoUserId,
          providerId: convoProviderId,
        },
      },
      update: { updatedAt: new Date() },
      create: {
        userId: convoUserId,
        providerId: convoProviderId,
      },
      include: {
        user: {
          select: { id: true, name: true, profileImage: true, isOnline: true },
        },
        provider: {
          select: { id: true, name: true, profileImage: true, isOnline: true },
        },
      },
    });

    const otherUser =
      conversation.userId === currentUserId
        ? conversation.provider
        : conversation.user;

    return NextResponse.json({
      success: true,
      data: {
        id: conversation.id,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.profileImage,
          isOnline: otherUser.isOnline,
        },
      },
    });
  } catch (error: unknown) {
    logger.error("Conversation POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resolve conversation" },
      { status: 500 }
    );
  }
}
