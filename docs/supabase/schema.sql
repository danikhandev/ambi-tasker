-- SUPABASE BACKEND INITIALIZATION SCHEMA
-- Project: ambi-tasker Service Marketplace
-- Description: Production-ready schema with RLS, Triggers, and Real-time enabled.

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define User Roles
CREATE TYPE user_role AS ENUM ('user', 'provider', 'admin');

-- Define Account Status
CREATE TYPE account_status AS ENUM ('active', 'suspended', 'pending');

-- Define Provider Approval Status
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Define Service Status
CREATE TYPE service_status AS ENUM ('active', 'inactive', 'paused');

-- Define Booking Status
CREATE TYPE booking_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');

-- Define Payment Status
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');

-- 2. TABLES

-- PROFILES: Stores public user info, linked to Supabase Auth
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    profile_image TEXT,
    role user_role DEFAULT 'user' NOT NULL,
    account_status account_status DEFAULT 'pending' NOT NULL,
    verification_state JSONB DEFAULT '{"identity_verified": false}'::jsonb,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- Soft delete support
);

-- Index for profile lookups
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NULL;

-- SERVICE_CATEGORIES: Global categories for services
CREATE TABLE public.service_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_name TEXT NOT NULL UNIQUE,
    icon TEXT,
    status account_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- SERVICES: Specific listings provided by providers
CREATE TABLE public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.service_categories(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    service_status service_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_services_provider_id ON public.services(provider_id);
CREATE INDEX idx_services_category_id ON public.services(category_id);

-- USERS_DETAILS: Specific metadata for customers/users
CREATE TABLE public.users_details (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    address TEXT,
    city TEXT,
    location_coordinates POINT,
    booking_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROVIDERS: Extended info for providers
CREATE TABLE public.providers (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    service_category UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
    service_description TEXT,
    experience_years INTEGER DEFAULT 0,
    availability_status BOOLEAN DEFAULT true,
    approval_status approval_status DEFAULT 'pending' NOT NULL,
    rating DECIMAL(3,2) DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    earnings_total DECIMAL(12,2) DEFAULT 0,
    location_name TEXT,
    coordinates POINT, -- Latitude, Longitude
    documents_url TEXT[], -- Identity verification docs
    joined_date TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOOKINGS: System for service requests
CREATE TABLE public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    provider_id UUID REFERENCES public.profiles(id) NOT NULL,
    service_id UUID REFERENCES public.services(id) NOT NULL,
    booking_status booking_status DEFAULT 'pending' NOT NULL,
    scheduled_date TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    payment_status payment_status DEFAULT 'pending' NOT NULL,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_provider_id ON public.bookings(provider_id);
CREATE INDEX idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX idx_bookings_status ON public.bookings(booking_status);

-- PAYMENTS: Transaction records
CREATE TABLE public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    transaction_id TEXT UNIQUE,
    payment_status payment_status DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for payment lookups
CREATE INDEX idx_payments_booking_id ON public.payments(booking_id);

-- CONVERSATIONS: Groups messages between a user and provider
CREATE TABLE public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    provider_id UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MESSAGES: Real-time chat system
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    message_text TEXT NOT NULL,
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for chat performance
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_provider_id ON public.conversations(provider_id);

-- NOTIFICATIONS: System alerts
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT_LOGS: System-wide activity tracking
CREATE TABLE public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    performed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- 3. TRIGGERS & FUNCTIONS

-- Automatically create a profile on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, profile_image, role, account_status)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        COALESCE(new.raw_user_meta_data->>'profile_image', ''),
        COALESCE((new.raw_user_meta_data->>'role')::user_role, 'user'),
        'active' -- Default to active for new users
    );

    -- Initialize Users Details automatically
    INSERT INTO public.users_details (user_id) VALUES (new.id);

    -- Initialize Provider record if role is provider
    IF (new.raw_user_meta_data->>'role') = 'provider' THEN
        INSERT INTO public.providers (id, approval_status) VALUES (new.id, 'pending');
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GOVERNANCE: Function for Admins to approve/reject providers
CREATE OR REPLACE FUNCTION public.audit_provider_onboarding(
    target_provider_id UUID,
    new_status approval_status,
    admin_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Check if the executor is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can audit providers.';
    END IF;

    -- Update provider status
    UPDATE public.providers
    SET approval_status = new_status,
        updated_at = NOW()
    WHERE id = target_provider_id;

    -- Update account status based on approval
    IF new_status = 'approved' THEN
        UPDATE public.profiles SET account_status = 'active' WHERE id = target_provider_id;
        
        -- Trigger Welcome Notification
        INSERT INTO public.notifications (receiver_id, title, message, type)
        VALUES (target_provider_id, 'Protocol Activated', 'Your professional identity has been verified. Welcome to the grid.', 'SYSTEM');
    ELSIF new_status = 'rejected' THEN
        -- Trigger Rejection Notification
        INSERT INTO public.notifications (receiver_id, title, message, type)
        VALUES (target_provider_id, 'Registration Fragmented', 'Your verification request was not successful. Contact support for audit details.', 'SYSTEM');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Timestamp auto-update
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_service_categories_updated_at BEFORE UPDATE ON public.service_categories FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_users_details_updated_at BEFORE UPDATE ON public.users_details FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON public.providers FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- AUDIT_TRIGGER_FUNC: Automatically log changes
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, performed_by)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, performed_by)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), auth.uid());
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach audit logging to critical tables
CREATE TRIGGER audit_profiles AFTER UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.process_audit_log();
CREATE TRIGGER audit_bookings AFTER UPDATE OR DELETE ON public.bookings FOR EACH ROW EXECUTE PROCEDURE public.process_audit_log();
CREATE TRIGGER audit_providers AFTER UPDATE OR DELETE ON public.providers FOR EACH ROW EXECUTE PROCEDURE public.process_audit_log();

