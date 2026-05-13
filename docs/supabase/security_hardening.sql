-- PRODUCTION SECURITY POLICIES & RLS ENHANCEMENTS
-- Objective: Ensure strict data isolation and role-based access control (RBAC)

-- 1. BASELINE: Ensure RLS is enabled on all core tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 2. HELPER FUNCTIONS
-- Check if current user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is a Provider
CREATE OR REPLACE FUNCTION public.is_provider()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'provider'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles are viewable by self" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are updatable by self" ON public.profiles;
DROP POLICY IF EXISTS "Provider profiles are public" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;

CREATE POLICY "Profiles: Users see own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles: Providers are public" ON public.profiles FOR SELECT USING (role = 'provider');
CREATE POLICY "Profiles: Self update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles: Admin full access" ON public.profiles ALL USING (public.is_admin());

-- 4. BOOKINGS POLICIES (Critical Data Isolation)
DROP POLICY IF EXISTS "Participant view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Participant update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins have full access to bookings" ON public.bookings;

CREATE POLICY "Bookings: Participants view" ON public.bookings 
FOR SELECT USING (auth.uid() = user_id OR auth.uid() = provider_id OR public.is_admin());

CREATE POLICY "Bookings: Consumers create" ON public.bookings 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Bookings: Participants update" ON public.bookings 
FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = provider_id OR public.is_admin());

-- 5. SERVICES & CATEGORIES (Public Discovery vs Admin Management)
DROP POLICY IF EXISTS "Categories are public" ON public.service_categories;
DROP POLICY IF EXISTS "Services are public" ON public.services;
DROP POLICY IF EXISTS "Providers can create services" ON public.services;
DROP POLICY IF EXISTS "Providers can manage their own services" ON public.services;
DROP POLICY IF EXISTS "Admins have full access to categories" ON public.service_categories;
DROP POLICY IF EXISTS "Admins have full access to services" ON public.services;

CREATE POLICY "Categories: Read only public" ON public.service_categories FOR SELECT USING (true);
CREATE POLICY "Categories: Admin manage" ON public.service_categories ALL USING (public.is_admin());

CREATE POLICY "Services: Read only public" ON public.services FOR SELECT USING (true);
CREATE POLICY "Services: Provider insert" ON public.services FOR INSERT WITH CHECK (public.is_provider());
CREATE POLICY "Services: Owner manage" ON public.services ALL USING (auth.uid() = provider_id OR public.is_admin());

-- 6. PAYMENTS (Financial Isolation)
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Participants can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;

CREATE POLICY "Payments: Participants view" ON public.payments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE id = public.payments.booking_id 
        AND (user_id = auth.uid() OR provider_id = auth.uid())
    ) OR public.is_admin()
);

-- 7. REVIEWS (Moderation & Trust)
-- Handled correctly in reviews_system.sql, but ensuring Admin access
DROP POLICY IF EXISTS "Admins have full control over reviews" ON public.reviews;
CREATE POLICY "Reviews: Admin management" ON public.reviews ALL USING (public.is_admin());

-- 8. PROVIDER ONBOARDING (Private Data)
DROP POLICY IF EXISTS "Provider record viewable by self" ON public.providers;
DROP POLICY IF EXISTS "Provider record updatable by self" ON public.providers;
DROP POLICY IF EXISTS "Approved providers are public" ON public.providers;
DROP POLICY IF EXISTS "Admins have full access to providers" ON public.providers;

CREATE POLICY "Providers: Self access" ON public.providers ALL USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Providers: Public view approved" ON public.providers FOR SELECT USING (approval_status = 'approved');

-- 9. MESSAGING ISOLATION
DROP POLICY IF EXISTS "Participant view conversations" ON public.conversations;
CREATE POLICY "Conversations: Lock-down" ON public.conversations ALL USING (auth.uid() = user_id OR auth.uid() = provider_id OR public.is_admin());

DROP POLICY IF EXISTS "Participant view messages" ON public.messages;
CREATE POLICY "Messages: Isolation" ON public.messages ALL USING (
    EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = public.messages.conversation_id 
        AND (user_id = auth.uid() OR provider_id = auth.uid())
    ) OR public.is_admin()
);

-- 10. AUDIT LOGS (Admin Only)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audit Logs: Admin restrict" ON public.audit_logs ALL USING (public.is_admin());
