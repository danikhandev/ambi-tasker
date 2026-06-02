const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@ambitasker.com' },
    update: { status: 'active' },
    create: {
      email: 'admin@ambitasker.com',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      status: 'active',
      permissions: ['*']
    }
  });
  console.log('Admin seeded:', admin.email);
}

main().finally(() => prisma.$disconnect());
