import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";
import { sendNotification } from "@/services/notifications";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/bookings/[id] — Update booking status or details
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params;
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const body = await req.json();
    const { status, arrivalVerified, scheduledAt, notes } = body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { provider: true, customer: true, service: true },
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

    const updateData: any = {};
    const notifications: any[] = [];

    // --- Status Update Logic ---
    if (status) {
      // Basic state machine enforcement
      if (status === "Accepted" && !isProvider && !isAdmin) {
        return NextResponse.json({ success: false, error: "Only providers can accept bookings" }, { status: 403 });
      }
      if (status === "Cancelled" && booking.status === "InProgress") {
        return NextResponse.json({ success: false, error: "Cannot cancel a booking in progress" }, { status: 400 });
      }
      if (status === "Completed" && booking.status !== "InProgress" && booking.status !== "Arrived") {
         return NextResponse.json({ success: false, error: "Booking must be in progress or arrived to complete" }, { status: 400 });
      }

      updateData.status = status;
      
      // Notify the other party
      const targetUserId = isCustomer ? booking.provider.userId : booking.userId;
      notifications.push({
        userId: targetUserId,
        title: "Booking Update",
        body: `Booking for ${booking.service.name} is now ${status}`,
        type: "BOOKING",
        actionUrl: isCustomer ? `/provider/dashboard` : `/user/dashboard`
      });
    }

    if (arrivalVerified !== undefined && (isCustomer || isAdmin)) {
      updateData.arrivalVerified = !!arrivalVerified;
      updateData.arrivalVerifiedAt = arrivalVerified ? new Date() : null;
    }

    if (scheduledAt && (isProvider || isAdmin)) {
      updateData.scheduledAt = new Date(scheduledAt);
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: { service: true, payment: true }
    });

    // Send notifications
    for (const n of notifications) {
      await sendNotification(n).catch(e => logger.error("Notification failed in booking update", e));
    }

    return NextResponse.json({ success: true, data: updatedBooking });
  } catch (error: unknown) {
    logger.error("Booking PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update booking" }, { status: 500 });
  }
}

/**
 * GET /api/bookings/[id] — Get booking details
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params;
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { 
        provider: {
          include: { user: true }
        }, 
        customer: true, 
        service: true,
        payment: true,
        review: true
      },
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

    return NextResponse.json({ success: true, data: booking });
  } catch (error: unknown) {
    logger.error("Booking GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to get booking" }, { status: 500 });
  }
}
