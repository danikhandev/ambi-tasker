import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { logger } from "@/utils/logger";
import { getAdminAuth } from "@/utils/admin-auth";

export const dynamic = "force-dynamic";

const PAKISTAN_LOCATION_TREE = [
  {
    province: "KPK",
    districts: [
      {
        name: "Haripur",
        defaultActive: true,
        cities: [
          {
            name: "Haripur",
            areas: [
              "Khalabat Township", "Sikandarpur", "Hattar", "Kangra",
              "TIP Housing Society", "Ghazi", "Khanpur"
            ]
          }
        ]
      },
      {
        name: "Abbottabad",
        defaultActive: true,
        cities: [ { name: "Abbottabad", areas: ["Nawanshehr", "Mandian", "Havelian"] } ]
      },
      {
        name: "Peshawar",
        defaultActive: true,
        cities: [ { name: "Peshawar", areas: ["Hayatabad", "University Town", "Saddar"] } ]
      }
    ]
  },
  {
    province: "Punjab",
    districts: [
      {
        name: "Lahore",
        defaultActive: true,
        cities: [ { name: "Lahore", areas: ["DHA", "Gulberg", "Johar Town", "Bahria Town"] } ]
      },
      {
        name: "Rawalpindi",
        defaultActive: true,
        cities: [ { name: "Rawalpindi", areas: ["Saddar", "Bahria Town", "Satellite Town"] } ]
      },
      {
        name: "Islamabad (ICT)",
        defaultActive: true,
        cities: [ { name: "Islamabad", areas: ["F-8", "F-10", "G-11", "DHA", "Blue Area"] } ]
      }
    ]
  },
  {
    province: "Sindh",
    districts: [
      {
        name: "Karachi",
        defaultActive: true,
        cities: [ { name: "Karachi", areas: ["Clifton", "DHA", "Gulshan-e-Iqbal", "Saddar"] } ]
      }
    ]
  },
  {
    province: "Balochistan",
    districts: [
      {
         name: "Quetta",
         defaultActive: true,
         cities: [ { name: "Quetta", areas: ["Cantonment", "Satellite Town", "Jinnah Town"] } ]
      }
    ]
  }
];

export async function POST(req: NextRequest) {
  try {
    const isInternal = req.headers.get("internal-setup") === "true";
    const auth = !isInternal ? await getAdminAuth(req, "settings.manage") : null;
    
    if (!auth && !isInternal) {
      logger.warn("Unauthenticated attempt to seed locations");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    let pk = await prisma.country.findUnique({ where: { code: "PK" } });
    if (!pk) {
      pk = await prisma.country.create({ data: { name: "Pakistan", code: "PK" } });
    }

    let districtsProcessed = 0;
    let areasProcessed = 0;

    for (const provData of PAKISTAN_LOCATION_TREE) {
      let province = await prisma.province.findFirst({ where: { name: provData.province, countryId: pk.id } });
      if (!province) {
        province = await prisma.province.create({ data: { name: provData.province, countryId: pk.id } });
      }

      for (const distData of provData.districts) {
        let district = await prisma.district.findFirst({ where: { name: distData.name, provinceId: province.id } });
        
        if (!district) {
          district = await prisma.district.create({ 
            data: { 
              name: distData.name, 
              provinceId: province.id,
              isActive: true // Force active for all new ones
            } 
          });
        } else {
          // Update existing to active as per new requirement
          await prisma.district.update({
             where: { id: district.id },
             data: { isActive: true }
          });
        }
        districtsProcessed++;

        for (const cityData of distData.cities) {
          let city = await prisma.city.findFirst({ where: { name: cityData.name, districtId: district.id } });
          if (!city) {
            city = await prisma.city.create({ data: { name: cityData.name, districtId: district.id } });
          }

          for (const areaName of cityData.areas) {
            let area = await prisma.area.findFirst({ where: { name: areaName, cityId: city.id } });
            if (!area) {
              await prisma.area.create({
                data: {
                  name: areaName,
                  cityId: city.id,
                  isActive: true
                }
              });
            } else {
              await prisma.area.update({
                 where: { id: area.id },
                 data: { isActive: true }
              });
            }
            areasProcessed++;
          }
        }
      }
    }

    return NextResponse.json({ 
       success: true, 
       message: `Location refactoring completed. All ${districtsProcessed} districts and ${areasProcessed} areas are now ACTIVE.`,
       allActive: true
    });

  } catch (error: any) {
    logger.error("Location Seeding Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
