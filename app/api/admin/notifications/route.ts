import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/utils/admin-auth";
import { prisma } from "@/services/prisma";
import { NotificationType, NotificationTarget } from "@prisma/client";
import { logAdminAction } from "@/lib/admin-logger";
import { sendNotification } from "@/services/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await getAdminAuth(req);
  if (!admin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { recipients: true }
        }
      }
    });

    const transformed = notifications.map(n => ({
      id: n.id,
      title: n.title,
      message: n.body,
      type: n.type,
      target_role: n.targetType,
      status: "sent", // Database currently doesn't track status like 'draft' or 'scheduled' in the main table, assuming sent for existing
      created_at: n.createdAt,
      recipients: n._count.recipients
    }));

    return NextResponse.json({ success: true, data: transformed });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminAuth(req);
  if (!admin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const { title, message, type, targetType, targetId, actionUrl, status } = body;

    // Validate
    if (!title || !message || !type || !targetType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // 1. Send via Service (Handles DB + Real-time)
    const notification = await sendNotification({
      title,
      body: message, // Normalized to 'body' for the service
      type: type as any,
      targetType: targetType as any,
      userId: targetId,
      actionUrl,
      senderId: admin.id
    });

    // Create Audit Log
    if (notification) {
      await logAdminAction({
        adminId: admin.id,
        action: "BROADCAST",
        targetType: "NOTIFICATION",
        targetId: notification.id,
        details: `Broadcast: ${title} to ${targetType}`
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: status === 'sent' ? `Notification sent.` : `Notification created.`,
      data: notification 
    });

  } catch (error: any) {
    console.error("[Notifications API] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminAuth(req);
  if (!admin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const { id, title, message, type, targetType, status } = body;

    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        title,
        body: message,
        type: type as NotificationType,
        targetType: targetType as NotificationTarget,
      }
    });

    // If status changed to 'sent' we could re-trigger distribution if needed, 
    // but typically updates are for drafts. For now just update metadata.

    return NextResponse.json({ success: true, data: notification });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminAuth(req);
  if (!admin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  try {
    let id: string | null = null;
    const { searchParams } = new URL(req.url);
    id = searchParams.get('id');

    if (!id) {
        const body = await req.json().catch(() => ({}));
        id = body.id;
    }

    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    await prisma.notification.delete({ where: { id } });

    // Create Audit Log
    await logAdminAction({
      adminId: admin.id,
      action: "DELETE",
      targetType: "NOTIFICATION",
      targetId: id,
      details: `Admin deleted notification history item`
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
