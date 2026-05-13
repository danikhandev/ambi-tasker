import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

export async function POST(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const userId = guard.user.id;

    // Check if user already has a provider profile
    const existingProfile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return NextResponse.json({
        success: true,
        message: "User is already registered as a provider",
        profile: existingProfile,
      });
    }

    const body = await req.json().catch(() => ({}));

    // Create a new provider profile
    const newProfile = await prisma.providerProfile.create({
      data: {
        userId,
        professionalTitle: body.professionalTitle || "Professional",
        serviceDescription: body.serviceDescription || "",
        verificationStatus: "NOT_SUBMITTED",
        experienceYears: 0,
        isAvailable: false,
      },
    });

    logger.info(`User ${userId} has applied to become a provider.`);

    return NextResponse.json({
      success: true,
      message: "Provider application initialized",
      profile: newProfile,
    });
  } catch (error: any) {
    logger.error("Error creating provider profile:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}