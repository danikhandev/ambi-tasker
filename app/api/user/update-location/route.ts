import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

export async function POST(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const { districtId, areaId } = await req.json();

    if (!districtId || !areaId) {
      return NextResponse.json(
        { success: false, error: "District and Area are required" },
        { status: 400 }
      );
    }

    // Validate location existence and activity
    const district = await prisma.district.findUnique({ where: { id: districtId } });
    if (!district || !district.isActive) {
       return NextResponse.json({ success: false, error: "Invalid district" }, { status: 400 });
    }

    const area = await prisma.area.findUnique({ 
        where: { id: areaId },
        include: { city: true }
    });
    if (!area || !area.isActive || area.city.districtId !== districtId) {
       return NextResponse.json({ success: false, error: "Invalid area for selected district" }, { status: 400 });
    }

    // Update user
    await prisma.user.update({
      where: { id: guard.user.id },
      data: {
        districtId,
        cityId: area.cityId,
        areaId,
      },
    });

    // If provider, also update provider profile areas
    if (guard.user.role === "PROVIDER") {
      const provider = await prisma.providerProfile.findUnique({
        where: { userId: guard.user.id }
      });
      if (provider) {
        await prisma.providerProfile.update({
          where: { id: provider.id },
          data: {
            serviceAreas: {
              set: [{ id: areaId }]
            }
          }
        });
      }
    }

    return NextResponse.json({ success: true, message: "Location updated successfully" });
  } catch (error: any) {
    logger.error("Update location error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
