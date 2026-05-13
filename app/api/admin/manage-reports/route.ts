import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAdminAuth } from "@/utils/admin-auth";
import { logger } from "@/utils/logger";
import { logAdminAction } from "@/lib/admin-logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/manage-reports — List all reports
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "reports.manage");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);

    const where: any = {};
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, name: true, email: true } },
          booking: {
            include: {
              service: { select: { name: true } },
              customer: { select: { name: true } },
              provider: { include: { user: { select: { name: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.report.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: reports,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    logger.error("Admin reports GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch reports" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/manage-reports — Update report status
 */
export async function PATCH(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "reports.manage");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { reportId, status } = await req.json();

    if (!reportId || !status) {
      return NextResponse.json({ success: false, error: "reportId and status are required" }, { status: 400 });
    }

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: { status },
    });

    // Create Audit Log
    await logAdminAction({
      adminId: admin.id,
      action: "UPDATE_STATUS",
      targetType: "REPORT",
      targetId: reportId,
      details: `Admin changed report status to ${status}`
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    logger.error("Admin report update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update report" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/manage-reports — Delete a report
 */
export async function DELETE(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "reports.manage");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Report ID is required" }, { status: 400 });
    }

    await prisma.report.delete({
      where: { id },
    });

    // Create Audit Log
    await logAdminAction({
      adminId: admin.id,
      action: "DELETE",
      targetType: "REPORT",
      targetId: id,
      details: "Admin deleted report record"
    });

    return NextResponse.json({ success: true, message: "Report deleted successfully" });
  } catch (error: unknown) {
    logger.error("Admin report delete error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete report" }, { status: 500 });
  }
}

