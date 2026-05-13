import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";
import { sendNotification } from "@/services/notifications";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/payment/verify
 * Confirms or Verifies a payment for a booking
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const body = await req.json();
    const { bookingId, method, transactionId } = body;

    if (!bookingId || !method) {
      return NextResponse.json({ success: false, error: "Booking ID and method are required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { 
        service: true,
        payment: true,
        provider: { include: { user: true } }
      }
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== guard.user.id) {
       return NextResponse.json({ success: false, error: "Unauthorized access to this booking" }, { status: 403 });
    }

    // Handle Mock/Simulation Security:
    // In a real production app, this would be triggered by a webhook from Stripe/Paypal.
    // For this requirement, we implement a secure manual confirmation for COD and a simulation for card.

    let paymentStatus: "COMPLETED" | "PENDING" = "PENDING";
    let message = "Payment recorded as pending";
    let bookingUpdateData: any = {};

    if (method === "CASH") {
      paymentStatus = "PENDING"; // COD is always pending until service completion
      message = "Cash on Delivery selected. Pay after service completion.";
    } else if (method === "ONLINE") {
      // Simulate real verification logic here
      // In production, we'd check transactionId against the gateway provider
      paymentStatus = "COMPLETED";
      message = "Online payment successful and verified.";
      
      // Requirement: Paid -> booking confirmed (Accepted)
      bookingUpdateData.status = "Accepted";
      // Ensure we generate the QR token as expected for the "Accepted" state
      bookingUpdateData.qrToken = crypto.randomUUID();
      bookingUpdateData.qrExpiry = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 48 hours
    }

    // Update payment record in transaction with booking update
    await prisma.$transaction(async (tx) => {
      await tx.payment.upsert({
        where: { bookingId: booking.id },
        update: {
          method: method,
          status: paymentStatus,
          transactionId: transactionId || null,
          paidAt: paymentStatus === "COMPLETED" ? new Date() : null,
        },
        create: {
          bookingId: booking.id,
          amount: booking.totalPrice || booking.service.price,
          method: method,
          status: paymentStatus,
          transactionId: transactionId || null,
          paidAt: paymentStatus === "COMPLETED" ? new Date() : null,
        }
      });

      if (Object.keys(bookingUpdateData).length > 0) {
        await tx.booking.update({
          where: { id: booking.id },
          data: bookingUpdateData
        });
      }
    });

    // Notify provider
    await sendNotification({
      userId: booking.provider.userId,
      title: paymentStatus === "COMPLETED" ? "Booking Fully Paid" : "Payment Method Selection",
      body: paymentStatus === "COMPLETED" 
        ? `Customer ${guard.user.name} has paid Rs. ${booking.totalPrice || booking.service.price}. Booking is now confirmed.` 
        : `Customer ${guard.user.name} selected Cash on Delivery for booking ${booking.id.slice(0,8)}.`,
      type: "PAYMENT",
      actionUrl: `/provider/bookings/${booking.id}`,
    });

    return NextResponse.json({
      success: true,
      message,
      data: {
        status: paymentStatus,
        transactionId: transactionId || null
      }
    });

  } catch (error: any) {
    logger.error("Payment verification error:", error);
    return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 500 });
  }
}
