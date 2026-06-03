import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/dashboard/featured
 * Returns featured services or providers based on the user's current district
 */
export async function GET(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const { searchParams } = new URL(req.url);
    const provinceId = searchParams.get("provinceId");
    const districtId = searchParams.get("districtId");
    const cityId = searchParams.get("cityId");
    const areaId = searchParams.get("areaId");

    let targetProvinceId = provinceId || null;
    let targetDistrictId = districtId || null;
    let targetCityId = cityId || null;
    let targetAreaId = areaId || null;

    // If no location parameters are provided, fall back to user's saved location
    if (!targetProvinceId && !targetDistrictId && !targetCityId && !targetAreaId) {
      const user = await prisma.user.findUnique({
        where: { id: guard.user.id },
        select: { districtId: true, cityId: true, areaId: true }
      });
      targetDistrictId = user?.districtId || null;
      targetCityId = user?.cityId || null;
      targetAreaId = user?.areaId || null;
    }

    const whereClause: any = {
      verificationStatus: "VERIFIED",
      isAvailable: true,
      user: {
        isActive: true
      }
    };

    if (targetAreaId) {
      whereClause.user.areaId = targetAreaId;
    } else if (targetCityId) {
      whereClause.user.cityId = targetCityId;
    } else if (targetDistrictId) {
      whereClause.user.districtId = targetDistrictId;
    } else if (targetProvinceId) {
      whereClause.user.district = { provinceId: targetProvinceId };
    }

    // Find highly rated providers in the target location
    const featuredProvider = await prisma.providerProfile.findFirst({
      where: whereClause,
      include: {
        user: { select: { name: true } }
      },
      orderBy: { rating: "desc" }
    });

    if (!featuredProvider) {
       // Fallback to a general active service
       const service = await prisma.service.findFirst({
         where: { isActive: true },
         orderBy: { createdAt: "desc" }
       });

       if (!service) return NextResponse.json({ success: true, data: null });

       return NextResponse.json({
         success: true,
         data: {
           type: "SERVICE",
           title: service.name,
           description: service.description,
           category: service.category,
           actionUrl: `/search?category=${service.category}`
         }
       });
    }

    return NextResponse.json({
      success: true,
      data: {
        type: "PROVIDER",
        title: featuredProvider.professionalTitle || "Expert Service",
        description: `Top-rated provider ${featuredProvider.user.name} is available in your area.`,
        providerName: featuredProvider.user.name,
        actionUrl: `/provider/${featuredProvider.id}`
      }
    });

  } catch (error: unknown) {
    logger.error("Featured API error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch featured content" }, { status: 500 });
  }
}
