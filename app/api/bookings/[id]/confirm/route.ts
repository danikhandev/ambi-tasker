import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";
import { sendNotification } from "@/services/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const bookingId = resolvedParams.id;
    if (!bookingId) {
      return NextResponse.json({ success: false, error: "Booking ID is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, provider: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    // Only the customer can confirm
    if (booking.userId !== guard.user.id) {
      return NextResponse.json({ success: false, error: "Not authorized to confirm this booking" }, { status: 403 });
    }

    if (booking.status !== "Completed") {
      return NextResponse.json({ success: false, error: "Booking must be marked as Completed by the provider first" }, { status: 400 });
    }

    if (booking.payment?.status === "COMPLETED") {
      return NextResponse.json({ success: false, error: "Booking is already confirmed" }, { status: 400 });
    }

    const amount = booking.totalPrice || 0;
    const platformFee = amount * 0.1;
    const netEarning = amount - platformFee;

    // Update Payment to COMPLETED and increment Provider Earnings
    await prisma.$transaction([
      prisma.payment.update({
        where: { bookingId },
        data: {
          status: "COMPLETED",
          paidAt: new Date(),
        },
      }),
      prisma.providerProfile.update({
        where: { id: booking.providerId },
        data: {
          earnings: { increment: netEarning },
        },
      }),
    ]);

    // Notify Provider
    await sendNotification({
      userId: booking.provider.userId,
      title: "Payment Confirmed",
      body: `The customer has confirmed completion. Earnings have been added to your wallet.`,
      type: "PAYMENT",
      actionUrl: `/provider/bookings/${bookingId}`,
    });

    logger.info(`Booking ${bookingId} confirmed by customer ${guard.user.email}`);

    return NextResponse.json({ success: true, message: "Booking confirmed successfully" });
  } catch (error: unknown) {
    logger.error("Booking confirm error:", error);
    return NextResponse.json({ success: false, error: "Failed to confirm booking" }, { status: 500 });
  }
}
