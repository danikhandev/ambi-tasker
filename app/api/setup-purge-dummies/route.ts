import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function GET() {
  try {
    const dummyEmails = [
      "provider1@test.com",
      "provider2@test.com",
      "provider3@test.com",
      "mohibullah@test.com",
      "haroon@test.com",
      "danyalkhan@gmail.com"
    ];

    const { count: userCount } = await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { in: dummyEmails } },
          { email: { endsWith: "@test.com" } },
          { email: { endsWith: "@dummy.com" } },
          { name: { contains: "Test Provider" } }
        ],
        role: { not: "ADMIN" }
      }
    });

    return NextResponse.json({ success: true, message: `Removed ${userCount} dummy accounts.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
