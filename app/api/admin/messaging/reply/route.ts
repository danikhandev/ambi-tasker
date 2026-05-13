import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAdminAuth } from "@/utils/admin-auth";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "notifications.send");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { conversationId, messageText } = await req.json();

    if (!conversationId || !messageText) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Admins usually don't have a record in the 'profiles/users' table in this system
    // but the Message model has senderId pointing to User.
    // We might need a special System User or link Admin directly.
    // However, looking at the schema, senderId is a String.
    
    // For now, we'll create the message using the admin's email as senderId or a fixed SYSTEM_ID.
    const SYSTEM_ADMIN_ID = "SYSTEM_ADMIN_NODE"; // We'll use this for now or the admin ID
    
    // Check if conversation exists
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });

    // Since Message.senderId has a relation to User, we must have a User record.
    // We'll try to find or create an "Admin Representative" user.
    let adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) {
        // Create a dummy admin user if not exists for the sake of messaging relations
        // (This happens if Super Admins are in the 'admins' table but not 'profiles' table)
        adminUser = await prisma.user.create({
            data: {
                id: admin.id,
                name: "System Administrator",
                email: "admin@ambitasker.pk",
                passwordHash: "N/A",
                role: "ADMIN",
                isActive: true
            }
        });
    }

    const newMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: adminUser.id,
        receiverId: conv.userId, // Defaulting to user; realistically depends on context
        messageText,
        isRead: false
      }
    });

    // Update conversation heartbeat
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
    });

    return NextResponse.json({ success: true, data: newMessage });
  } catch (error: unknown) {
    logger.error("Admin Messaging POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to transmit message" }, { status: 500 });
  }
}