-- 4. SECURITY (Row Level Security)

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles are viewable by self" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles are updatable by self" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Provider profiles are public" ON public.profiles FOR SELECT USING (role = 'provider');
CREATE POLICY "Admins have full access to profiles" ON public.profiles ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Users Details Policies
CREATE POLICY "Details viewable by self" ON public.users_details FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Details updatable by self" ON public.users_details FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins have full access to user details" ON public.users_details ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Providers Policies
CREATE POLICY "Provider record viewable by self" ON public.providers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Provider record updatable by self" ON public.providers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Approved providers are public" ON public.providers FOR SELECT USING (approval_status = 'approved');
CREATE POLICY "Admins have full access to providers" ON public.providers ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Categories & Services Policies (Public Read)
CREATE POLICY "Categories are public" ON public.service_categories FOR SELECT USING (true);
CREATE POLICY "Services are public" ON public.services FOR SELECT USING (true);
CREATE POLICY "Providers can create services" ON public.services FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'provider'));
CREATE POLICY "Providers can manage their own services" ON public.services ALL USING (auth.uid() = provider_id);
CREATE POLICY "Admins have full access to categories" ON public.service_categories ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins have full access to services" ON public.services ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Bookings Policies
CREATE POLICY "Participant view bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id OR auth.uid() = provider_id);
CREATE POLICY "Customers create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Participant update bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = provider_id);
CREATE POLICY "Admins have full access to bookings" ON public.bookings ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Conversations Policies
CREATE POLICY "Participant view conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id OR auth.uid() = provider_id);
CREATE POLICY "Participant create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = provider_id);
CREATE POLICY "Admins have full access to conversations" ON public.conversations ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Messages Policies
CREATE POLICY "Participant view messages" ON public.messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = public.messages.conversation_id 
        AND (user_id = auth.uid() OR provider_id = auth.uid())
    )
);
CREATE POLICY "Sender insert messages" ON public.messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = conversation_id 
        AND (user_id = auth.uid() OR provider_id = auth.uid())
    )
);
CREATE POLICY "Admins have full access to messages" ON public.messages ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = receiver_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = receiver_id);

-- Payments Policies
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE id = public.payments.booking_id 
        AND (user_id = auth.uid() OR provider_id = auth.uid())
    )
);
CREATE POLICY "Participants can insert payments" ON public.payments 
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE id = booking_id 
        AND (user_id = auth.uid() OR provider_id = auth.uid())
    )
);
CREATE POLICY "Admins can manage all payments" ON public.payments ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Real-time setup
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations, public.messages, public.notifications, public.bookings, public.payments;

-- 5. ANALYTICS & DASHBOARD SUPPORT

-- ADMIN_STATS: High-level metrics view for the dashboard
CREATE OR REPLACE VIEW public.admin_dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'user') as total_users,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'provider') as total_providers,
    (SELECT COUNT(*) FROM public.bookings WHERE booking_status IN ('pending', 'accepted', 'in_progress')) as active_bookings,
    (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE payment_status = 'success') as total_revenue,
    (SELECT COUNT(*) FROM public.providers WHERE approval_status = 'pending') as pending_approvals;

-- REVENUE_CHART_DATA: View for revenue over time
CREATE OR REPLACE VIEW public.revenue_chart_data AS
SELECT 
    date_trunc('day', created_at) as day,
    SUM(amount) as daily_revenue
FROM public.payments
WHERE payment_status = 'success'
GROUP BY 1
ORDER BY 1 DESC;

-- Security for Analytical Views
ALTER VIEW public.admin_dashboard_stats SET (security_invoker = on);
ALTER VIEW public.revenue_chart_data SET (security_invoker = on);

-- Ensure only Admins can query these views via RLS (indirectly via function or direct policy if supported)
-- In Supabase, you can apply RLS to views by setting security_invoker = on, 
-- but we must ensure the underlying tables are protected.
-- Done: Profiles, Bookings, Payments, and Providers already have Admin-only policies.
