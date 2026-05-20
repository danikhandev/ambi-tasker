import { prisma } from "./services/prisma";
import "dotenv/config";

async function main() {
  console.log("=== DB AUDIT FOR LOCATIONS ===");
  try {
    const countries = await prisma.country.findMany();
    console.log("Countries count:", countries.length, countries);
    
    const provinces = await prisma.province.findMany();
    console.log("Provinces count:", provinces.length, provinces);
    
    const districts = await prisma.district.findMany();
    console.log("Districts count:", districts.length, districts);
    
    const cities = await prisma.city.findMany();
    console.log("Cities count:", cities.length, cities);
    
    const areas = await prisma.area.findMany();
    console.log("Areas count:", areas.length);
  } catch (err) {
    console.error("Error during database query:", err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
