import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

/**
 * POST /api/reviews — Create a new review for a booking
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const body = await req.json();
    const { bookingId, rating, comment } = body;

    if (!bookingId || !rating) {
      return NextResponse.json(
        { success: false, error: "bookingId and rating are required" },
        { status: 400 }
      );
    }

    // Check if booking exists and belongs to the user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { provider: true }
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== guard.user.id) {
       return NextResponse.json({ success: false, error: "You can only review your own bookings" }, { status: 403 });
    }

    if (booking.status !== "Completed") {
       return NextResponse.json({ success: false, error: "You can only review completed bookings" }, { status: 400 });
    }

    // Check if review already exists
    const existing = await prisma.review.findUnique({
      where: { bookingId }
    });

    if (existing) {
       return NextResponse.json({ success: false, error: "A review already exists for this booking" }, { status: 400 });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId,
        userId: guard.user.id,
        providerId: booking.providerId,
        rating: parseInt(rating),
        comment: comment || null,
      }
    });

    // Update provider rating
    // Calculate new average
    const reviews = await prisma.review.findMany({
      where: { providerId: booking.providerId }
    });

    const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

    await prisma.providerProfile.update({
      where: { id: booking.providerId },
      data: {
        rating: averageRating,
        ratingCount: reviews.length
      }
    });

    logger.info(`Review created for booking ${bookingId} by ${guard.user.email}`);

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error: unknown) {
    logger.error("Review create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit review" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews — Fetch top reviews for the landing page
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "3");

    const reviews = await prisma.review.findMany({
      where: {
        rating: { gte: 4 },
        comment: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { name: true, profileImage: true } },
        booking: { include: { service: { select: { name: true } } } }
      }
    });

    return NextResponse.json({ success: true, data: reviews });
  } catch (error: unknown) {
    logger.error("Review fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
