import { NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function GET() {
  try {
    const existingCount = await prisma.poster.count();
    if (existingCount > 0) {
      return NextResponse.json({ success: true, message: "Posters already seeded" });
    }

    const posters = [
      {
        title: "Expert Electricians",
        subtitle: "Safe & reliable electrical solutions for your home",
        imageUrl: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?q=80&w=1200&h=400&fit=crop",
        color: "from-blue-600/80 to-blue-900/80",
        link: "/search?category=electrician-services",
        order: 1
      },
      {
        title: "Master Plumbers",
        subtitle: "Modern plumbing services for a leak-free life",
        imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&h=400&fit=crop",
        color: "from-indigo-600/80 to-indigo-900/80",
        link: "/search?category=plumber-services",
        order: 2
      },
      {
        title: "House Maintenance",
        subtitle: "Complete home care from top-rated professionals",
        imageUrl: "https://images.unsplash.com/photo-1581578736256-4b4ed5eaa5d1?q=80&w=1200&h=400&fit=crop",
        color: "from-emerald-600/80 to-emerald-900/80",
        link: "/search?category=home-renovation",
        order: 3
      }
    ];

    await prisma.poster.createMany({
      data: posters
    });

    return NextResponse.json({ success: true, message: "Posters seeded successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
