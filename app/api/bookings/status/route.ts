import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";
import { sendNotification } from "@/services/notifications";
import { emailService } from "@/services/email/service";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  Requested: ["Accepted", "Cancelled"],
  Accepted: ["Arrived", "InProgress", "Cancelled"],
  Arrived: ["InProgress", "Cancelled"],
  InProgress: ["Completed", "Cancelled"],
  Completed: ["Completed"],
  Cancelled: [],
};

/**
 * PATCH /api/bookings/status — Update booking status
 * Body: { bookingId, status }
 */
export async function PATCH(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const { bookingId, status } = await req.json();

    if (!bookingId || !status) {
      return NextResponse.json(
        { success: false, error: "bookingId and status are required" },
        { status: 400 }
      );
    }

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        provider: { include: { user: true } },
        customer: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Authorization: Only the customer or provider can update
    const isCustomer = booking.userId === guard.user.id;
    const isProvider = booking.provider.userId === guard.user.id;
    const isAdmin = guard.user.role === "ADMIN";

    if (!isCustomer && !isProvider && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to update this booking" },
        { status: 403 }
      );
    }

    if (isProvider) {
      const providerProfile = await prisma.providerProfile.findUnique({
        where: { userId: guard.user.id },
        select: { verificationStatus: true }
      });
      if (providerProfile?.verificationStatus !== "VERIFIED") {
         return NextResponse.json(
           { success: false, error: "Access Denied: You must complete KYC verification to handle jobs.", code: "UNVERIFIED_PROVIDER" },
           { status: 403 }
         );
      }
    }

    // Validate status transition
    const currentStatus = booking.status;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot transition from '${currentStatus}' to '${status}'. Allowed: ${allowed.join(", ") || "none"}`,
        },
        { status: 400 }
      );
    }

    // Role-specific authorization (providers accept/progress/complete; customers cancel)
    if (status === "Accepted" || status === "InProgress" || status === "Completed") {
      if (!isProvider && !isAdmin) {
        return NextResponse.json(
          { success: false, error: "Only the provider can accept, start, or complete a booking" },
          { status: 403 }
        );
      }
    }

    // Additional data for specific status updates
    const additionalData: any = {};
    if (status === "Accepted") {
      additionalData.qrToken = crypto.randomUUID();
      additionalData.qrExpiry = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 48 hours validity
    }

    // Update booking
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        status: status as any,
        ...additionalData
      },
      include: {
        service: true,
        provider: { include: { user: { select: { id: true, name: true } } } },
        customer: { select: { id: true, name: true } },
      },
    });

    // Notification to the other party
    const notifyUserId = isProvider ? booking.userId : booking.provider.userId;
    const statusMessages: Record<string, string> = {
      Accepted: `Your booking for ${booking.service.name} has been accepted`,
      InProgress: `Your booking for ${booking.service.name} is now in progress`,
      Completed: `Your booking for ${booking.service.name} has been completed`,
      Cancelled: `Booking for ${booking.service.name} has been cancelled`,
    };

    await sendNotification({
      userId: notifyUserId,
      title: "Booking Update",
      body: statusMessages[status] || `Booking status changed to ${status}`,
      type: "BOOKING",
      actionUrl: isProvider ? `/track/${bookingId}` : `/provider/bookings/${bookingId}`,
    });

    // Send Status Email
    try {
        if (status === "Accepted") {
            await emailService.sendBookingAcceptedEmail(booking.customer.email, {
                customerName: booking.customer.name,
                providerName: booking.provider.user.name,
                serviceTitle: booking.service.name,
                scheduledAt: booking.scheduledAt?.toISOString() || new Date().toISOString(),
                bookingId: booking.id
            });
        } else if (status !== "Requested") {
            // Generic update for InProgress, Completed, Cancelled
            const recipient = isProvider ? booking.customer : booking.provider.user;
            if (recipient.email) {
                await emailService.sendBookingStatusUpdateEmail(recipient.email, {
                    recipientName: recipient.name,
                    serviceTitle: booking.service.name,
                    newStatus: status,
                    bookingId: booking.id,
                    role: isProvider ? "customer" : "provider"
                });
            }
        }
    } catch (err) {
        logger.error("Email notification failed during status update", err);
    }

    // On completion: create payment record and update provider earnings
    if (status === "Completed") {
      const amount = booking.totalPrice || booking.service.price;
      const platformFee = amount * 0.1; // 10% commission
      const netEarning = amount - platformFee;

      // Create payment record as PENDING, wait for User confirmation
      await prisma.payment.upsert({
        where: { bookingId },
        create: {
          bookingId,
          amount,
          method: "CASH",
          status: "PENDING",
        },
        update: {
          amount,
          status: "PENDING",
        },
      });

      // Create receipt
      await prisma.receipt.upsert({
        where: { bookingId },
        create: {
          bookingId,
          amount,
        },
        update: {
          amount,
        },
      });

      // NOTE: Provider earnings will be updated when User confirms completion
    }

    logger.info(`Booking ${bookingId} status: ${currentStatus} → ${status} by ${guard.user.email}`);

    return NextResponse.json({
      success: true,
      message: `Booking ${status.toLowerCase()} successfully`,
      data: updated,
    });
  } catch (error: unknown) {
    logger.error("Booking status update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update booking status" },
      { status: 500 }
    );
  }
}
