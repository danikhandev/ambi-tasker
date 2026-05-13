import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAdminAuth } from "@/utils/admin-auth";
import { logger } from "@/utils/logger";

import { logAdminAction } from "@/lib/admin-logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/manage-bookings — List all bookings with filtering
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "bookings.manage");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { service: { name: { contains: search, mode: "insensitive" } } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const [bookings, total, statusCounts] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          provider: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          service: true,
          payment: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.booking.count({ where }),
      // Get counts per status
      prisma.booking.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: bookings,
      statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count.id])),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    logger.error("Admin bookings GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch bookings" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/manage-bookings — Admin force-update booking status
 */
export async function PATCH(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "bookings.manage");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { bookingId, status, providerId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ success: false, error: "bookingId is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (providerId) updateData.providerId = providerId;

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
    });

    logger.info(`Admin ${admin.email} updated booking ${bookingId}: ${JSON.stringify(updateData)}`);

    // Create Audit Log
    await logAdminAction({
      adminId: admin.id,
      action: status ? "UPDATE_STATUS" : "REASSIGN_PROVIDER",
      targetType: "BOOKING",
      targetId: bookingId,
      details: `Admin updated booking: ${JSON.stringify(updateData)}`
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    logger.error("Admin booking update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update booking" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/manage-bookings — Admin delete booking
 */
export async function DELETE(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "bookings.manage");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Booking ID is required" }, { status: 400 });
    }

    await prisma.booking.delete({ where: { id } });

    // Create Audit Log
    await logAdminAction({
      adminId: admin.id,
      action: "DELETE",
      targetType: "BOOKING",
      targetId: id,
      details: "Admin deleted booking record"
    });

    return NextResponse.json({ success: true, message: "Booking deleted successfully" });
  } catch (error: unknown) {
    logger.error("Admin booking delete error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete booking" }, { status: 500 });
  }
}

