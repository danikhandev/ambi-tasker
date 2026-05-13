-- RATINGS & REVIEWS SYSTEM

-- 1. Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL UNIQUE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    status approval_status DEFAULT 'approved' NOT NULL, -- Moderation capability
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexing for performance
CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON public.reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- 3. Function to update provider average rating
CREATE OR REPLACE FUNCTION public.calculate_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the average rating and completed jobs in the providers table
    UPDATE public.providers
    SET rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM public.reviews
        WHERE provider_id = NEW.provider_id AND status = 'approved'
    ),
    updated_at = NOW()
    WHERE id = NEW.provider_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger to run the calculation on review insert or update
DROP TRIGGER IF EXISTS tr_update_provider_rating ON public.reviews;
CREATE TRIGGER tr_update_provider_rating
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE PROCEDURE public.calculate_provider_rating();

-- 5. RLS Policies for Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are public for approved providers" ON public.reviews
FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can create reviews for their bookings" ON public.reviews
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.bookings
        WHERE id = booking_id AND user_id = auth.uid() AND booking_status = 'completed'
    )
);

CREATE POLICY "Users can update their own reviews" ON public.reviews
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins have full control over reviews" ON public.reviews
ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 6. Real-time for reviews
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
