import { createClient } from '@supabase/supabase-js';

// Lazy initialize to prevent build-time crashes if ENV vars are missing
let supabaseAdmin: ReturnType<typeof createClient>;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key';
    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  }
  return supabaseAdmin;
}

export const BUCKETS = {
  KYC: 'kyc-documents',
  PROFILES: 'profile-images',
  ADMIN: 'admin-avatars',
  POSTERS: 'posters',
  CHAT: 'chat-attachments'
} as const;

export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Buffer | Blob,
  contentType?: string
) {
  const admin = getSupabaseAdmin();
  
  // Attempt to upload
  let { data, error } = await admin.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: true
    });

  // If bucket is missing, try to create it and retry upload
  if (error && (error.message.includes('not found') || (error as any).status === 404)) {
    try {
      console.log(`Bucket "${bucket}" not found. Attempting auto-creation...`);
      const isPrivate = bucket === BUCKETS.KYC;
      await admin.storage.createBucket(bucket, { public: !isPrivate });
      
      // Retry upload after creation
      const retry = await admin.storage
        .from(bucket)
        .upload(path, file, {
          contentType,
          upsert: true
        });
      
      data = retry.data;
      error = retry.error;
    } catch (createError) {
      console.error(`Failed to auto-create bucket "${bucket}":`, createError);
    }
  }

  if (error) throw error;
  return data;
}

export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600) {
  const { data, error } = await getSupabaseAdmin().storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

export function getPublicUrl(bucket: string, path: string) {
  const { data } = getSupabaseAdmin().storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function deleteFile(bucket: string, path: string) {
  const { error } = await getSupabaseAdmin().storage
    .from(bucket)
    .remove([path]);

  if (error) throw error;
}
