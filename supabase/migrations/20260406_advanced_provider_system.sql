-- 1. Extend Providers Table for Online Status & Wallet
ALTER TABLE IF EXISTS public.providers 
ADD COLUMN IF NOT EXISTS online_status BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS current_latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS current_longitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE;

-- 2. Wallet Transactions Table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('EARNING', 'WITHDRAWAL', 'PENALTY')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ratings Table
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, 
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(booking_id) -- Prevent multiple reviews per job
);

-- 4. Job Requests (Broadcasted to providers) Table
CREATE TABLE IF NOT EXISTS public.job_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    service_id UUID,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE -- e.g., created_at + 60 seconds
);

-- Trigger to automatically update Provider Rating Average
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.providers
    SET rating = (
        SELECT ROUND(AVG(rating), 1)
        FROM public.ratings
        WHERE provider_id = NEW.provider_id
    )
    WHERE id = NEW.provider_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION update_provider_rating();

-- Trigger to lock withdrawal balance logic
CREATE OR REPLACE FUNCTION process_wallet_earnings()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'COMPLETED' AND NEW.type = 'EARNING' THEN
        UPDATE public.providers
        SET wallet_balance = wallet_balance + NEW.amount
        WHERE id = NEW.provider_id;
    ELSIF NEW.status = 'COMPLETED' AND NEW.type = 'WITHDRAWAL' THEN
        UPDATE public.providers
        SET wallet_balance = wallet_balance - NEW.amount
        WHERE id = NEW.provider_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_wallet
AFTER UPDATE OF status ON public.wallet_transactions
FOR EACH ROW
WHEN (OLD.status = 'PENDING' AND NEW.status = 'COMPLETED')
EXECUTE FUNCTION process_wallet_earnings();
