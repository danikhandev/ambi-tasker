import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const adminProfiles = await prisma.$queryRaw`SELECT * FROM admin_profiles`
  console.log('ADMIN_PROFILES_CONTENT', JSON.stringify(adminProfiles, null, 2))
  
  const users = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, name: true, role: true }
  })
  console.log('ADMIN_USERS', JSON.stringify(users, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
