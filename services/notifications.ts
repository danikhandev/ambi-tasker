import { prisma } from "@/services/prisma";
import { NotificationType, NotificationTarget } from "@prisma/client";

interface SendNotificationOptions {
  title: string;
  body: string;
  type?: NotificationType;
  targetType?: NotificationTarget;
  userId?: string; // For INDIVIDUAL target
  actionUrl?: string;
  senderId?: string;
}

/**
 * Utility to send notifications safely across the system
 */
export async function sendNotification(options: SendNotificationOptions) {
  const { 
    title, 
    body, 
    type = "GENERAL", 
    targetType = "INDIVIDUAL", 
    userId, 
    actionUrl, 
    senderId 
  } = options;

  try {
    // 1. Create Master Notification
    const notification = await prisma.notification.create({
      data: {
        title,
        body,
        type,
        targetType,
        actionUrl,
        senderId
      }
    });

    // 2. Resolve Recipients
    let recipientIds: string[] = [];

    if (targetType === "INDIVIDUAL" || targetType === "SPECIFIC_USER" || targetType === "SPECIFIC_PROVIDER") {
      if (!userId) throw new Error("Recipient User ID required for targeted notification");
      recipientIds = [userId];
    } else if (targetType === "ALL_PROVIDERS") {
      const providers = await prisma.user.findMany({ 
        where: { role: 'PROVIDER' },
        select: { id: true } 
      });
      recipientIds = providers.map(p => p.id);
    } else if (targetType === "ALL_USERS") {
       const users = await prisma.user.findMany({ select: { id: true } });
       recipientIds = users.map(u => u.id);
    }

    // 3. Distribution
    if (recipientIds.length > 0) {
      await prisma.userNotification.createMany({
        data: recipientIds.map(uid => ({
          userId: uid,
          notificationId: notification.id
        })),
        skipDuplicates: true
      });

      // 3.1 Real-time Broadcast via Supabase
      try {
        const { supabase } = await import("@/services/supabase");
        const channel = supabase.channel('system-notifications');
        
        // Broadcast to specific users or groups
        await channel.send({
          type: 'broadcast',
          event: 'new-notification',
          payload: {
            notificationId: notification.id,
            title: notification.title,
            body: notification.body,
            type: notification.type,
            actionUrl: notification.actionUrl,
            recipientIds: recipientIds, // Clients will filter this
            targetType: notification.targetType,
            createdAt: notification.createdAt
          }
        });
      } catch (realtimeError) {
        console.error("[Notification Service] Real-time broadcast failed:", realtimeError);
      }
    }

    // 4. Admin Distribution (if applicable)
    if (targetType === "ALL_USERS" || type === "SYSTEM" || (options as any).notifyAdmins) {
       const admins = await prisma.admin.findMany({ where: { status: 'active' }, select: { id: true } });
       if (admins.length > 0) {
          await prisma.adminNotification.createMany({
             data: admins.map(a => ({
                adminId: a.id,
                notificationId: notification.id
             })),
             skipDuplicates: true
          });
       }
    }

    return notification;
  } catch (error) {
    console.error("[Notification Service] Failed to send notification:", error);
    // Don't throw, just log so the main action (like booking) doesn't fail completely
    return null;
  }
}
