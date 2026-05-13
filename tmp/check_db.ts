import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `
  console.log('--- ALL TABLES ---')
  console.log(tables)
  
  // Also check columns of the User table if it exists
  try {
    const userColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User'
    `
    console.log('--- USER COLUMNS ---')
    console.log(userColumns)
  } catch (e: any) {
    console.log('User table not found or error checking columns')
  }

  // Check profiles table
  try {
    const profileColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
    `
    console.log('--- PROFILES COLUMNS ---')
    console.log(profileColumns)
  } catch (e: any) {
     console.log('Profiles table not found')
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
