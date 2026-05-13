import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/providers/[id] — Get single provider details
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const providerId = id; // Note: id in this context is the general ID. Let's find by profile ID.
    // Provider profile ID or User ID? 
    // In our schema, ProviderProfile has its own `id`, and it references `userId`.
    // Frontend is passing `search/[id]` which used to be `profiles.id` in Supabase.
    // So we assume the ID passed is either `ProviderProfile.id` or `User.id`. Let's check both for safety, but typically `ProviderProfile.id`.
    
    let profile = await prisma.providerProfile.findUnique({
      where: { id: providerId },
      include: {
        user: { select: { id: true, name: true, profileImage: true, district: { select: { name: true } }, area: { select: { name: true } }, phone: true, email: true } },
        serviceAreas: true,
      }
    });

    if (!profile) {
      // Try by userId just in case
      profile = await prisma.providerProfile.findUnique({
        where: { userId: providerId },
        include: {
          user: { select: { id: true, name: true, profileImage: true, district: { select: { name: true } }, area: { select: { name: true } }, phone: true, email: true } },
          serviceAreas: true,
        }
      });
    }

    if (!profile) {
      return NextResponse.json({ success: false, error: "Provider not found" }, { status: 404 });
    }

    // Now, finding related information for the provider
    // Portfolio, services, reviews (we can fetch from related models if they exist)
    const [services, reviews, bookingsCount] = await Promise.all([
      prisma.service.findMany({ where: { category: profile.professionalTitle || "", isActive: true } }), 
      
      prisma.review.findMany({ 
        where: { providerId: profile.id },
        include: { user: { select: { name: true, profileImage: true } } },
        orderBy: { createdAt: 'desc' }
      }),

      prisma.booking.count({ where: { providerId: profile.id, status: 'Completed' } })
    ]);

    const data = {
      id: profile.id,
      userId: profile.userId,
      name: profile.user.name,
      title: profile.professionalTitle,
      category: profile.professionalTitle,
      avatar: profile.user.profileImage,
      rating: profile.rating,
      ratingCount: profile.ratingCount,
      jobsCompleted: bookingsCount,
      hourlyRate: profile.hourlyRate,
      bio: profile.serviceDescription,
      experience: profile.experienceYears ? `${profile.experienceYears} Years` : "Verified",
      district: profile.user.district?.name || 'Islamabad',
      area: profile.user.area?.name || 'Main',
      skills: profile.skills || [],
      education: "Verified Expert",
      services: (profile.servicesList as any) || services.map((s: any) => ({ id: s.id, title: s.name, price: s.price, type: "FIXED" })),
      portfolio: (profile.portfolio as any) || [],
      contact: profile.user.phone,
      email: profile.user.email,
      reviews: reviews.map((r: any) => ({
          id: r.id,
          user: {
            full_name: r.user.name,
            profile_image: r.user.profileImage
          },
          rating: r.rating,
          comment: r.comment,
          created_at: r.createdAt
      })),
      verificationStatus: profile.verificationStatus,
    };

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    logger.error("Provider details GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch provider details" },
      { status: 500 }
    );
  }
}
