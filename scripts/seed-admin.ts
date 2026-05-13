// scripts/seed-admin.ts
import { prisma } from "@/services/prisma";
import bcrypt from "bcryptjs";

const DEFAULT_ADMIN = {
  email: "ambitasker@gmail.com",
  // plain password: dhambit.** (the asterisks are part of the password)
  password: "dhambit.**",
  name: "AmbiTasker Admin",
  role: "SUPER_ADMIN", // highest privilege
  status: "active",
};

async function main() {
  const existing = await prisma.admin.findUnique({
    where: { email: DEFAULT_ADMIN.email },
  });

  if (existing) {
    console.log("✅ Default admin already exists – skipping creation.");
    return;
  }

  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, saltRounds);

  await prisma.admin.create({
    data: {
      email: DEFAULT_ADMIN.email,
      name: DEFAULT_ADMIN.name,
      passwordHash,
      role: DEFAULT_ADMIN.role,
      status: DEFAULT_ADMIN.status,
    },
  });

  console.log("🛠️ Default admin created successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding default admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
