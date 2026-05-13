import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";
import { sendNotification } from "@/services/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/bookings/[id]/verify-arrival
 * Body: { qrToken, lat?, lng? }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params;
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const { qrToken, lat, lng } = await req.json();

    if (!qrToken) {
      return NextResponse.json({ success: false, error: "QR Token is required" }, { status: 400 });
    }

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: true,
        service: true,
      }
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    // Verify authorized provider
    if (booking.provider.userId !== guard.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized: only assigned provider can verify arrival" }, { status: 403 });
    }

    // Verify status (should be Accepted)
    if (booking.status !== "Accepted") {
      return NextResponse.json({ success: false, error: "Arrival can only be verified for accepted bookings" }, { status: 400 });
    }

    // Verify Token
    if (booking.qrToken !== qrToken) {
      return NextResponse.json({ success: false, error: "Invalid QR Token" }, { status: 400 });
    }

    // Verify Expiry
    if (booking.qrExpiry && new Date() > booking.qrExpiry) {
      return NextResponse.json({ success: false, error: "QR Token has expired" }, { status: 400 });
    }

    // Update Booking
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "Arrived",
        arrivalVerified: true,
        arrivalVerifiedAt: new Date(),
        arrivalLat: lat || null,
        arrivalLng: lng || null,
      }
    });

    // Notify Customer
    await sendNotification({
      userId: booking.userId,
      title: "Provider Arrived",
      body: `Your provider has arrived for ${booking.service.name}. Job will start soon.`,
      type: "BOOKING",
      actionUrl: `/booking/${bookingId}`,
    });

    logger.info(`Arrival verified for booking ${bookingId} by provider ${guard.user.id}`);

    return NextResponse.json({
      success: true,
      message: "Arrival verified successfully",
      data: updated,
    });

  } catch (error: any) {
    logger.error("Arrival verification error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
