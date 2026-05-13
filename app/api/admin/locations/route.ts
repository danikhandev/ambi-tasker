import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { adminGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const guard = await adminGuard(req);
    if (!guard.success) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const parentId = searchParams.get('parentId');

    if (!type) return NextResponse.json({ success: false, error: 'Type is required' }, { status: 400 });

    let data: any[] = [];
    switch (type) {
      case 'countries':
        data = await prisma.country.findMany({ orderBy: { name: 'asc' } });
        break;
      case 'provinces':
        data = await prisma.province.findMany({
          where: parentId ? { countryId: parentId } : undefined,
          orderBy: { name: 'asc' }
        });
        break;
      case 'districts':
        data = await prisma.district.findMany({
          where: parentId ? { provinceId: parentId } : undefined,
          orderBy: { name: 'asc' }
        });
        break;
      case 'cities':
        data = await prisma.city.findMany({
          where: parentId ? { districtId: parentId } : undefined,
          orderBy: { name: 'asc' }
        });
        break;
      case 'areas':
        data = await prisma.area.findMany({
          where: parentId ? { cityId: parentId } : undefined,
          orderBy: { name: 'asc' }
        });
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    logger.error("Admin Locations GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await adminGuard(req);
    if (!guard.success) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type, name, parentId, code } = body;

    if (!type || !name) return NextResponse.json({ success: false, error: 'Type and name are required' }, { status: 400 });

    let result;
    switch (type) {
      case 'country':
        if (!code) return NextResponse.json({ success: false, error: 'Code is required for country' }, { status: 400 });
        result = await prisma.country.create({ data: { name, code } });
        break;
      case 'province':
        if (!parentId) return NextResponse.json({ success: false, error: 'parentId is required' }, { status: 400 });
        result = await prisma.province.create({ data: { name, countryId: parentId } });
        break;
      case 'district':
        if (!parentId) return NextResponse.json({ success: false, error: 'parentId is required' }, { status: 400 });
        result = await prisma.district.create({ data: { name, provinceId: parentId } });
        break;
      case 'city':
        if (!parentId) return NextResponse.json({ success: false, error: 'parentId is required' }, { status: 400 });
        result = await prisma.city.create({ data: { name, districtId: parentId } });
        break;
      case 'area':
        if (!parentId) return NextResponse.json({ success: false, error: 'parentId is required' }, { status: 400 });
        result = await prisma.area.create({ data: { name, cityId: parentId } });
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    logger.error("Admin Locations POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const guard = await adminGuard(req);
    if (!guard.success) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type, id, name, isActive } = body;

    if (!type || !id) return NextResponse.json({ success: false, error: 'Type and ID are required' }, { status: 400 });

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;

    let result;
    switch (type) {
      case 'country':
        result = await prisma.country.update({ where: { id }, data: updateData });
        break;
      case 'province':
        result = await prisma.province.update({ where: { id }, data: updateData });
        break;
      case 'district':
        result = await prisma.district.update({ where: { id }, data: updateData });
        break;
      case 'city':
        result = await prisma.city.update({ where: { id }, data: updateData });
        break;
      case 'area':
        result = await prisma.area.update({ where: { id }, data: updateData });
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    logger.error("Admin Locations PATCH Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const guard = await adminGuard(req);
    if (!guard.success) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) return NextResponse.json({ success: false, error: 'Type and ID are required' }, { status: 400 });

    switch (type) {
      case 'country':
        await prisma.country.delete({ where: { id } });
        break;
      case 'province':
        await prisma.province.delete({ where: { id } });
        break;
      case 'district':
        await prisma.district.delete({ where: { id } });
        break;
      case 'city':
        await prisma.city.delete({ where: { id } });
        break;
      case 'area':
        await prisma.area.delete({ where: { id } });
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Location deleted successfully' });
  } catch (error: any) {
    logger.error("Admin Locations DELETE Error:", error);
    // Handle foreign key constraint error
    if (error.code === 'P2003') {
      return NextResponse.json({ success: false, error: 'Cannot delete because it contains sub-locations or users. Please disable it instead.' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
