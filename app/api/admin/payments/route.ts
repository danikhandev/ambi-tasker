import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAdminAuth } from "@/utils/admin-auth";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "8", 10);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { transactionId: { contains: search, mode: "insensitive" } }
      ];
      const numericSearch = Number(search);
      if (!isNaN(numericSearch)) {
        where.OR.push({ amount: numericSearch });
      }
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            include: {
              customer: { select: { name: true } },
              provider: { include: { user: { select: { name: true } } } },
              service: { select: { name: true } }
            }
          }
        }
      }),
      prisma.payment.count({ where })
    ]);

    const formattedPayments = payments.map(p => ({
        id: p.id,
        bookingId: p.bookingId,
        amount: p.amount,
        paymentMethod: p.method,
        transactionId: p.transactionId || "N/A",
        status: p.status,
        paidAt: p.paidAt || p.createdAt,
        createdAt: p.createdAt,
        consumerName: p.booking?.customer?.name || "Unknown Consumer",
        providerName: p.booking?.provider?.user?.name || "Unknown Provider",
        serviceTitle: p.booking?.service?.name || "Specialized Service",
    }));

    return NextResponse.json({ success: true, data: formattedPayments, total });
  } catch (error: unknown) {
    logger.error("Admin Payments GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch payments" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/payments — Update payment status
 */
export async function PATCH(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req);
    if (!admin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    const { id, status } = await req.json();
    if (!id || !status) return NextResponse.json({ success: false, error: "ID and status required" }, { status: 400 });

    const payment = await prisma.payment.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, data: payment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/payments — Delete payment record
 */
export async function DELETE(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req);
    if (!admin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    await prisma.payment.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Payment record deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

