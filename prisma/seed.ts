import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: true
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "dhambit..**";
const PROVIDER_DEFAULT_PASSWORD = process.env.PROVIDER_DEFAULT_PASSWORD || "Password123";
const USER_DEFAULT_PASSWORD = process.env.USER_DEFAULT_PASSWORD || "Password123";
async function hashPwd(pwd: string) {
  return bcrypt.hash(pwd, 10);
}

async function main() {
  console.log("🌱 Starting AmbiTasker database seed...\n");

  // ─── 1. LOCATION DATA ─────────────────────────────────────────
  console.log("📍 Seeding locations...");

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

  const areas = [
    "Haripur City",
    "Khanpur",
    "Ghazi",
    "Hattar",
    "Sarai Saleh",
    "Khalabat Township",
    "Beer",
    "Panian",
    "Baldheri",
    "Kot Najibullah",
    "Rehana",
    "Darwesh",
    "Sirikot",
    "Najafpur",
    "Jabri"
  ];

  const areaRecords: Record<string, any> = {};
  for (const areaName of areas) {
    areaRecords[areaName] = await prisma.area.upsert({
      where: { name_cityId: { name: areaName, cityId: haripurCity.id } },
      update: { isActive: true },
      create: { name: areaName, cityId: haripurCity.id, isActive: true },
    });
  }

  console.log(`  ✅ Created ${areas.length} areas in Haripur\n`);

  // ─── 2. SERVICES ──────────────────────────────────────────────
  console.log("🔧 Seeding services...");

  const servicesData = [
    { name: "Plumbing Repair", category: "Plumbing", price: 2000, description: "Fix leaks, pipes, and drainage issues" },
    { name: "Pipe Installation", category: "Plumbing", price: 5000, description: "New pipe installation and routing" },
    { name: "Drain Cleaning", category: "Plumbing", price: 1500, description: "Professional drain unclogging" },
    { name: "House Wiring", category: "Electrician", price: 8000, description: "Complete house wiring and rewiring" },
    { name: "Light Installation", category: "Electrician", price: 1500, description: "Install and configure light fixtures" },
    { name: "Circuit Repair", category: "Electrician", price: 3000, description: "Diagnose and repair electrical circuits" },
    { name: "Deep Home Clean", category: "Home Cleaning", price: 5000, description: "Thorough top-to-bottom cleaning" },
    { name: "Kitchen Cleaning", category: "Home Cleaning", price: 2500, description: "Kitchen deep clean and sanitization" },
    { name: "AC Service", category: "AC Service", price: 2500, description: "AC gas refill, cleaning, and maintenance" },
    { name: "AC Installation", category: "AC Service", price: 8000, description: "Split and window AC installation" },
    { name: "Furniture Repair", category: "Carpenter", price: 3000, description: "Repair and restore wooden furniture" },
    { name: "Custom Cabinet", category: "Carpenter", price: 15000, description: "Build custom wooden cabinets" },
    { name: "Interior Painting", category: "Painter", price: 10000, description: "Professional room painting with material" },
    { name: "Car Tuning", category: "Mechanic", price: 3000, description: "Complete engine tune-up and oil change" },
    { name: "Home Tuition", category: "Tutor", price: 5000, description: "Monthly home tutoring for students" },
    { name: "CCTV Installation", category: "Security", price: 12000, description: "4-camera CCTV setup with DVR" },
    { name: "Event Photography", category: "Photography", price: 30000, description: "Full event coverage with editing" },
    { name: "Wedding Planning", category: "Event Planner", price: 100000, description: "Complete wedding planning and coordination" },
  ];

  for (const s of servicesData) {
    await prisma.service.upsert({
      where: { id: `svc-${s.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: { price: s.price, description: s.description },
      create: { id: `svc-${s.name.toLowerCase().replace(/\s+/g, "-")}`, ...s },
    });
  }

  console.log(`  ✅ Created ${servicesData.length} services\n`);

  // ─── 3. ADMIN ACCOUNTS ─────────────────────────────────────────
  console.log("👑 Seeding administrative infrastructure...");
 
  const adminPwd = await hashPwd(ADMIN_PASSWORD);
 
  // Official Super Admin
  await prisma.user.upsert({
    where: { email: "adminambitasker@gmail.com" },
    update: { name: "Super Admin", role: "ADMIN", isActive: true },
    create: {
      email: "adminambitasker@gmail.com",
      name: "Super Admin",
      passwordHash: adminPwd,
      role: "ADMIN",
      isEmailVerified: true,
      isActive: true,
    },
  });
 
  await prisma.admin.upsert({
    where: { email: "adminambitasker@gmail.com" },
    update: { name: "Super Admin", role: "SUPER_ADMIN", status: "active" },
    create: {
      email: "adminambitasker@gmail.com",
      name: "Super Admin",
      passwordHash: adminPwd,
      role: "SUPER_ADMIN",
      status: "active",
      permissions: ["overview.view", "users.manage", "providers.manage", "bookings.manage", "payments.view", "reports.manage", "locations.manage", "notifications.manage", "settings.manage", "admins.manage", "analytics.view"],
    },
  });

  // System Admin Uplink
  await prisma.user.upsert({
    where: { email: "ambitasker@gmail.com" },
    update: { name: "Admin", role: "ADMIN", isActive: true },
    create: {
      email: "ambitasker@gmail.com",
      name: "Admin",
      passwordHash: adminPwd,
      role: "ADMIN",
      isEmailVerified: true,
      isActive: true,
    },
  });
 
  await prisma.admin.upsert({
    where: { email: "ambitasker@gmail.com" },
    update: { name: "Admin", role: "SUPER_ADMIN", status: "active" },
    create: {
      email: "ambitasker@gmail.com",
      name: "Admin",
      passwordHash: adminPwd,
      role: "SUPER_ADMIN",
      status: "active",
      permissions: ["overview.view", "users.manage", "providers.manage", "bookings.manage", "payments.view", "reports.manage", "locations.manage", "notifications.manage", "settings.manage", "admins.manage", "analytics.view"],
    },
  });
 
  // ─── 4. SUMMARY ──────────────────────────────────────────────────
  console.log("╔═══════════════════════════════════════════════════╗");
  console.log("║        🎉 Seed Complete — System Ready           ║");
  console.log("╠═══════════════════════════════════════════════════╣");
  console.log("║ Super Admin:    adminambitasker@gmail.com        ║");
  console.log("║ Admin:          ambitasker@gmail.com             ║");
  console.log("╚═══════════════════════════════════════════════════╝");
}

 main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
