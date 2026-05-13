-- Add payment_method to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Trigger to sync payment status from payments table back to bookings table
CREATE OR REPLACE FUNCTION public.sync_payment_to_booking()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.bookings
    SET payment_status = NEW.payment_status,
        updated_at = NOW()
    WHERE id = NEW.booking_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid errors on multiple runs
DROP TRIGGER IF EXISTS on_payment_upsert ON public.payments;

CREATE TRIGGER on_payment_upsert
    AFTER INSERT OR UPDATE ON public.payments
    FOR EACH ROW EXECUTE PROCEDURE public.sync_payment_to_booking();
