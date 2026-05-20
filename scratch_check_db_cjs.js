require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL || "",
  ssl: process.env.DATABASE_URL ? true : false
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== DB AUDIT FOR LOCATIONS ===");
  const parentId = '4c790c55-d043-4217-bd2c-bcb11fcf1cd7';
  
  // Exact Prisma query from app/api/locations/route.ts:60-71
  const rows = await prisma.city.findMany({
    where: { 
      districtId: parentId,
      isActive: true,
      district: { isActive: true, province: { isActive: true } }
    },
    orderBy: { name: 'asc' },
  });
  console.log("Simulated Locations API rows for cities:", rows);
  
  // Let's also check if district is active and its province is active
  const district = await prisma.district.findUnique({
    where: { id: parentId },
    include: { province: true }
  });
  console.log("District details:", district);
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => pool.end()));
