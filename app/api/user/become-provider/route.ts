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

    // Validate service categories for production-level providers
    if (body.accountLevel === "PRODUCTION") {
      const categories = body.serviceCategories || [];
      if (!Array.isArray(categories) || categories.length === 0) {
        return NextResponse.json({ success: false, error: "At least one service category must be selected for production-level providers." }, { status: 400 });
      }
      if (categories.length > 1) {
        return NextResponse.json({ success: false, error: "Production-level providers can select only one service category." }, { status: 400 });
      }
    }

    // Create a new provider profile
    const newProfile = await prisma.providerProfile.create({
      data: {
        userId,
        professionalTitle: body.professionalTitle || "Professional",
        serviceDescription: body.serviceDescription || "",
        verificationStatus: "NOT_SUBMITTED",
        experienceYears: 0,
        isAvailable: false,
        // Store the selected category if provided
        servicesList: body.serviceCategories ? body.serviceCategories : undefined,
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