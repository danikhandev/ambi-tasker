import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAuth } from "@/utils/auth";
import { logger } from "@/utils/logger";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getAuth(req);
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      include: {
        district: { select: { name: true } },
        city: { select: { name: true } },
        area: { select: { name: true } }
      },
      orderBy: { isDefault: 'desc' }
    });

    return NextResponse.json({ success: true, data: addresses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getAuth(req);
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { label, address, districtId, cityId, areaId, latitude, longitude, isDefault } = body;

    if (!label || !address) {
      return NextResponse.json({ success: false, error: "Label and address are required" }, { status: 400 });
    }

    // If setting as default, unset others
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false }
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: user.id,
        label,
        address,
        districtId,
        cityId,
        areaId,
        latitude,
        longitude,
        isDefault: isDefault || false
      }
    });

    return NextResponse.json({ success: true, data: newAddress });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
    try {
      const { user } = await getAuth(req);
      if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  
      const body = await req.json();
      const { id, label, address, districtId, cityId, areaId, latitude, longitude, isDefault } = body;
  
      if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
  
      // If setting as default, unset others
      if (isDefault) {
        await prisma.address.updateMany({
          where: { userId: user.id },
          data: { isDefault: false }
        });
      }
  
      const updated = await prisma.address.update({
        where: { id, userId: user.id },
        data: {
          label,
          address,
          districtId,
          cityId,
          areaId,
          latitude,
          longitude,
          isDefault
        }
      });
  
      return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
      const { user } = await getAuth(req);
      if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
  
      if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
  
      await prisma.address.delete({
        where: { id, userId: user.id }
      });
  
      return NextResponse.json({ success: true });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
