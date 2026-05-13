import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";
import { sendNotification } from "@/services/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/reports — Create a report for a booking or provider
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const body = await req.json();
    const { bookingId, targetId, category, description } = body;

    if (!category || !description) {
      return NextResponse.json(
        { success: false, error: "Category and description are required" },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        reporterId: guard.user.id,
        bookingId: bookingId || null,
        targetId: targetId || null,
        category: category,
        description: description,
        status: "PENDING",
      },
    });

    // Notify Admins
    // We can use a broadcast system or find a specific admin
    await sendNotification({
      targetType: "ALL_USERS", // Placeholder for admin target
      title: "New Report Submitted",
      body: `A new report has been submitted by ${guard.user.name}`,
      type: "ALERT",
      actionUrl: `/admin/reports`
    }).catch(e => logger.error("Admin notification for report failed", e));

    logger.info(`Report created: ${report.id} by ${guard.user.email}`);

    return NextResponse.json({
      success: true,
      message: "Report submitted successfully. Our team will review it shortly.",
      data: report,
    }, { status: 201 });
  } catch (error: unknown) {
    logger.error("Report create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit report" },
      { status: 500 }
    );
  }
}
