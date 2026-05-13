import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params;
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const body = await req.json();
    const { rating, comment } = body;

    if (!rating) {
      return NextResponse.json({ success: false, error: "Rating is required" }, { status: 400 });
    }

    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true }
    });

    if (!booking || booking.userId !== guard.user.id) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "Completed") {
      return NextResponse.json({ success: false, error: "Only completed bookings can be reviewed" }, { status: 400 });
    }

    if (booking.review) {
      return NextResponse.json({ success: false, error: "Review already exists for this booking" }, { status: 400 });
    }

    // Create review and update Provider's average rating atomically using Prisma interactive transactions
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          bookingId,
          userId: guard.user.id,
          providerId: booking.providerId,
          rating: Number(rating),
          comment
        }
      });

      const providerReviews = await tx.review.findMany({
        where: { providerId: booking.providerId },
        select: { rating: true }
      });

      const averageRating = providerReviews.reduce((acc, curr) => acc + curr.rating, 0) / providerReviews.length;

      await tx.providerProfile.update({
        where: { id: booking.providerId },
        data: {
          rating: averageRating,
          ratingCount: providerReviews.length
        }
      });

      return newReview;
    });

    return NextResponse.json({ success: true, data: review });
  } catch (error: any) {
    logger.error("Booking Review error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit review" }, { status: 500 });
  }
}
