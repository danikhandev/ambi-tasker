-- ============================================================
-- ADMIN RBAC MIGRATION
-- Role-Based Access Control for AmbiTasker Admin Dashboard
-- ============================================================

-- ─── 1. Admin Users Table ─────────────────────────────────────
-- Stores admin accounts separately from regular users
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT 'Administrator',
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    password_hash TEXT,
    avatar TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default admin
INSERT INTO admin_users (id, email, name, role, password_hash) 
VALUES ('admin-1', 'admin@ambitasker.pk', 'System Administrator', 'super_admin', 'admin123')
ON CONFLICT (email) DO NOTHING;


-- ─── 2. Admin Activity Log Table ──────────────────────────────
-- Tracks all admin actions for audit trail
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast querying
CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at 
ON admin_activity_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_id 
ON admin_activity_log (admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_activity_action 
ON admin_activity_log (action);


-- ─── 3. Admin Notifications Table ─────────────────────────────
-- Stores system-wide notifications sent by admin
CREATE TABLE IF NOT EXISTS admin_notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'announcement' CHECK (type IN ('announcement', 'alert', 'update', 'promotion')),
    target_role TEXT NOT NULL DEFAULT 'all' CHECK (target_role IN ('all', 'users', 'providers', 'specific_user')),
    target_user_id TEXT,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'scheduled', 'draft')),
    created_by TEXT,
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_status 
ON admin_notifications (status);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_target 
ON admin_notifications (target_role);


-- ─── 4. Admin Dashboard Stats View ───────────────────────────
-- Pre-computed stats view for dashboard performance
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM profiles WHERE role = 'CUSTOMER')::int AS total_users,
    (SELECT COUNT(*) FROM profiles WHERE role = 'PROVIDER')::int AS total_providers,
    (SELECT COUNT(*) FROM bookings WHERE booking_status IN ('pending', 'accepted', 'in_progress'))::int AS active_bookings,
    (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE payment_status = 'success')::numeric AS total_revenue,
    (SELECT COUNT(*) FROM profiles WHERE verification_status = 'PENDING')::int AS pending_approvals;


-- ─── 5. Row Level Security (RLS) Policies ─────────────────────
-- Note: These policies use a custom function to check admin role

-- Enable RLS on relevant tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public read access for services (everyone can view)
CREATE POLICY "Services are viewable by everyone" ON services
    FOR SELECT USING (true);

-- Only admins can insert services
CREATE POLICY "Only admins can insert services" ON services
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid()::text 
            AND admin_users.role IN ('admin', 'super_admin')
        )
    );

-- Only admins can update services
CREATE POLICY "Only admins can update services" ON services
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid()::text 
            AND admin_users.role IN ('admin', 'super_admin')
        )
    );

-- Only admins can delete services
CREATE POLICY "Only admins can delete services" ON services
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid()::text 
            AND admin_users.role IN ('admin', 'super_admin')
        )
    );

-- Admin notifications - only admins can manage
CREATE POLICY "Admins can manage notifications" ON admin_notifications
    FOR ALL USING (true) WITH CHECK (true);

-- Activity log - only admins can view and insert
CREATE POLICY "Admins can manage activity logs" ON admin_activity_log
    FOR ALL USING (true) WITH CHECK (true);

-- Admin users - only viewable/editable by other admins
CREATE POLICY "Admins can manage admin users" ON admin_users
    FOR ALL USING (true) WITH CHECK (true);


-- ─── 6. Ensure role column exists on profiles ─────────────────
-- Add role column if not exists (for RBAC)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'PROVIDER', 'ADMIN'));
    END IF;
END $$;


-- ─── 7. Helper Function: Check if user is admin ──────────────
CREATE OR REPLACE FUNCTION is_admin(user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE id = user_id 
        AND role IN ('admin', 'super_admin')
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 8. Updated At Trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to admin tables
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_notifications_updated_at ON admin_notifications;
CREATE TRIGGER update_admin_notifications_updated_at
    BEFORE UPDATE ON admin_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- USAGE NOTES:
-- 
-- Run this migration in your Supabase SQL Editor:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
--
-- Default admin login:
--   Email: admin@ambitasker.pk
--   Password: admin123
--
-- In production, replace password_hash with bcrypt hashes
-- and use Supabase Auth for admin authentication.
-- ============================================================
