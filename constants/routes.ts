/**
 * AmbiTasker Route Configuration
 * 
 * Centralized source of truth for all application routes.
 * Ensures consistent navigation and easy refactoring.
 */

export const AUTH_ROUTES = {
  LOGIN: "/login",
  SIGNUP: "/signup",
  SELECT_ROLE: "/select-role",
  VERIFY_EMAIL: "/verify-email",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
};

export const ADMIN_ROUTES = {
  DASHBOARD: "/admin/dashboard",
  USERS: "/admin/users",
  PROVIDERS: "/admin/providers",
  BOOKINGS: "/admin/bookings",
  SERVICES: "/admin/services",
  LOCATIONS: "/admin/locations",
  PAYMENTS: "/admin/payments",
  ANALYTICS: "/admin/analytics",
  VERIFICATIONS: "/admin/verifications",
  REPORTS: "/admin/reports",
  NOTIFICATIONS: "/admin/notifications",
  MESSAGING: "/admin/messaging",
  SETTINGS: "/admin/settings",
  SUB_ADMINS: "/admin/sub-admins",
  LOGS: "/admin/logs",
};

export const USER_ROUTES = {
  HOME: "/user/dashboard",
  BOOKINGS: "/user/bookings",
  PROFILE: "/user/profile",
  SETTINGS: "/user/settings",
  NOTIFICATIONS: "/user/notifications",
  MESSAGES: "/messages", // Messaging might be global
  CHECKOUT: "/user/checkout",
  SUPPORT: "/user/support",
};

export const PROVIDER_ROUTES = {
  DASHBOARD: "/provider/dashboard",
  BOOKINGS: "/provider/bookings",
  EARNINGS: "/provider/earnings",
  PROFILE: "/provider/profile",
  SETTINGS: "/provider/settings",
  VERIFY: "/provider/verify",
  CHAT: "/provider/chat",
  NOTIFICATIONS: "/provider/notifications",
};

export const PUBLIC_ROUTES = [
  "/",
  "/services",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/help",
];

export const ERROR_ROUTES = {
  NOT_FOUND: "/404",
  UNAUTHORIZED: "/403",
};
