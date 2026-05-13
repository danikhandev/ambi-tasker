import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

export async function POST(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    const userId = guard.user?.id || null;

    const body = await req.json();
    const { category, subject, message } = body;

    if (!category || !subject || !message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        category,
        subject,
        message,
        status: "PENDING",
        priority: "LOW"
      }
    });

    return NextResponse.json({ success: true, data: ticket });
  } catch (error: any) {
    logger.error("Support Ticket creation error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit ticket" }, { status: 500 });
  }
}
