import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAdminAuth } from "@/utils/admin-auth";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req, "services.manage");
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const services = await prisma.service.findMany({
      select: { category: true }
    });

    const uniqueCategories = Array.from(new Set(services.map(s => s.category).filter(Boolean)));

    const categoriesList = uniqueCategories.map(cat => ({
      id: cat,
      category_name: cat,
      icon: "Layers",
      icon_color: "bg-indigo-600",
      description: `Auto-generated category for ${cat}`,
      provider_count: 0,
      status: "active",
      updated_at: new Date()
    }));

    return NextResponse.json({ success: true, data: categoriesList });
  } catch (error: unknown) {
    logger.error("Categories GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ success: true, message: "Categories are managed dynamically via Services in this version." });
}

export async function PATCH(req: NextRequest) {
  return NextResponse.json({ success: true, message: "Categories are managed dynamically via Services in this version." });
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ success: true, message: "Categories are managed dynamically via Services in this version." });
}
