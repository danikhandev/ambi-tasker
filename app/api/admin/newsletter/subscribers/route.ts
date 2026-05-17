import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { verifyAdminAccess } from "@/utils/adminAuth";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.errorStatus });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "ALL";

    let whereClause: any = {};
    if (search) {
      whereClause.email = { contains: search.toLowerCase() };
    }
    if (status !== "ALL") {
      whereClause.status = status;
    }

    const db = prisma as any;

    const subscribers = await db.newsletterSubscriber.findMany({
      where: whereClause,
      orderBy: { subscribedAt: "desc" },
    });

    const metrics = {
      total: await db.newsletterSubscriber.count(),
      active: await db.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
      unsubscribed: await db.newsletterSubscriber.count({ where: { status: "UNSUBSCRIBED" } }),
    };

    return NextResponse.json({ success: true, subscribers, metrics });
  } catch (error: any) {
    console.error("Failed to fetch subscribers:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch subscribers" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.errorStatus });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const db = prisma as any;

    await db.newsletterSubscriber.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete subscriber:", error);
    return NextResponse.json({ success: false, error: "Failed to delete subscriber" }, { status: 500 });
  }
}
