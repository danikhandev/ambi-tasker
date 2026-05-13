import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAdminAuth } from "@/utils/admin-auth";
import { logger } from "@/utils/logger";
import { logAdminAction } from "@/lib/admin-logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "services.manage");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        _count: {
          select: { bookings: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: services });
  } catch (error: unknown) {
    logger.error("Services GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "services.manage");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, category, price, description, isActive } = body;

    const service = await prisma.service.create({
      data: {
        name,
        category,
        price,
        description,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    
    await logAdminAction({
      adminId: admin.id,
      action: "CREATE",
      targetType: "SERVICE",
      targetId: service.id,
      details: `Created new service: ${name}`
    });

    return NextResponse.json({ success: true, data: service });
  } catch (error: unknown) {
    logger.error("Services POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to create service" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "services.manage");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, category, price, description, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Service ID is required" }, { status: 400 });
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        name,
        category,
        price,
        description,
        isActive,
      },
    });
    
    await logAdminAction({
      adminId: admin.id,
      action: "UPDATE",
      targetType: "SERVICE",
      targetId: id,
      details: `Updated service: ${name || service.name}`
    });

    return NextResponse.json({ success: true, data: service });
  } catch (error: unknown) {
    logger.error("Services PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update service" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "services.manage");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Service ID is required" }, { status: 400 });
    }

    await prisma.service.delete({
      where: { id },
    });
    
    await logAdminAction({
      adminId: admin.id,
      action: "DELETE",
      targetType: "SERVICE",
      targetId: id
    });

    return NextResponse.json({ success: true, message: "Service deleted" });
  } catch (error: unknown) {
    logger.error("Services DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete service" }, { status: 500 });
  }
}
