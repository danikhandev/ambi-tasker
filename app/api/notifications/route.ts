import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAuth } from "@/utils/auth"; // Assuming this utility exists to get current user

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userResult = await getAuth(req);
    if (!userResult.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = userResult.user.id;

    // Fetch user-specific notifications
    const notifications = await prisma.userNotification.findMany({
      where: { userId },
      include: {
        notification: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    const transformed = notifications.map(un => ({
      id: un.id,
      title: un.notification.title,
      body: un.notification.body,
      type: un.notification.type,
      isRead: un.isRead,
      actionUrl: un.notification.actionUrl,
      createdAt: un.createdAt
    }));

    const unreadCount = await prisma.userNotification.count({
      where: { userId, isRead: false }
    });

    return NextResponse.json({ 
      success: true, 
      data: transformed,
      unreadCount 
    });

  } catch (error: any) {
    console.error("[Notifications API] GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}