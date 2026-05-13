import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@ambitasker.com' } });
  console.log(JSON.stringify(user, null, 2));
}

check().then(() => prisma.$disconnect());
