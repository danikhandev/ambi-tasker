import { prisma } from "@/services/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || "";
    const category = searchParams.get('category');
    const districtId = searchParams.get('districtId');
    const cityId = searchParams.get('cityId');
    const areaId = searchParams.get('areaId');
    const minRating = parseFloat(searchParams.get('minRating') || "0");
    const maxPrice = parseFloat(searchParams.get('maxPrice') || "1000000");

    const where: any = {
      role: 'PROVIDER',
      providerProfile: {
        isNot: null,
        verificationStatus: 'VERIFIED', // Usually only show verified ones
        rating: { gte: minRating },
        hourlyRate: { lte: maxPrice },
      }
    };

    // Filter by name or title
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { providerProfile: { professionalTitle: { contains: query, mode: 'insensitive' } } },
        { providerProfile: { serviceDescription: { contains: query, mode: 'insensitive' } } }
      ];
    }

    // New Hierarchical Location Filtering
    // Logic: A provider shows up if they have coverage in the requested area/city/district
    if (areaId) {
      where.providerProfile.serviceAreas = { some: { id: areaId } };
    } else if (cityId) {
      where.providerProfile.serviceAreas = { some: { cityId: cityId } };
    } else if (districtId) {
      where.providerProfile.serviceAreas = { some: { city: { districtId: districtId } } };
    }

    // Filter by category
    if (category && category !== "All") {
      where.providerProfile.professionalTitle = { contains: category, mode: 'insensitive' };
    }

    const providers = await prisma.user.findMany({
      where,
      include: {
        providerProfile: {
          include: {
            serviceAreas: {
              include: {
                city: {
                  include: {
                    district: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        providerProfile: {
          rating: 'desc'
        }
      }
    });

    // Transform for frontend
    const results = providers.map((u: any) => ({
      id: u.id,
      name: u.name,
      title: u.providerProfile?.professionalTitle,
      rating: u.providerProfile?.rating,
      hourlyRate: u.providerProfile?.hourlyRate,
      bio: u.providerProfile?.serviceDescription,
      avatar: u.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
      // Show their primary location or coverage summary
      location: u.providerProfile?.serviceAreas?.[0]?.name || "Pakistan",
      district: u.providerProfile?.serviceAreas?.[0]?.city?.district?.name || "Multiple",
    }));

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Search API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
