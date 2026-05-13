import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/providers/location — Update provider's live location
 * Body: { latitude, longitude }
 */
export async function PATCH(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    if (guard.user.role !== "PROVIDER") {
      return NextResponse.json({ success: false, error: "Only providers can update their location" }, { status: 403 });
    }

    const { latitude, longitude } = await req.json();

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ success: false, error: "Latitude and longitude are required" }, { status: 400 });
    }

    const updated = await prisma.providerProfile.update({
      where: { userId: guard.user.id },
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        locationUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Location updated successfully",
      data: {
        latitude: updated.latitude,
        longitude: updated.longitude,
        updatedAt: updated.locationUpdatedAt,
      },
    });
  } catch (error: unknown) {
    logger.error("Provider location update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update location" }, { status: 500 });
  }
}
