-- BOOKING SLIPS SYSTEM
-- Stores generated receipts for completed services

CREATE TABLE IF NOT EXISTS public.booking_slips (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL UNIQUE,
    slip_number TEXT UNIQUE NOT NULL, -- Format: SU-REC-YYYYMMDD-XXXX
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    service_title TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    consumer_name TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL,
    service_date TIMESTAMPTZ NOT NULL,
    metadata JSONB, -- For extra details like tax, discount, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_booking_slips_booking_id ON public.booking_slips(booking_id);

-- RLS Policies
ALTER TABLE public.booking_slips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view their own slips" ON public.booking_slips
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.bookings
        WHERE id = booking_id AND (user_id = auth.uid() OR provider_id = auth.uid())
    )
);

CREATE POLICY "Providers can generate slips for their bookings" ON public.booking_slips
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.bookings
        WHERE id = booking_id AND provider_id = auth.uid()
    )
);

CREATE POLICY "Admins have full control over slips" ON public.booking_slips
ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Function to generate slip number automatically if needed, 
-- but we will likely handle this in the frontend/backend logic for control over format.

-- Real-time for slips
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_slips;
