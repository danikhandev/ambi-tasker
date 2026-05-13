import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/utils/logger";
import { prisma } from "@/services/prisma";
import { verifyAdminAccess, unauthorizedResponse } from "@/utils/adminAuth";
import { hashPassword } from "@/services/auth/utils";
import { sendTeamCredentialsEmail } from "@/services/email/send";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/manage-admins
 * Fetches the list of all administrators.
 * Required Permission: admins.manage
 */
export async function GET(req: NextRequest) {
  const access = await verifyAdminAccess(req, "admins.manage");
  if (!access.authorized) return unauthorizedResponse(access.error, access.errorStatus);

  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const safeAdmins = admins.map((a: any) => ({
      id: a.id,
      email: a.email,
      name: a.name,
      avatar: a.avatar || "/admin/system-admin.jpg",
      role: a.role,
      permissions: a.permissions || [],
      status: a.status,
      createdAt: a.createdAt,
    }));

    return NextResponse.json({ success: true, admins: safeAdmins });
  } catch (error) {
    logger.error("Fetch Admins Error", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/manage-admins
 * Handlers for Create, Update, and Delete actions on administrators.
 * Required Permission: admins.manage
 */
export async function POST(req: NextRequest) {
  const access = await verifyAdminAccess(req, "admins.manage");
  if (!access.authorized) return unauthorizedResponse(access.error, access.errorStatus);

  try {
    const body = await req.json();
    const { action, ...payload } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: "Missing action type" }, { status: 400 });
    }

    // ─── CREATE ─────────────────────────────────────────────
    if (action === "create") {
      const { name, email, password, role, permissions } = payload;

      if (!name || !email || !password) {
        return NextResponse.json({ success: false, error: "Name, email, and password are required" }, { status: 400 });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existingAdmin = await prisma.admin.findUnique({ where: { email: normalizedEmail } });

      if (existingAdmin) {
        return NextResponse.json({ success: false, error: "Admin with this email already exists" }, { status: 400 });
      }

      const hashedPassword = await hashPassword(password);
      
      const newAdmin = await prisma.admin.create({
        data: {
          name: name,
          email: normalizedEmail,
          passwordHash: hashedPassword,
          role: role || "SUB_ADMIN",
          permissions: permissions || [],
          status: "active",
          requiresPasswordChange: true // Force first-time login reset
        }
      });

      // Audit Log
      await prisma.adminLog.create({
        data: {
          adminId: access.adminId!,
          action: "CREATE_ADMIN",
          targetType: "ADMIN",
          targetId: newAdmin.id,
          details: `Created new admin: ${normalizedEmail}`
        }
      });

      // Try to send email but don't fail if SMTP fails
      try {
        await sendTeamCredentialsEmail(
          normalizedEmail,
          name,
          "AmbiTasker Administration",
          password,
          role || "SUB_ADMIN",
          "System Root"
        );
      } catch (e) {
        logger.error("Email delivery failed for new admin credentials", e);
      }

      return NextResponse.json({ success: true, message: `Administrator ${name} created successfully` });
    }

    // ─── REMOVE ─────────────────────────────────────────────
    if (action === "remove") {
      const { targetId } = payload;

      if (access.adminId === targetId) {
         return NextResponse.json({ success: false, error: "Self-deletion is prohibited" }, { status: 403 });
      }

      const target = await prisma.admin.findUnique({ where: { id: targetId } });
      if (!target) return NextResponse.json({ success: false, error: "Admin not found" }, { status: 404 });

      await prisma.admin.delete({ where: { id: targetId } });

      await prisma.adminLog.create({
        data: {
          adminId: access.adminId!,
          action: "DELETE_ADMIN",
          targetType: "ADMIN",
          targetId: targetId,
          details: `Deleted admin: ${target.email}`
        }
      });

      return NextResponse.json({ success: true, message: "Administrator removed successfully" });
    }

    // ─── UPDATE ─────────────────────────────────────────────
    if (action === "update") {
      const { targetId, name, email, password, role, permissions } = payload;

      const updateData: any = {
        name,
        email: email?.toLowerCase().trim(),
        role,
        permissions
      };

      if (password && password.length > 0) {
        updateData.passwordHash = await hashPassword(password);
      }

      await prisma.admin.update({
        where: { id: targetId },
        data: updateData
      });

      await prisma.adminLog.create({
        data: {
          adminId: access.adminId!,
          action: "UPDATE_ADMIN",
          targetType: "ADMIN",
          targetId: targetId,
          details: `Updated admin details for ${email}`
        }
      });

      return NextResponse.json({ success: true, message: "Administrator updated successfully" });
    }

    // ─── UPDATE PERMISSIONS ─────────────────────────────────
    if (action === "update_permissions") {
      const { targetId, permissions } = payload;

      await prisma.admin.update({
        where: { id: targetId },
        data: { permissions }
      });

      await prisma.adminLog.create({
        data: {
          adminId: access.adminId!,
          action: "UPDATE_PERMISSIONS",
          targetType: "ADMIN",
          targetId: targetId,
          details: `Updated permissions for ${targetId}`
        }
      });

      return NextResponse.json({ success: true, message: "Permissions updated successfully" });
    }

    // ─── UPDATE STATUS ──────────────────────────────────────
    if (action === "update_status") {
      const { targetId, status } = payload;

      if (access.adminId === targetId) {
         return NextResponse.json({ success: false, error: "Self-suspension is prohibited" }, { status: 403 });
      }

      await prisma.admin.update({
        where: { id: targetId },
        data: { status }
      });

      await prisma.adminLog.create({
        data: {
          adminId: access.adminId!,
          action: "UPDATE_STATUS",
          targetType: "ADMIN",
          targetId: targetId,
          details: `Changed status to ${status} for ${targetId}`
        }
      });

      return NextResponse.json({ success: true, message: "Status updated successfully" });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.error("Admin Management Exception", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
