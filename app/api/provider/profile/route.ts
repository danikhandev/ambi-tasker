import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/provider/profile — Get current provider's profile
 */
export async function GET(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const profile = await prisma.providerProfile.findUnique({
      where: { userId: guard.user.id },
      include: {
        user: {
          select: {
            id: true, name: true, email: true, phone: true,
            profileImage: true, district: true, area: true,
          },
        },
        serviceAreas: true,
        bookings: {
          where: { status: "Completed" },
          select: { id: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Provider profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        completedJobs: profile.bookings.length,
      },
    });
  } catch (error: unknown) {
    logger.error("Provider profile GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch provider profile" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/provider/profile — Update provider profile
 */
export async function PATCH(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const body = await req.json();
    const {
      professionalTitle,
      serviceDescription,
      hourlyRate,
      experienceYears,
      isAvailable,
      portfolio,
      servicesList,
      skills,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (professionalTitle !== undefined) updateData.professionalTitle = professionalTitle;
    if (serviceDescription !== undefined) updateData.serviceDescription = serviceDescription;
    if (hourlyRate !== undefined) updateData.hourlyRate = parseFloat(hourlyRate);
    if (experienceYears !== undefined) updateData.experienceYears = parseInt(experienceYears);
    if (isAvailable !== undefined) {
      if (isAvailable === true) {
        const currentProfile = await prisma.providerProfile.findUnique({
          where: { userId: guard.user.id },
          select: { verificationStatus: true }
        });
        if (currentProfile?.verificationStatus !== "VERIFIED") {
          return NextResponse.json(
            { success: false, error: "Access Denied: You must complete KYC verification to go online.", code: "UNVERIFIED_PROVIDER" },
            { status: 403 }
          );
        }
      }
      updateData.isAvailable = isAvailable;
    }
    if (portfolio !== undefined) updateData.portfolio = portfolio;
    if (servicesList !== undefined) updateData.servicesList = servicesList;
    if (skills !== undefined) updateData.skills = skills;

    const updated = await prisma.providerProfile.update({
      where: { userId: guard.user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated",
      data: updated,
    });
  } catch (error: unknown) {
    logger.error("Provider profile update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update provider profile" },
      { status: 500 }
    );
  }
}
