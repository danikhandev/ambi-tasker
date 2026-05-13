"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface SocialLinks {
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
  website: string;
}

interface AppBranding {
  appName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
}

interface SettingsContextType {
  socialLinks: SocialLinks;
  socialLinksList: any[];
  branding: AppBranding;
  config: any;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSocialLinks: SocialLinks = {
  facebook: "",
  instagram: "",
  twitter: "",
  linkedin: "",
  youtube: "",
  tiktok: "",
  website: "",
};

const defaultBranding: AppBranding = {
  appName: "AmbiTasker",
  logoUrl: null,
  faviconUrl: null,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(defaultSocialLinks);
  const [socialLinksList, setSocialLinksList] = useState<any[]>([]);
  const [branding, setBranding] = useState<AppBranding>(defaultBranding);
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      // 1. Fetch public settings (isolated from admin auth)
      const res = await fetch("/api/social-media");
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setSocialLinksList(data);
        const linksObj = { ...defaultSocialLinks } as any;
        data.forEach((item: any) => {
          if (item.platform in linksObj) {
            linksObj[item.platform] = item.url;
          }
        });
        setSocialLinks(linksObj);
      }

      // 2. Fetch branding settings
      const brandRes = await fetch("/api/branding");
      const brandData = await brandRes.json();
      if (brandData && !brandData.error) {
        setBranding(brandData);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider value={{ 
      socialLinks, 
      socialLinksList, 
      branding, 
      config, 
      loading, 
      refreshSettings: fetchSettings 
    }}>
      {children}
    </SettingsContext.Provider>
  );
}


export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
