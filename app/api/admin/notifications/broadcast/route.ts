import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAdminAuth } from "@/utils/admin-auth";
import { logger } from "@/utils/logger";
import { sendNotification } from "@/services/notifications";

// Explicitly mark the route as dynamic to prevent build-time static collection failures
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const admin = await getAdminAuth(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // 2. Body Parsing
    let bodyData;
    try {
      bodyData = await req.json();
    } catch (e) {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const { title, body, type, targetType } = bodyData;

    if (!title || !body) {
      return NextResponse.json({ success: false, error: "Title and body are required" }, { status: 400 });
    }

    // 3. Execution (Handles DB + Real-time)
    const result = await sendNotification({
      title,
      body,
      type: type || "GENERAL",
      targetType: targetType || "ALL_USERS",
      senderId: admin.id
    });

    if (!result) {
      return NextResponse.json({ success: false, error: "Failed to create notification records" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Broadcast initiated successfully",
      notificationId: result.id 
    });

  } catch (error: any) {
    logger.error("Broadcast Notification API error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal Server Error during broadcast" 
    }, { status: 500 });
  }
}
