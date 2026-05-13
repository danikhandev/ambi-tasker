import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";
import { sendNotification } from "@/services/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/support — Create a support ticket
 */
export async function POST(req: NextRequest) {
  try {
    // Optional Auth: Users can submit tickets logged in or out
    const auth = await userGuard(req).catch(() => ({ user: null }));
    const body = await req.json();
    const { name, email, subject, message, category = "general" } = body;

    if (!message || !subject || (!auth.user && !email)) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: auth.user?.id || null,
        subject: `${subject}${!auth.user ? ` (from ${name} <${email}>)` : ""}`,
        message,
        category: category.toLowerCase(),
        status: "PENDING",
        priority: "LOW"
      }
    });

    // Notify Admins
    await sendNotification({
      title: "New Support Ticket",
      body: `Ticket #${ticket.id.slice(0, 8)}: ${subject}`,
      type: "SYSTEM",
      targetType: "ALL_USERS", // Should be ALL_ADMINS if we had that, but notification service handles SYSTEM type for admins
      actionUrl: `/admin/support/${ticket.id}`
    });

    return NextResponse.json({ success: true, data: ticket });
  } catch (error: unknown) {
    logger.error("Support ticket creation error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit support ticket" }, { status: 500 });
  }
}
