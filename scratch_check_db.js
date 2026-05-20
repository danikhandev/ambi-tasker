const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== DB AUDIT FOR LOCATIONS ===");
  const countries = await prisma.country.findMany();
  console.log("Countries count:", countries.length, countries);
  
  const provinces = await prisma.province.findMany();
  console.log("Provinces count:", provinces.length, provinces);
  
  const districts = await prisma.district.findMany();
  console.log("Districts count:", districts.length, districts);
  
  const cities = await prisma.city.findMany();
  console.log("Cities count:", cities.length, cities);
}

main().catch(console.error).finally(() => prisma.$disconnect());
