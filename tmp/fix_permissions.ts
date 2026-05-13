import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Ensuring admin-avatars bucket is public and RLS is enabled/disabled...')
  
  // Storage buckets are in storage schema
  try {
    await prisma.$executeRawUnsafe(`
      UPDATE storage.buckets SET public = true WHERE id = 'admin-avatars';
    `);
    console.log('Bucket set to public.');
  } catch (e: any) {
    console.error('Failed to set bucket to public (maybe storage schema not accessible via Prisma):', e.message);
  }

  // Also enable reading from admin_profiles for anyone (or at least authenticated)
  // Since we want the avatar to be visible in the dashboard (which is client-side)
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Public access to admin profiles" ON admin_profiles;
      CREATE POLICY "Public access to admin profiles" ON admin_profiles FOR SELECT USING (true);
    `);
    console.log('RLS policy for admin_profiles added.');
  } catch (e: any) {
    console.error('Failed to add RLS policy:', e.message);
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
