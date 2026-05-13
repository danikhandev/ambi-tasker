import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const adminProfiles = await prisma.$queryRaw<any[]>`SELECT * FROM admin_profiles`
  console.log('--- ADMIN PROFILES ---')
  adminProfiles.forEach(p => {
    console.log(`ID: ${p.id}, Avatar: ${p.admin_avatar_url}`)
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
