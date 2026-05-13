"use client";

import { UserProvider } from "./UserContext";
import { AdminProvider } from "./AdminContext";
import { NotificationProvider } from "./NotificationContext";
import { UIProvider } from "./UIContext";
import { SettingsProvider } from "./SettingsContext";

import { SoundProvider } from "./SoundContext";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Centralized Providers Component
 * Wraps all authentication context providers (User, Doctor, Admin)
 * Use this in all layout files to provide authentication context
 */
export default function Providers({ children }: ProvidersProps) {
  return (
    <SettingsProvider>
      <AdminProvider>
        <UserProvider>
          <SoundProvider>
            <UIProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </UIProvider>
          </SoundProvider>
        </UserProvider>
      </AdminProvider>
    </SettingsProvider>
  );
}

