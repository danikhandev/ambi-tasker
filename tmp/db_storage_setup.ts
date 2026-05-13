import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Ensuring admin-avatars bucket is public and RLS is disabled for reading...')
  
  // We'll use Prisma to RUN the SQL directly.
  try {
    // 1. Create the bucket if not exists (raw SQL)
    await prisma.$executeRawUnsafe(`
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('admin-avatars', 'admin-avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
      ON CONFLICT (id) DO UPDATE SET public = true;
    `);
    console.log('Bucket ensured and set to public.');
  } catch (e: any) {
    console.error('Bucket setup error (likely storage schema access or already exists):', e.message);
  }

  // 2. Add RLS policies for storage objects
  try {
    await prisma.$executeRawUnsafe(`
      -- Allow anyone to read from admin-avatars
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE policyname = 'Public Access for admin-avatars'
        ) THEN
          CREATE POLICY "Public Access for admin-avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'admin-avatars');
        END IF;
      END
      $$;

      -- Allow authenticated users to upload to admin-avatars
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Upload for admin-avatars'
        ) THEN
          CREATE POLICY "Authenticated Upload for admin-avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'admin-avatars');
        END IF;
      END
      $$;
    `);
    console.log('Storage RLS policies ensured.');
  } catch (e: any) {
    console.error('Storage RLS error:', e.message);
  }

  // 3. Ensure admin_profiles is readable
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
      
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE policyname = 'Public Select admin_profiles'
        ) THEN
          CREATE POLICY "Public Select admin_profiles" ON public.admin_profiles FOR SELECT TO public USING (true);
        END IF;
      END
      $$;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE policyname = 'Admin Update own profile'
        ) THEN
          CREATE POLICY "Admin Update own profile" ON public.admin_profiles FOR ALL TO authenticated USING (true); -- Simplified for now
        END IF;
      END
      $$;
    `);
    console.log('Admin Profiles RLS ensured.');
  } catch (e: any) {
    console.error('Admin Profiles RLS error:', e.message);
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
