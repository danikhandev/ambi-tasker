import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import { createClient } from '@supabase/supabase-js';
import "dotenv/config";

// --- DATABASE SETUP ---
const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: true
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- SUPABASE SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function hashPwd(pwd: string) {
  return bcrypt.hash(pwd, 10);
}

async function main() {
  console.log("🚀 STARTING FULL SYSTEM INITIALIZATION...\n");

  // ─── 1. DATABASE SEEDING ───
  console.log("📦 Step 1: Seeding Database...");

  // Locations
  console.log("  📍 Seeding locations...");
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
    update: {},
    create: { name: "Haripur City", districtId: haripur.id },
  });

  const areas = ["Haripur City", "Khanpur", "Ghazi", "Hattar", "Sarai Saleh", "Khalabat Township"];
  for (const areaName of areas) {
    await prisma.area.upsert({
      where: { name_cityId: { name: areaName, cityId: haripurCity.id } },
      update: { isActive: true },
      create: { name: areaName, cityId: haripurCity.id, isActive: true },
    });
  }

  // Services
  console.log("  🔧 Seeding services...");
  const servicesData = [
    { name: "Plumbing Repair", category: "Plumbing", price: 2000, description: "Fix leaks, pipes, and drainage issues" },
    { name: "House Wiring", category: "Electrician", price: 8000, description: "Complete house wiring and rewiring" },
    { name: "Deep Home Clean", category: "Home Cleaning", price: 5000, description: "Thorough top-to-bottom cleaning" },
    { name: "AC Service", category: "AC Service", price: 2500, description: "AC gas refill, cleaning, and maintenance" },
  ];

  for (const s of servicesData) {
    await prisma.service.upsert({
      where: { id: `svc-${s.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: { price: s.price, description: s.description },
      create: { id: `svc-${s.name.toLowerCase().replace(/\s+/g, "-")}`, ...s },
    });
  }

  // Admin
  console.log("  👑 Seeding admin...");
  const adminPwd = await hashPwd("dhambit..**");
  await prisma.user.upsert({
    where: { email: "ambitasker@gmail.com" },
    update: { role: "ADMIN", isActive: true },
    create: {
      email: "ambitasker@gmail.com",
      name: "System Administrator",
      passwordHash: adminPwd,
      role: "ADMIN",
      isEmailVerified: true,
      isActive: true,
    },
  });

  await prisma.admin.upsert({
    where: { email: "ambitasker@gmail.com" },
    update: { role: "SUPER_ADMIN", status: "active" },
    create: {
      email: "ambitasker@gmail.com",
      name: "System Administrator",
      passwordHash: adminPwd,
      role: "SUPER_ADMIN",
      status: "active",
      permissions: [
        "overview.view", "users.manage", "providers.manage", "bookings.manage", 
        "payments.view", "services.manage", "notifications.manage", 
        "settings.manage", "admins.manage", "reports.view", "analytics.view"
      ],
    },
  });
  console.log("  ✅ Database seeding successful.\n");

  // ─── 2. STORAGE SETUP ───
  console.log("📂 Step 2: Setting up Storage Buckets...");
  const buckets = [
    { id: 'admin-avatars', public: true },
    { id: 'profile-images', public: true },
    { id: 'kyc-documents', public: false },
    { id: 'posters', public: true },
  ];

  for (const bucket of buckets) {
    const { data } = await supabase.storage.getBucket(bucket.id);
    if (!data) {
      console.log(`  ⏳ Creating bucket: ${bucket.id}...`);
      const { error } = await supabase.storage.createBucket(bucket.id, { public: bucket.public });
      if (error) console.log(`  ❌ Failed to create ${bucket.id}: ${error.message}`);
      else console.log(`  ✅ Created ${bucket.id}`);
    } else {
      console.log(`  ✅ Bucket ${bucket.id} already exists.`);
    }
  }
  console.log("  ✅ Storage setup successful.\n");

  console.log("✨ ALL FEATURES ARE NOW PROPERLY ENABLED!");
}

main()
  .catch((e) => { 
    console.error("❌ Setup failed!");
    console.error(e); 
    process.exit(1); 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
    await pool.end(); 
  });
