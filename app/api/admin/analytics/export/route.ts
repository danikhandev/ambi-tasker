import { NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "bookings";

    let csvContent = "";
    
    if (type === "bookings") {
      const bookings = await prisma.booking.findMany({
        include: {
          customer: true,
          provider: { include: { user: true } },
          service: true
        }
      });

      csvContent = "ID,Customer,Provider,Service,Amount,Status,Date,Location\n";
      bookings.forEach(b => {
        csvContent += `${b.id},${b.customer.name},${b.provider.user.name},${b.service.name},${b.totalPrice},${b.status},${b.createdAt.toISOString()},"${b.location.replace(/"/g, '""')}"\n`;
      });
    } else if (type === "users") {
      const users = await prisma.user.findMany();
      csvContent = "ID,Name,Email,Role,Joined\n";
      users.forEach(u => {
        csvContent += `${u.id},${u.name},${u.email},${u.role},${u.createdAt.toISOString()}\n`;
      });
    }

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=ambitasker_${type}_export_${new Date().toISOString().slice(0,10)}.csv`
      }
    });

  } catch (error: any) {
    console.error("Export Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
