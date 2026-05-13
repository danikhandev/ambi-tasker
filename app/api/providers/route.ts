import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/providers — Public listing of verified providers
 * Query: ?category=xxx&search=xxx&areaId=xxx&districtId=xxx&limit=20&page=1
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const areaId = searchParams.get("areaId");
    const districtId = searchParams.get("districtId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);

    const conditions: any[] = [
      { isAvailable: true },
      { user: { isActive: true } },
      { verificationStatus: "VERIFIED" } // Only show verified professionals in public search
    ];

    // --- Search Logic (Query based) ---
    if (search) {
      conditions.push({
        OR: [
          { professionalTitle: { contains: search, mode: "insensitive" } },
          { serviceDescription: { contains: search, mode: "insensitive" } },
          { skills: { hasSome: [search] } }, // Check skills array
          { user: { name: { contains: search, mode: "insensitive" } } },
        ],
      });
    }

    // --- Category Logic (Dropdown based) ---
    if (category && category !== "All") {
      const urduCategory = category === "Electrician" ? "الیکٹریشن" : 
                           category === "Plumber" ? "پلمبر" :
                           category === "Mechanic" ? "مکینک" :
                           category === "Painting" ? "پینٹنگ" :
                           category === "Cleaning" ? "صفائی" : null;

      conditions.push({
        OR: [
          { professionalTitle: { contains: category, mode: "insensitive" } },
          { serviceDescription: { contains: category, mode: "insensitive" } },
          { skills: { hasSome: [category] } },
          ...(urduCategory ? [
            { professionalTitle: { contains: urduCategory, mode: "insensitive" } },
            { serviceDescription: { contains: urduCategory, mode: "insensitive" } },
            { skills: { hasSome: [urduCategory] } }
          ] : [])
        ]
      });
    }

    // --- Location Filtering (Strict but smart) ---
    if (areaId) {
      conditions.push({
        OR: [
          { areaId: areaId }, // Direct link in profile
          { user: { areaId: areaId } }, // Link via user record
          { serviceAreas: { some: { id: areaId, isActive: true } } } // Link via serving regions
        ]
      });
    } else if (districtId) {
      conditions.push({
        OR: [
          { user: { districtId: districtId } },
          { user: { city: { districtId: districtId } } }, // Traverse City to District
          { serviceAreas: { some: { city: { districtId: districtId, isActive: true } } } }
        ]
      });
    }

    const where = { AND: conditions };
    logger.info("Search Conditions:", JSON.stringify(where, null, 2));

    const [providers, total] = await Promise.all([
      prisma.providerProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              district: { select: { name: true } },
              area: { select: { name: true } },
            },
          },
          serviceAreas: { select: { id: true, name: true } },
          _count: { select: { bookings: true } },
        },
        orderBy: [{ rating: "desc" }, { ratingCount: "desc" }],
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.providerProfile.count({ where }),
    ]);

    const data = providers.map((p) => ({
      id: p.id,
      userId: p.userId,
      name: p.user.name,
      avatar: p.user.profileImage, // Alias
      profileImage: p.user.profileImage,
      title: p.professionalTitle, // Alias
      professionalTitle: p.professionalTitle,
      bio: p.serviceDescription, // Alias
      serviceDescription: p.serviceDescription,
      hourlyRate: p.hourlyRate,
      experienceYears: p.experienceYears,
      rating: p.rating,
      ratingCount: p.ratingCount,
      isAvailable: p.isAvailable,
      location: p.user.district?.name || "",
      area: p.user.area?.name || "",
      serviceAreas: p.serviceAreas,
      completedJobs: p._count.bookings,
      verificationStatus: p.verificationStatus,
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    logger.error("Providers listing error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch providers" },
      { status: 500 }
    );
  }
}
