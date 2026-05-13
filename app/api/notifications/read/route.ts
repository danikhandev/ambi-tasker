import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAuth } from "@/utils/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const userResult = await getAuth(req);
    if (!userResult.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json({ success: false, error: "Notification ID required" }, { status: 400 });
    }

    await prisma.userNotification.updateMany({
      where: {
        id: notificationId,
        userId: userResult.user.id
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
