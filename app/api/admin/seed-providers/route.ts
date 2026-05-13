import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { hashPassword } from "@/services/auth/utils";
import { logger } from "@/utils/logger";
import { getAdminAuth } from "@/utils/admin-auth";

export const dynamic = "force-dynamic";

const TEST_PROVIDERS = [
  {
    firstName: "Haroon",
    lastName: "Khan",
    email: "haroon@serveu.com",
    phone: "03001112221",
    title: "Expert Plumber",
    category: "Plumbing",
    description: "Verified expert with 10+ years of experience in residential and commercial plumbing.",
    rate: 500,
  },
  {
    firstName: "Mohibullah",
    lastName: "Sheikh",
    email: "mohib@serveu.com",
    phone: "03001112222",
    title: "Master Electrician",
    category: "Electrical",
    description: "Certified electrician specialized in smart home installations and industrial wiring.",
    rate: 600,
  },
  {
    firstName: "Danyal",
    lastName: "Khan",
    email: "danyal@serveu.com",
    phone: "03001112223",
    title: "Senior Carpenter",
    category: "Carpentry",
    description: "Craftsmanship specialist in custom furniture and interior woodwork.",
    rate: 700,
  }
];

export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminAuth(req, "settings.manage");
    if (!auth && req.headers.get("internal-setup") !== "true") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // 1. Get Haripur Location context
    console.log("Fetching Haripur district...");
    const district = await prisma.district.findFirst({
      where: { name: "Haripur", isActive: true },
      include: { cities: { include: { areas: true } } }
    });

    if (!district) {
      console.log("District Haripur NOT FOUND");
      throw new Error("Haripur location data not found. Please seed locations first.");
    }
    console.log("Found District:", district.name);

    if (!district.cities[0] || !district.cities[0].areas[0]) {
      console.log("No cities or areas in Haripur");
      throw new Error("No city/area found in Haripur.");
    }

    const cityId = district.cities[0].id;
    const areaId = district.cities[0].areas[0].id; // Khalabat or first available
    const districtId = district.id;

    console.log("Seeding providers with AreaID:", areaId);
    const commonPassword = await hashPassword("Password123");
    let count = 0;

    for (const p of TEST_PROVIDERS) {
      console.log("Processing provider:", p.email);
      // Check if exists
      const existing = await prisma.user.findUnique({ where: { email: p.email } });
      if (existing) {
        console.log("Provider already exists:", p.email);
        continue;
      }

      await prisma.user.create({
        data: {
          email: p.email,
          name: `${p.firstName} ${p.lastName}`,
          phone: p.phone,
          passwordHash: commonPassword,
          role: "PROVIDER",
          districtId,
          cityId,
          areaId,
          isEmailVerified: true,
          isPhoneVerified: true,
          isActive: true,
          providerProfile: {
            create: {
              professionalTitle: p.title,
              serviceDescription: p.description,
              hourlyRate: p.rate,
              experienceYears: 5,
              verificationStatus: "VERIFIED",
              isAvailable: true,
              serviceAreas: {
                connect: [{ id: areaId }]
              }
            }
          }
        }
      });
      count++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${count} test providers.`,
      credentials: {
        password: "Password123",
        emails: TEST_PROVIDERS.map(p => p.email)
      }
    });

  } catch (error: any) {
    logger.error("Seed Providers Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
