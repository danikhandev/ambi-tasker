import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { adminGuard } from "@/services/auth/guards";

export async function GET(req: NextRequest) {
  try {
    const guard = await adminGuard(req);
    if (!guard.success) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const posters = await (prisma as any).poster.findMany({
      orderBy: { order: "asc" }
    });
    return NextResponse.json({ success: true, data: posters });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await adminGuard(req);
    if (!guard.success) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const poster = await (prisma as any).poster.create({
      data: {
        title: body.title,
        subtitle: body.subtitle,
        imageUrl: body.imageUrl,
        link: body.link,
        buttonText: body.buttonText,
        color: body.color,
        order: body.order || 0,
        isActive: body.isActive !== undefined ? body.isActive : true
      }
    });

    return NextResponse.json({ success: true, data: poster });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const guard = await adminGuard(req);
    if (!guard.success) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...data } = body;

    const poster = await (prisma as any).poster.update({
      where: { id },
      data
    });

    return NextResponse.json({ success: true, data: poster });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const guard = await adminGuard(req);
    if (!guard.success) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    await (prisma as any).poster.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Poster deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
