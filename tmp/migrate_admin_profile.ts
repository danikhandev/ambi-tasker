import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Ensuring admin_profiles table exists...')
  
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS admin_profiles (
      id TEXT PRIMARY KEY,
      admin_avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  
  console.log('Table admin_profiles ensured.')
  
  // Check if admin_avatar_url column exists (redundant if we just created it, but good for "Add ONLY if column does not exist")
  const columnCheck = await prisma.$queryRaw<any[]>`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'admin_profiles' AND column_name = 'admin_avatar_url'
  `
  
  if (columnCheck.length === 0) {
    console.log('Adding column admin_avatar_url to admin_profiles...')
    await prisma.$executeRawUnsafe(`
      ALTER TABLE admin_profiles ADD COLUMN admin_avatar_url TEXT;
    `)
  } else {
    console.log('Column admin_avatar_url already exists.')
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
