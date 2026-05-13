-- Create Storage Bucket for Provider Documents
-- This should be run in Supabase SQL Editor

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('provider-docs', 'provider-docs', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS for storage.objects
-- Ensure RLS is enabled on storage.objects (usually is by default in Supabase)

-- 3. Policy: Providers can upload their own documents
-- Documents are stored in a folder named after their auth.uid()
CREATE POLICY "Providers can upload own docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'provider-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: Providers can view their own documents
CREATE POLICY "Providers can view own docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'provider-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Admins can view all provider documents
CREATE POLICY "Admins can view all docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'provider-docs' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 6. Policy: Providers can update/delete their own documents (in case they need to resubmit)
CREATE POLICY "Providers can update own docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'provider-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
