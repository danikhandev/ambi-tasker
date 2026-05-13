import { NextRequest, NextResponse } from "next/server";
import { userGuard } from "@/services/auth/guards";
import { prisma } from "@/services/prisma";

export async function POST(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    if (guard.user.role !== "PROVIDER") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { latitude, longitude } = body;

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ success: false, error: "Missing coordinates" }, { status: 400 });
    }

    const providerProfile = await prisma.providerProfile.update({
      where: { userId: guard.user.id },
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        locationUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: { latitude, longitude, updatedAt: providerProfile.locationUpdatedAt } });
  } catch (error: any) {
    console.error("Update location error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
