import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { verifyAdminAccess, unauthorizedResponse } from "@/utils/adminAuth";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users
 * Fetches a list of platform users with filtering and search.
 * Required Permission: users.view
 */
export async function GET(req: NextRequest) {
  const access = await verifyAdminAccess(req, "users.view");
  if (!access.authorized) return unauthorizedResponse(access.error, access.errorStatus);

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || undefined;
    const status = searchParams.get("status") || undefined;

    const users = await prisma.user.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ]
          } : {},
          role ? { role: role.toUpperCase() as any } : {},
          status === "active" ? { isActive: true } : status === "banned" ? { isActive: false } : {},
        ]
      },
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        district: { select: { name: true } },
        _count: { select: { bookings: true } }
      }
    });

    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      location: u.district?.name || "Global",
      bookingCount: u._count.bookings,
      createdAt: u.createdAt
    }));

    return NextResponse.json({ success: true, users: formattedUsers });
  } catch (error: any) {
    logger.error("Admin Users API GET Error", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Performs administrative actions on users (Ban, Delete, Update Role).
 * Required Permission: users.manage
 */
export async function POST(req: NextRequest) {
  const access = await verifyAdminAccess(req, "users.manage");
  if (!access.authorized) return unauthorizedResponse(access.error, access.errorStatus);

  try {
    const { action, userId, ...payload } = await req.json();

    if (!userId) return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });

    if (action === "toggle_status") {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isActive: !user.isActive }
      });

      // Log action
      await prisma.adminLog.create({
        data: {
          adminId: access.adminId!,
          action: user.isActive ? "BAN_USER" : "UNBAN_USER",
          targetType: "USER",
          targetId: userId,
          details: `${user.isActive ? 'Banned' : 'Unbanned'} user: ${user.email}`
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: `User ${updatedUser.isActive ? 'unbanned' : 'banned'} successfully` 
      });
    }

    if (action === "delete") {
      // In a real app, you might want soft-delete or restricted delete
      await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ success: true, message: "User deleted permanently" });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    logger.error("Admin Users API POST Error", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
