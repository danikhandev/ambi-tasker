import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";
import { sendNotification } from "@/services/notifications";

export const dynamic = "force-dynamic";

/**
 * GET /api/messages — List messages for a booking
 * Query: ?bookingId=xxx&after=timestamp
 */
export async function GET(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    let currentUserId = guard.user.id;
    if (guard.user.role === "ADMIN") {
      const masterSupport = await prisma.user.findFirst({
        where: { role: "ADMIN" },
        orderBy: { createdAt: "asc" },
      });
      if (masterSupport) currentUserId = masterSupport.id;
    }

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    const conversationId = searchParams.get("conversationId");
    const after = searchParams.get("after");

    if (!bookingId && !conversationId) {
      return NextResponse.json(
        { success: false, error: "bookingId or conversationId is required" },
        { status: 400 }
      );
    }

    let conversation;
    if (bookingId) {
      // Verify user belongs to this booking
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { provider: true },
      });

      if (!booking) {
        return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
      }

      const isCustomer = booking.userId === guard.user.id;
      const isProvider = booking.provider.userId === guard.user.id;
      const isAdmin = guard.user.role === "ADMIN";

      if (!isCustomer && !isProvider && !isAdmin) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
      }
    } else if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
      }

      const isPart = conversation.userId === currentUserId || conversation.providerId === currentUserId;
      const isAdmin = guard.user.role === "ADMIN";

      if (!isPart && !isAdmin) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
      }
    }
    
    let where: any = {};

    if (bookingId) {
      where.bookingId = bookingId;
    } else if (conversationId) {
      // Support Unification: Fetch conversation and check if it involves an Admin
      const [conv, masterSupport] = await Promise.all([
        prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { user: { select: { role: true, id: true } }, provider: { select: { role: true, id: true } } }
        }),
        prisma.user.findFirst({
          where: { role: "ADMIN" },
          orderBy: { createdAt: "asc" },
          select: { id: true }
        })
      ]);

      const isSupport = conv?.user?.role === "ADMIN" || conv?.provider?.role === "ADMIN";
      if (isSupport) {
        const otherPartyId = conv?.user?.role === "ADMIN" ? conv?.providerId : conv?.userId;
        where = {
          OR: [
            { conversationId: conversationId },
            {
              AND: [
                { senderId: otherPartyId },
                { receiverId: masterSupport?.id || "N/A" }
              ]
            },
            {
              AND: [
                { senderId: masterSupport?.id || "N/A" },
                { receiverId: otherPartyId }
              ]
            }
          ]
        };
      } else {
        where.conversationId = conversationId;
      }
    }

    if (after) {
      where.createdAt = { gt: new Date(after) };
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: { id: true, name: true, profileImage: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    // Mark received messages as read
    await prisma.message.updateMany({
      where: {
        ...(bookingId ? { bookingId } : { conversationId: conversationId as string }),
        receiverId: currentUserId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error: unknown) {
    logger.error("Messages GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages — Send a message in a booking conversation
 * Body: { bookingId, message }
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    let currentUserId = guard.user.id;
    if (guard.user.role === "ADMIN") {
      const masterSupport = await prisma.user.findFirst({
        where: { role: "ADMIN" },
        orderBy: { createdAt: "asc" },
      });
      if (masterSupport) currentUserId = masterSupport.id;
    }

    const body = await req.json();
    const { bookingId, conversationId, message } = body;

    if ((!bookingId && !conversationId) || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: "Target (booking or conversation) and message are required" },
        { status: 400 }
      );
    }

    let targetConversationId = conversationId;
    let receiverId: string;

    if (bookingId) {
      // Verify booking exists and user is part of it
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { provider: true },
      });

      if (!booking) {
        return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
      }

      const isCustomer = booking.userId === currentUserId;
      const isProvider = booking.provider.userId === currentUserId;

      if (!isCustomer && !isProvider) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
      }

      receiverId = isCustomer ? booking.provider.userId : booking.userId;

      // Sync conversation
      const conversation = await prisma.conversation.upsert({
        where: {
          userId_providerId: isCustomer 
            ? { userId: currentUserId, providerId: booking.provider.userId } 
            : { userId: booking.userId, providerId: currentUserId }
        },
        update: { lastMessageAt: new Date() },
        create: {
          userId: isCustomer ? currentUserId : booking.userId,
          providerId: isCustomer ? booking.provider.userId : currentUserId,
          lastMessageAt: new Date()
        }
      });
      targetConversationId = conversation.id;
    } else {
      // Use conversationId
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
      }

      const isUser = conversation.userId === currentUserId;
      const isProvider = conversation.providerId === currentUserId;

      if (!isUser && !isProvider) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
      }

      receiverId = isUser ? conversation.providerId : conversation.userId;
      
      // Update lastMessageAt
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      });
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId: currentUserId,
        receiverId,
        bookingId: bookingId || null,
        conversationId: targetConversationId,
        messageText: message.trim(),
        isRead: false,
      },
      include: {
        sender: {
          select: { id: true, name: true, profileImage: true },
        },
      },
    });

    // Create notification for receiver
    await sendNotification({
      userId: receiverId,
      title: "New Message",
      body: `${guard.user.name}: ${message.trim().substring(0, 80)}${message.length > 80 ? "..." : ""}`,
      type: "GENERAL",
      actionUrl: `/messages/${guard.user.id}`,
    });

    return NextResponse.json({
      success: true,
      data: newMessage,
    }, { status: 201 });
  } catch (error: unknown) {
    logger.error("Message send error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/messages — Mark messages as read
 * Body: { messageIds: string[] }
 */
export async function PATCH(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const { messageIds } = await req.json();

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "messageIds array is required" },
        { status: 400 }
      );
    }

    await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        receiverId: guard.user.id,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, message: "Messages marked as read" });
  } catch (error: unknown) {
    logger.error("Messages PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update messages" },
      { status: 500 }
    );
  }
}