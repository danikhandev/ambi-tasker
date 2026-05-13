/**
 * Admin Permission System Constants
 * 
 * Defines all available modules and specific actions for the RBAC system.
 */

export const ADMIN_MODULES = [
  "overview",
  "users",
  "providers",
  "bookings",
  "services",
  "locations",
  "payments",
  "reports",
  "notifications",
  "settings",
  "admins"
] as const;

export type AdminModule = typeof ADMIN_MODULES[number];

export const ADMIN_PERMISSIONS = {
  OVERVIEW_VIEW: "overview.view",
  USERS_VIEW: "users.view",
  USERS_MANAGE: "users.manage",
  PROVIDERS_VIEW: "providers.view",
  PROVIDERS_MANAGE: "providers.manage",
  BOOKINGS_VIEW: "bookings.view",
  BOOKINGS_MANAGE: "bookings.manage",
  SERVICES_VIEW: "services.view",
  SERVICES_MANAGE: "services.manage",
  LOCATIONS_VIEW: "locations.view",
  LOCATIONS_MANAGE: "locations.manage",
  PAYMENTS_VIEW: "payments.view",
  REPORTS_VIEW: "reports.view",
  REPORTS_MANAGE: "reports.manage",
  NOTIFICATIONS_SEND: "notifications.send",
  SETTINGS_VIEW: "settings.view",
  SETTINGS_MANAGE: "settings.manage",
  ADMINS_MANAGE: "admins.manage",
} as const;

export type AdminPermission = typeof ADMIN_PERMISSIONS[keyof typeof ADMIN_PERMISSIONS];

/**
 * Maps dashboard routes to required permissions
 * These routes correspond to the structure in app/(admin)/admin/*
 */
export const ROUTE_PERMISSIONS: Record<string, AdminPermission> = {
  "/admin/users": "users.view",
  "/admin/providers": "providers.view",
  "/admin/verifications": "providers.manage",
  "/admin/services": "services.view",
  "/admin/categories": "services.view",
  "/admin/service-requests": "services.manage",
  "/admin/locations": "locations.view",
  "/admin/payments": "payments.view",
  "/admin/bookings": "bookings.view",
  "/admin/reports": "reports.view",
  "/admin/notifications": "notifications.send",
  "/admin/messaging": "notifications.send",
  "/admin/settings": "settings.view",
  "/admin/analytics": "overview.view",
  "/admin/sub-admins": "admins.manage",
  "/admin/activity": "admins.manage",
  "/admin/dashboard": "overview.view",
};
