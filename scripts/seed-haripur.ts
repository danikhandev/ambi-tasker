import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: true
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("📍 Seeding Production Haripur Data...");

  const pakistan = await prisma.country.upsert({
    where: { code: "PK" },
    update: {},
    create: { name: "Pakistan", code: "PK" },
  });

  const kpk = await prisma.province.upsert({
    where: { name_countryId: { name: "Khyber Pakhtunkhwa", countryId: pakistan.id } },
    update: {},
    create: { name: "Khyber Pakhtunkhwa", countryId: pakistan.id },
  });

  const haripur = await prisma.district.upsert({
    where: { name_provinceId: { name: "Haripur", provinceId: kpk.id } },
    update: { isActive: true },
    create: { name: "Haripur", provinceId: kpk.id, isActive: true },
  });

  const haripurCity = await prisma.city.upsert({
    where: { name_districtId: { name: "Haripur City", districtId: haripur.id } },
    update: { isActive: true },
    create: { name: "Haripur City", districtId: haripur.id, isActive: true },
  });

  const areas = [
    "Khalabat Township",
    "Sarai Saleh",
    "Hattar",
    "Khanpur",
    "Ghazi",
    "Jabri",
    "Pind Hashim Khan",
    "Beer",
    "Panian",
    "Bagra"
  ];

  for (const areaName of areas) {
    await prisma.area.upsert({
      where: { name_cityId: { name: areaName, cityId: haripurCity.id } },
      update: { isActive: true },
      create: { name: areaName, cityId: haripurCity.id, isActive: true },
    });
  }

  console.log(`✅ Successfully seeded ${areas.length} areas in Haripur.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
