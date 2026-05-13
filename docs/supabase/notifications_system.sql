-- 12. ADMIN NOTIFICATIONS & BROADCAST SYSTEM

-- TABLE: admin_notifications
-- Stores history of global broadcasts sent by administrators
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'announcement', -- 'announcement', 'alert', 'update', 'promotion'
    target_role TEXT NOT NULL DEFAULT 'all', -- 'all', 'users', 'providers'
    status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'scheduled', 'draft'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

-- Index for querying history
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at);

-- RLS: Only admins can manage broadcasts
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to broadcasts" ON public.admin_notifications
    ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- FUNCTION: Propagate Admin Broadcasts
-- Automatically inserts personal notifications for targeted users when a broadcast is "sent"
CREATE OR REPLACE FUNCTION public.propagate_admin_broadcast()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if status is 'sent'
    IF NEW.status = 'sent' AND (OLD IS NULL OR OLD.status != 'sent') THEN
        -- Insert into public.notifications for matching users
        INSERT INTO public.notifications (receiver_id, title, message, type)
        SELECT 
            p.id, 
            NEW.title, 
            NEW.message, 
            UPPER(NEW.type)
        FROM public.profiles p
        WHERE 
            (NEW.target_role = 'all') OR
            (NEW.target_role = 'users' AND p.role = 'user') OR
            (NEW.target_role = 'providers' AND p.role = 'provider');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER: Broadcast Propagation
CREATE TRIGGER on_admin_notification_sent
    AFTER INSERT OR UPDATE ON public.admin_notifications
    FOR EACH ROW EXECUTE PROCEDURE public.propagate_admin_broadcast();

-- Ensure Real-time is enabled for admin_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
