import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";
import { validateLocationHierarchy } from "@/utils/location-validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/profile — Get current user's profile from JWT
 */
export async function GET(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const dbUser = await prisma.user.findUnique({
      where: { id: guard.user.id },
      include: {
        providerProfile: {
          include: {
            serviceAreas: true,
          },
        },
        area: true,
        city: true,
        district: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    const transformedUser = {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.name.split(" ")[0],
      lastName: dbUser.name.split(" ").slice(1).join(" "),
      avatar: dbUser.profileImage,
      role: dbUser.role,
      phone: dbUser.phone,
      address: dbUser.area
        ? `${dbUser.area.name}, ${dbUser.district?.name || ""}`
        : dbUser.address || null,
      isEmailVerified: dbUser.isEmailVerified,
      isPhoneVerified: dbUser.isPhoneVerified,
      idVerificationStatus:
        dbUser.providerProfile?.verificationStatus || "NOT_STARTED",
      isUserSignUpForProvider: !!dbUser.providerProfile,
      districtId: dbUser.districtId,
      cityId: dbUser.cityId,
      areaId: dbUser.areaId,
      providerProfile: dbUser.providerProfile
        ? {
            id: dbUser.providerProfile.id,
            professionalTitle: dbUser.providerProfile.professionalTitle,
            serviceDescription: dbUser.providerProfile.serviceDescription,
            hourlyRate: dbUser.providerProfile.hourlyRate,
            experienceYears: dbUser.providerProfile.experienceYears,
            verificationStatus: dbUser.providerProfile.verificationStatus,
            rejectionReason: dbUser.providerProfile.rejectionReason,
            rating: dbUser.providerProfile.rating,
            ratingCount: dbUser.providerProfile.ratingCount,
            earnings: dbUser.providerProfile.earnings,
            isAvailable: dbUser.providerProfile.isAvailable,
            serviceAreas: dbUser.providerProfile.serviceAreas,
          }
        : null,
    };

    return NextResponse.json({ success: true, user: transformedUser });
  } catch (error: unknown) {
    logger.error("Profile fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile — Update current user's profile
 */
export async function PATCH(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const body = await req.json();
    const { 
      name, phone, address, profileImage, 
      districtId, cityId, areaId,
      professionalTitle, serviceDescription, hourlyRate, experienceYears, isAvailable,
      serviceAreaIds 
    } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    // Location Updates (Primary)
    if (districtId || cityId || areaId) {
       const locValidation = await validateLocationHierarchy(districtId, cityId, areaId);
       if (!locValidation.isValid) {
         return NextResponse.json({ success: false, error: locValidation.error }, { status: 400 });
       }
       
       if (districtId) updateData.districtId = districtId;
       if (cityId !== undefined) updateData.cityId = (cityId === null || cityId === "") ? null : cityId;
       if (areaId !== undefined) updateData.areaId = (areaId === null || areaId === "") ? null : areaId;
    }

    // Provider Side Updates
    if (guard.user.role === "PROVIDER") {
      const providerData: any = {};
      if (professionalTitle !== undefined) providerData.professionalTitle = professionalTitle;
      if (serviceDescription !== undefined) providerData.serviceDescription = serviceDescription;
      if (hourlyRate !== undefined) providerData.hourlyRate = parseFloat(hourlyRate);
      if (experienceYears !== undefined) providerData.experienceYears = parseInt(experienceYears);
      if (isAvailable !== undefined) {
        if (isAvailable === true) {
          const currentProfile = await prisma.providerProfile.findUnique({
            where: { userId: guard.user.id },
            select: { verificationStatus: true }
          });
          if (currentProfile?.verificationStatus !== "VERIFIED") {
            return NextResponse.json(
              { success: false, error: "Access Denied: You must complete KYC verification to go online." },
              { status: 403 }
            );
          }
        }
        providerData.isAvailable = !!isAvailable;
      }

      if (serviceAreaIds && Array.isArray(serviceAreaIds)) {
        // Validate all service area IDs
        for (const id of serviceAreaIds) {
           const v = await validateLocationHierarchy(null, null, id);
           if (!v.isValid) return NextResponse.json({ success: false, error: `Invalid service area ID: ${id}` }, { status: 400 });
        }
        providerData.serviceAreas = {
          set: serviceAreaIds.map(id => ({ id }))
        };
      }

      if (Object.keys(providerData).length > 0) {
        updateData.providerProfile = {
          update: providerData
        };
      }
    }

    const updated = await prisma.user.update({
      where: { id: guard.user.id },
      data: updateData,
      include: { providerProfile: { include: { serviceAreas: true } } }
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated",
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        profileImage: updated.profileImage,
      },
    });
  } catch (error: unknown) {
    logger.error("Profile update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}