import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TEST_PROVIDERS = [
  {
    firstName: "Ahmed",
    lastName: "Khan",
    email: "ahmed.plumbing@test.com",
    phone: "03001112221",
    title: "Expert Plumber",
    category: "Plumbing",
    description: "10+ years of experience in residential and commercial plumbing.",
    rate: 500,
  },
  {
    firstName: "Sajid",
    lastName: "Ali",
    email: "sajid.electric@test.com",
    phone: "03001112222",
    title: "Master Electrician",
    category: "Electrical",
    description: "Certified electrician for all types of wiring and repairs.",
    rate: 600,
  },
  {
    firstName: "Maria",
    lastName: "Bibi",
    email: "maria.clean@test.com",
    phone: "03001112223",
    title: "Professional Cleaner",
    category: "Cleaning",
    description: "Expert in deep cleaning and disinfection services.",
    rate: 400,
  }
];

async function main() {
  console.log("Starting seeding test providers...");
  
  // 1. Ensure Haripur is active
  let district = await prisma.district.findFirst({
    where: { name: "Haripur" }
  });

  if (!district) {
    console.log("Haripur not found, creating it...");
    // Need a province first
    let province = await prisma.province.findFirst();
    if (!province) {
      const country = await prisma.country.upsert({
        where: { code: 'PK' },
        update: {},
        create: { name: 'Pakistan', code: 'PK' }
      });
      province = await prisma.province.create({
        data: { name: 'KPK', countryId: country.id }
      });
    }
    district = await prisma.district.create({
      data: { name: "Haripur", provinceId: province.id, isActive: true }
    });
  } else if (!district.isActive) {
    console.log("Activating Haripur district...");
    district = await prisma.district.update({
      where: { id: district.id },
      data: { isActive: true }
    });
  }

  // 2. Ensure City & Area
  let city = await prisma.city.findFirst({ where: { districtId: district.id } });
  if (!city) {
    city = await prisma.city.create({ data: { name: "Haripur City", districtId: district.id } });
  }

  let area = await prisma.area.findFirst({ where: { cityId: city.id } });
  if (!area) {
    area = await prisma.area.create({ data: { name: "Khalabat Township", cityId: city.id, isActive: true } });
  } else if (!area.isActive) {
    area = await prisma.area.update({ where: { id: area.id }, data: { isActive: true } });
  }

  const cityId = city.id;
  const areaId = area.id;
  const districtId = district.id;

  if (!cityId || !areaId) {
    console.error("City or Area ID not found in Haripur.");
    return;
  }

  const commonPassword = await bcrypt.hash("Password123", 10);

  for (const p of TEST_PROVIDERS) {
    const existingEmail = await prisma.user.findUnique({ where: { email: p.email } });
    const existingPhone = await prisma.user.findFirst({ where: { phone: p.phone } });
    
    if (existingEmail || existingPhone) {
      console.log(`Skipping ${p.email} (already exists by email or phone)`);
      continue;
    }

    try {
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
      console.log(`Created provider: ${p.email}`);
    } catch (err: any) {
      console.error(`Failed to create ${p.email}:`);
      console.error(err);
      if (err.cause) console.error("CAUSE:", err.cause);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
