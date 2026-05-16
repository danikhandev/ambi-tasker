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

    let userId = guard.user.id;

    // ─── Support Unification: If admin, use the master support ID ────
    if (guard.user.role === "ADMIN") {
      const masterSupport = await prisma.user.findFirst({
        where: { role: "ADMIN" },
        orderBy: { createdAt: "asc" },
      });
      if (masterSupport) userId = masterSupport.id;
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ userId: userId }, { providerId: userId }],
      },
      include: {
        user: {
          select: { id: true, name: true, profileImage: true, isOnline: true, role: true },
        },
        provider: {
          select: { id: true, name: true, profileImage: true, isOnline: true, role: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const seenUsers = new Set<string>();
    const formatted = [];

    for (const c of conversations) {
      const otherUser = c.userId === userId ? c.provider : c.user;
      if (!otherUser || seenUsers.has(otherUser.id)) continue;
      seenUsers.add(otherUser.id);

      // Count unread messages
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: c.id,
          receiverId: userId,
          isRead: false,
        },
      });

      formatted.push({
        id: c.id,
        otherUser: {
          id: otherUser.id,
          name: otherUser.role === "ADMIN" ? "Ambi Tasker" : otherUser.name,
          avatar: otherUser.profileImage,
          isOnline: otherUser.isOnline,
          role: otherUser.role,
        },
        lastMessage: c.messages[0]?.messageText || "No messages yet",
        lastMessageAt: c.messages[0]?.createdAt || c.updatedAt,
        unreadCount: unreadCount,
      });
    }

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

    // ─── OPTIMIZATION: Fetch target and master support in parallel ───
    const [target, masterSupport] = await Promise.all([
      prisma.user.findUnique({ where: { id: targetUserId } }),
      prisma.user.findFirst({
        where: { role: "ADMIN" },
        orderBy: { createdAt: "asc" },
      })
    ]);

    if (!target) {
      return NextResponse.json(
        { success: false, error: "Target user not found" },
        { status: 404 }
      );
    }

    let currentId = guard.user.id;
    let targetId = target.id;

    if (masterSupport) {
      if (guard.user.role === "ADMIN") currentId = masterSupport.id;
      if (target.role === "ADMIN") targetId = masterSupport.id;
    }

    // Determine consistent ordering
    const isCurrentProvider = guard.user.role === "PROVIDER";
    const convoUserId = isCurrentProvider ? targetId : currentId;
    const convoProviderId = isCurrentProvider ? currentId : targetId;

    // ─── OPTIMIZATION: Try findUnique before upsert ──────────────────
    let conversation = await prisma.conversation.findUnique({
      where: {
        userId_providerId: {
          userId: convoUserId,
          providerId: convoProviderId,
        },
      },
      include: {
        user: { select: { id: true, name: true, profileImage: true, isOnline: true, role: true } },
        provider: { select: { id: true, name: true, profileImage: true, isOnline: true, role: true } },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: convoUserId,
          providerId: convoProviderId,
        },
        include: {
          user: { select: { id: true, name: true, profileImage: true, isOnline: true, role: true } },
          provider: { select: { id: true, name: true, profileImage: true, isOnline: true, role: true } },
        },
      });
    }

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
          name: otherUser.role === "ADMIN" ? "Ambi Tasker" : otherUser.name,
          avatar: otherUser.profileImage,
          isOnline: otherUser.isOnline,
          role: otherUser.role,
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
