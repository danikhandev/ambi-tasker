-- Add Admin access to Provider Documents
-- This ensures the verification dashboard works for admins

CREATE POLICY "Admins can view all documents" 
ON public.provider_documents FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')
    )
);

CREATE POLICY "Admins can view all verification logs" 
ON public.verification_logs FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')
    )
);

-- Ensure public.providers also has admin view policy
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'providers' AND policyname = 'Admins can view all providers'
    ) THEN
        CREATE POLICY "Admins can view all providers" 
        ON public.providers FOR SELECT 
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')
            )
        );
    END IF;
END $$;
