import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard, adminGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/support/conversations
 * Users: Returns their persistent support conversation
 * Admins: Returns all active support conversations
 */
export async function GET(req: NextRequest) {
  try {
    // Check if it's an admin first
    const adminRes = await adminGuard(req);
    if (adminRes.success) {
      const conversations = await (prisma as any).supportConversation.findMany({
        include: {
          user: {
            select: { id: true, name: true, profileImage: true, email: true, role: true }
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        },
        orderBy: { updatedAt: "desc" }
      });
      return NextResponse.json({ success: true, data: conversations });
    }

    // Otherwise check user
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const conversations = await (prisma as any).supportConversation.findMany({
      where: { userId: guard.user.id },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json({ success: true, data: conversations });
  } catch (error) {
    logger.error("Support Conversations GET error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/support/conversations
 * Creates a new support conversation (persistent thread)
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const body = await req.json();
    const { subject, category } = body;

    // Check if user already has an OPEN or IN_PROGRESS conversation
    const existing = await (prisma as any).supportConversation.findFirst({
      where: {
        userId: guard.user.id,
        status: { in: ["OPEN", "IN_PROGRESS"] }
      }
    });

    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    const conversation = await (prisma as any).supportConversation.create({
      data: {
        userId: guard.user.id,
        subject: subject || "Support Request",
        category: category || "GENERAL",
        status: "OPEN",
        priority: "MEDIUM"
      }
    });

    return NextResponse.json({ success: true, data: conversation }, { status: 201 });
  } catch (error) {
    logger.error("Support Conversations POST error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
