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

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    const after = searchParams.get("after"); // For polling: get messages after this timestamp

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "bookingId is required" },
        { status: 400 }
      );
    }

    // Verify user belongs to this booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { provider: true },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const isCustomer = booking.userId === guard.user.id;
    const isProvider = booking.provider.userId === guard.user.id;
    const isAdmin = guard.user.role === "ADMIN";

    if (!isCustomer && !isProvider && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "You are not part of this conversation" },
        { status: 403 }
      );
    }

    const where: any = { bookingId };
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
        bookingId,
        receiverId: guard.user.id,
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

    const body = await req.json();
    const { bookingId, message } = body;

    if (!bookingId || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: "bookingId and message are required" },
        { status: 400 }
      );
    }

    // Verify booking exists and user is part of it
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { provider: true },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const isCustomer = booking.userId === guard.user.id;
    const isProvider = booking.provider.userId === guard.user.id;

    if (!isCustomer && !isProvider) {
      return NextResponse.json(
        { success: false, error: "You are not part of this conversation" },
        { status: 403 }
      );
    }

    // Determine receiver
    const receiverId = isCustomer ? booking.provider.userId : booking.userId;

    // Ensure conversation exists
    const conversation = await prisma.conversation.upsert({
      where: {
        userId_providerId: isCustomer 
          ? { userId: guard.user.id, providerId: booking.provider.userId } 
          : { userId: booking.userId, providerId: guard.user.id }
      },
      update: { lastMessageAt: new Date() },
      create: {
        userId: isCustomer ? guard.user.id : booking.userId,
        providerId: isCustomer ? booking.provider.userId : guard.user.id,
        lastMessageAt: new Date()
      }
    });

    const newMessage = await prisma.message.create({
      data: {
        senderId: guard.user.id,
        receiverId,
        bookingId,
        conversationId: conversation.id,
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