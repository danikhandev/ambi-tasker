import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

/**
 * POST /api/chat/from-booking
 *
 * Given a bookingId, this route:
 *  1. Verifies the caller is a participant of that booking
 *  2. Verifies the booking is in a chat-eligible status (not just Requested)
 *  3. Finds or creates the conversation record
 *  4. Returns { conversationId, otherUserId }
 */
export async function POST(req: NextRequest) {
  try {
    const authGuard = await userGuard(req);
    if (authGuard.error) return authGuard.error;
    const authUser = authGuard.user;

    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "bookingId is required" },
        { status: 400 }
      );
    }

    // 1. Fetch the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const callerId = authUser.id;

    // 3. Verify caller is a participant of this booking
    const isUser = booking.userId === callerId;
    const isProvider = booking.provider.userId === callerId;

    if (!isUser && !isProvider) {
      logger.warn(`Unauthorized chat access: user ${callerId} tried to access booking ${bookingId}`);
      return NextResponse.json(
        { success: false, error: "You are not a participant of this booking" },
        { status: 403 }
      );
    }

    // 4. Verify booking is in a chat-eligible status
    const chatEligibleStatuses = ["Accepted", "InProgress", "Completed"];
    if (!chatEligibleStatuses.includes(booking.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Chat is only available after the booking is accepted by the provider",
          status: booking.status
        },
        { status: 403 }
      );
    }

    // 5. Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { userId: booking.userId, providerId: booking.provider.userId },
          { userId: booking.provider.userId, providerId: booking.userId } 
        ]
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: booking.userId,
          providerId: booking.provider.userId,
        }
      });
    }

    // 6. Determine the other participant's user ID for the redirect
    // If the caller is the User, the other participant is the Provider's userId
    // If the caller is the Provider, the other participant is the User's id
    const otherUserId = isUser ? booking.provider.userId : booking.userId;

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      otherUserId,
    });
  } catch (err: any) {
    logger.error("POST /api/chat/from-booking error", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
