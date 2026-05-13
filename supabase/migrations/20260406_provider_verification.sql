-- 1. Extend Providers Table (if not using profiles exclusively)
-- Assuming 'providers' table exists, we add or ensure status columns:
ALTER TABLE IF EXISTS public.providers 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- 2. Create Provider Documents Table
CREATE TABLE IF NOT EXISTS public.provider_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  cnic_front_url TEXT,
  cnic_back_url TEXT,
  selfie_url TEXT,
  certificate_url TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_id)
);

-- 3. Create Verification Logs Table
CREATE TABLE IF NOT EXISTS public.verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  admin_id UUID, -- References internal admin ID
  action VARCHAR(50) NOT NULL, -- e.g., 'SUBMITTED', 'APPROVED', 'REJECTED'
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: RLS Policies should be enabled for provider_documents to restrict access to owner & admin
ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own documents" 
  ON public.provider_documents FOR SELECT 
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers can insert own documents" 
  ON public.provider_documents FOR INSERT 
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own documents" 
  ON public.provider_documents FOR UPDATE 
  USING (auth.uid() = provider_id);
