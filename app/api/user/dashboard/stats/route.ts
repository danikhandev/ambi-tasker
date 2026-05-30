import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";
import { PaymentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/dashboard/stats — Summary statistics for user dashboard
 */
export async function GET(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const [totalBookings, pendingReviews, totalSpent] = await Promise.all([
      prisma.booking.count({
        where: { userId: guard.user.id }
      }),
      prisma.booking.count({
        where: { 
          userId: guard.user.id, 
          status: "Completed",
          review: { is: null }
        }
      }),
      prisma.payment.aggregate({
        where: { 
          booking: { userId: guard.user.id },
          status: PaymentStatus.PAID
        },
        _sum: { amount: true }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalBookings,
        pendingReviews,
        totalSpent: totalSpent._sum.amount || 0,
      },
    });
  } catch (error: unknown) {
    logger.error("User stats GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
