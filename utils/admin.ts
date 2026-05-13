import { supabase } from '@/services/supabase';

// ─── Admin Role Types ─────────────────────────────────────────────
export type AppRole = 'admin' | 'provider' | 'user';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  avatar?: string;
  created_at?: string;
}

// ─── Admin Verification ───────────────────────────────────────────
export async function verifyAdminRole(adminId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id, role')
      .eq('id', adminId)
      .single();

    if (error || !data) return false;
    // Both roles are admins
    return ["SUPER_ADMIN", "SUB_ADMIN"].includes(data.role);
  } catch {
    return false;
  }
}

// ─── Activity Log Types ───────────────────────────────────────────
export type AdminAction =
  | 'service_added'
  | 'service_updated'
  | 'service_deleted'
  | 'notification_sent'
  | 'notification_created'
  | 'notification_updated'
  | 'user_suspended'
  | 'user_activated'
  | 'user_deleted'
  | 'provider_approved'
  | 'provider_rejected'
  | 'category_added'
  | 'category_updated'
  | 'category_deleted'
  | 'settings_updated'
  | 'admin_login'
  | 'admin_logout'
  | 'admin_added'
  | 'admin_removed'
  | 'admin_suspended';

export type TargetType = 'service' | 'user' | 'provider' | 'notification' | 'category' | 'system';

export interface ActivityLogEntry {
  id?: string;
  admin_id: string;
  action: AdminAction;
  target_type: TargetType;
  target_id?: string;
  details?: string;
  created_at?: string;
}

// ─── Log Admin Activity ───────────────────────────────────────────
export async function logAdminActivity(
  adminId: string,
  action: AdminAction,
  targetType: TargetType,
  targetId?: string,
  details?: string
): Promise<void> {
  try {
    await supabase.from('admin_logs').insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId || null,
      details: details || null,
    });
  } catch (error) {
    console.error('Failed to log admin activity:', error);
  }
}

// ─── Fetch Activity Logs ──────────────────────────────────────────
export async function getAdminActivityLogs(limit = 50): Promise<ActivityLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    return [];
  }
}

// ─── Admin Notification Types ─────────────────────────────────────
export interface AdminNotification {
  id?: string;
  title: string;
  message: string;
  type: 'announcement' | 'alert' | 'update' | 'promotion';
  target_role: 'all' | 'users' | 'providers';
  status: 'sent' | 'scheduled' | 'draft';
  created_by?: string;
  created_at?: string;
  scheduled_at?: string;
}

// ─── Send Admin Notification ──────────────────────────────────────
export async function sendAdminNotification(
  notification: AdminNotification,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        title: notification.title,
        body: notification.message,
        type: notification.type.toUpperCase(), // Enum in DB is uppercase
        targetType: notification.target_role === 'all' ? 'ALL_USERS' : (notification.target_role === 'providers' ? 'ALL_PROVIDERS' : 'INDIVIDUAL'),
        sender_id: adminId,
      })
      .select()
      .single();

    if (error) throw error;

    // Log the activity
    await logAdminActivity(
      adminId,
      'notification_sent',
      'notification',
      data?.id,
      `Sent "${notification.title}" to ${notification.target_role}`
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── Check Active Bookings Before Service Deletion ────────────────
export async function hasActiveBookings(serviceId: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('service_id', serviceId)
      .in('booking_status', ['pending', 'accepted', 'in_progress']);

    if (error) return true; // Err on the side of caution
    return (count || 0) > 0;
  } catch {
    return true;
  }
}
