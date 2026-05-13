import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAdminAuth } from "@/utils/admin-auth";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/stats — Dashboard statistics
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const [
      totalUsers,
      totalProviders,
      pendingVerifications,
      activeProviders,
      totalBookings,
      bookingsByStatus,
      totalRevenue,
      recentBookings,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "PROVIDER" } }),
      prisma.providerProfile.count({ where: { verificationStatus: "PENDING" } }),
      prisma.providerProfile.count({ where: { verificationStatus: "VERIFIED", isAvailable: true } }),
      prisma.booking.count(),
      prisma.booking.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true } },
          service: { select: { name: true } },
          provider: { include: { user: { select: { name: true } } } },
        },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);

    const statusCounts = Object.fromEntries(
      bookingsByStatus.map((s) => [s.status, s._count.id])
    );

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          providers: totalProviders,
          pendingVerifications,
          activeProviders,
        },
        bookings: {
          total: totalBookings,
          ...statusCounts,
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
          platformFee: (totalRevenue._sum.amount || 0) * 0.1,
        },
        recent: {
          bookings: recentBookings,
          users: recentUsers,
        },
      },
    });
  } catch (error: unknown) {
    logger.error("Admin stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
