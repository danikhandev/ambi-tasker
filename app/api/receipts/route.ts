import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/receipts — Get receipts for the user
 * Query: ?bookingId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");

    if (bookingId) {
      // Get specific receipt
      const receipt = await prisma.receipt.findUnique({
        where: { bookingId },
        include: {
          booking: {
            include: {
              service: true,
              customer: { select: { name: true, email: true, phone: true } },
              provider: {
                include: { user: { select: { name: true, email: true, phone: true } } },
              },
              payment: true,
            },
          },
        },
      });

      if (!receipt) {
        return NextResponse.json(
          { success: false, error: "Receipt not found" },
          { status: 404 }
        );
      }

      // Authorization check
      const isCustomer = receipt.booking.userId === guard.user.id;
      const isProvider = receipt.booking.provider.userId === guard.user.id;
      const isAdmin = guard.user.role === "ADMIN";

      if (!isCustomer && !isProvider && !isAdmin) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 }
        );
      }

      return NextResponse.json({ success: true, data: receipt });
    }

    // List all receipts for user
    const receipts = await prisma.receipt.findMany({
      where: {
        booking: {
          OR: [
            { userId: guard.user.id },
            { provider: { userId: guard.user.id } },
          ],
        },
      },
      include: {
        booking: {
          include: {
            service: { select: { name: true } },
            payment: { select: { status: true, method: true } },
          },
        },
      },
      orderBy: { generatedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, data: receipts });
  } catch (error: unknown) {
    logger.error("Receipts error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch receipts" },
      { status: 500 }
    );
  }
}