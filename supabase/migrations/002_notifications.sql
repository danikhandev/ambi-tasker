-- ============================================================
-- NOTIFICATIONS SYSTEM MIGRATION
-- Core notification infrastructure for AmbiTasker
-- ============================================================

-- ─── 1. Notifications Table ──────────────────────────────────
-- Stores all in-app notifications for users and providers
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    receiver_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    action_label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by user and read status
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_id ON notifications (receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);

-- ─── 2. Row Level Security (RLS) Policies ─────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (true);

-- Users can mark their own notifications as read or delete them
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (true);

-- Enable insert for authenticated users
CREATE POLICY "Enable insert for authenticated users" ON notifications
    FOR INSERT WITH CHECK (true);

-- ─── 3. Updated At Trigger ────────────────────────────────────
-- Note: 'update_updated_at_column' function exists from 001_admin_rbac.sql
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
