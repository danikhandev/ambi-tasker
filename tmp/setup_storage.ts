import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Service role key is needed to create/manage buckets
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const key = serviceRoleKey && !serviceRoleKey.includes('YOUR_') ? serviceRoleKey : anonKey;
const keyType = serviceRoleKey && !serviceRoleKey.includes('YOUR_') ? 'service_role' : 'anon';

console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Key type:', keyType);

if (!supabaseUrl || !key) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, key);

// ─── Bucket Definitions ─────────────────────────────────────────────────────
const buckets = [
  {
    id: 'admin-avatars',
    label: '👤 Admin Profile Images',
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
  },
  {
    id: 'profile-images',
    label: '👤 User Profile Images',
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
  },
  {
    id: 'kyc-documents',
    label: '🪪 Provider KYC Documents',
    public: false, // Private — only accessible via signed URLs
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'],
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
  },
  {
    id: 'posters',
    label: '🖼️ Posters',
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
  },
];

async function main() {
  console.log('\n🚀 Setting up Supabase storage buckets...\n');

  for (const bucket of buckets) {
    const { id, label, public: isPublic, allowedMimeTypes, fileSizeLimit } = bucket;

    // Check if bucket exists
    const { data, error } = await supabase.storage.getBucket(id);

    if (data) {
      console.log(`  ✅ ${label} (${id}) — already exists`);
      continue;
    }

    // Create bucket
    console.log(`  ⏳ Creating ${label} (${id})...`);
    const { error: createError } = await supabase.storage.createBucket(id, {
      public: isPublic,
      allowedMimeTypes,
      fileSizeLimit,
    });

    if (createError) {
      console.log(`  ❌ ${label} (${id}) — Failed: ${createError.message}`);
    } else {
      console.log(`  ✅ ${label} (${id}) — Created successfully (${isPublic ? 'public' : 'private'})`);
    }
  }

  console.log('\n✨ Storage setup complete!\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
