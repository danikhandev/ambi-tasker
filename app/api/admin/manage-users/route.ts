import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAdminAuth } from "@/utils/admin-auth";
import { logger } from "@/utils/logger";
import { logAdminAction } from "@/lib/admin-logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/manage-users — List all users with filtering
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "users.manage");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);

    const where: any = {};
    if (role) where.role = role.toUpperCase();
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          profileImage: true,
          createdAt: true,
          district: { select: { name: true } },
          area: { select: { name: true } },
          providerProfile: {
            select: {
              id: true,
              professionalTitle: true,
              verificationStatus: true,
              rating: true,
              cnicFrontUrl: true,
              cnicBackUrl: true,
              selfieUrl: true,
              kycSubmittedAt: true,
              kycVerifiedAt: true,
              experienceYears: true,
              serviceDescription: true,
            },
          },
          _count: { select: { bookings: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    logger.error("Admin users GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/manage-users — Update user (activate/deactivate/change role)
 */
export async function PATCH(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "users.manage");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { userId, isActive, role, name, phone } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (role) updateData.role = role;
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, isActive: true, phone: true },
    });

    logger.info(`Admin ${admin.email} updated user ${updatedUser.email}: ${JSON.stringify(updateData)}`);
    
    // Create Audit Log
    await logAdminAction({
      adminId: admin.id,
      action: isActive !== undefined ? (isActive ? "ACTIVATE" : "DEACTIVATE") : "UPDATE_ROLE",
      targetType: "USER",
      targetId: userId,
      details: JSON.stringify(updateData)
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: unknown) {
    logger.error("Admin user update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/manage-users — Delete user
 */
export async function DELETE(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "users.manage");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    logger.info(`Admin ${admin.email} deleted user ${userId}`);

    // Create Audit Log
    await logAdminAction({
      adminId: admin.id,
      action: "DELETE",
      targetType: "USER",
      targetId: userId,
      details: `User permanently deleted by admin`
    });

    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (error: unknown) {
    logger.error("Admin user delete error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 });
  }
}
