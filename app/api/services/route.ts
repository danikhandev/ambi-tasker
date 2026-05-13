import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/services — List all active services
 * Query: ?category=xxx&search=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = { isActive: true };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const services = await prisma.service.findMany({
      where: where as any,
      orderBy: { name: "asc" },
    });

    // Get unique categories
    const categories = await prisma.service.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: services,
      categories: categories.map((c) => c.category),
    });
  } catch (error: unknown) {
    logger.error("Services GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/services — Create a service (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, price, description, icon } = body;

    if (!name || !category || price === undefined || !description) {
      return NextResponse.json(
        { success: false, error: "name, category, price, and description are required" },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        name,
        category,
        price: parseFloat(price),
        description,
        icon: icon || null,
      },
    });

    return NextResponse.json({ success: true, data: service }, { status: 201 });
  } catch (error: unknown) {
    logger.error("Service create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create service" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/services — Update a service (admin only)
 * Body: { id, ...fields }
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Service id is required" },
        { status: 400 }
      );
    }

    if (updateData.price !== undefined) {
      updateData.price = parseFloat(updateData.price);
    }

    const updated = await prisma.service.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    logger.error("Service update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update service" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/services — Soft-delete a service
 * Body: { id }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Service id is required" },
        { status: 400 }
      );
    }

    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "Service deactivated" });
  } catch (error: unknown) {
    logger.error("Service delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete service" },
      { status: 500 }
    );
  }
}