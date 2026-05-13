import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const profiles = await prisma.$queryRaw`SELECT * FROM profiles LIMIT 1`
    console.log('PROFILES_DATA', JSON.stringify(profiles))
  } catch (e: any) {
    console.log('PROFILES_NOT_FOUND', e.message)
  }
  
  try {
    const admin_profiles = await prisma.$queryRaw`SELECT * FROM admin_profiles LIMIT 1`
    console.log('ADMIN_PROFILES_DATA', JSON.stringify(admin_profiles))
  } catch (e: any) {
    console.log('ADMIN_PROFILES_NOT_FOUND', e.message)
  }

  try {
    const admins = await prisma.$queryRaw`SELECT * FROM admins LIMIT 1`
    console.log('ADMINS_DATA', JSON.stringify(admins))
  } catch (e: any) {
    console.log('ADMINS_NOT_FOUND', e.message)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
