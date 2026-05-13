import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { logger } from "@/utils/logger";
import { getAdminAuth } from "@/utils/admin-auth";
import { logAdminAction } from "@/lib/admin-logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuth(req);
    if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    // Build where clause for search
    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // Fetch districts with pagination and counts
    const [districts, total] = await [
      await prisma.district.findMany({
        where,
        include: {
          province: true,
          _count: {
            select: {
              cities: true,
              users: true,
            }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      await prisma.district.count({ where })
    ];

    return NextResponse.json({ 
      success: true, 
      data: districts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    logger.error("Locations Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminAuth(req, "locations.manage");
    if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    const { type, name, parentId, isActive } = await req.json();

    if (!type || !name || !parentId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    let created: any;
    if (type === "DISTRICT") {
      created = await prisma.district.create({
        data: { name, provinceId: parentId, isActive: isActive ?? true }
      });
    } else if (type === "AREA") {
      created = await prisma.area.create({
        data: { name, cityId: parentId, isActive: isActive ?? true }
      });
    } else {
      return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });
    }

    await logAdminAction({
      adminId: auth.id,
      action: "CREATE",
      targetType: type,
      targetId: created.id,
      details: `Created new ${type.toLowerCase()}: ${name}`
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    logger.error("Location Create Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAdminAuth(req, "locations.manage");
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { districtId, areaId, isActive } = await req.json();

    if (districtId) {
      await prisma.district.update({
        where: { id: districtId },
        data: { isActive: Boolean(isActive) }
      });
      await logAdminAction({
        adminId: auth.id,
        action: isActive ? "ACTIVATE" : "DEACTIVATE",
        targetType: "DISTRICT",
        targetId: districtId
      });
    } else if (areaId) {
      await prisma.area.update({
        where: { id: areaId },
        data: { isActive: Boolean(isActive) }
      });
      await logAdminAction({
        adminId: auth.id,
        action: isActive ? "ACTIVATE" : "DEACTIVATE",
        targetType: "AREA",
        targetId: areaId
      });
    } else {
      return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Status updated" });
  } catch (error: any) {
    logger.error("Location Update Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAdminAuth(req, "locations.manage");
    if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const districtId = searchParams.get("districtId");
    const areaId = searchParams.get("areaId");

    if (districtId) {
      await prisma.district.delete({ where: { id: districtId } });
      await logAdminAction({
        adminId: auth.id,
        action: "DELETE",
        targetType: "DISTRICT",
        targetId: districtId
      });
    } else if (areaId) {
      await prisma.area.delete({ where: { id: areaId } });
      await logAdminAction({
        adminId: auth.id,
        action: "DELETE",
        targetType: "AREA",
        targetId: areaId
      });
    } else {
      return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Location deleted" });
  } catch (error: any) {
    logger.error("Location Delete Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
