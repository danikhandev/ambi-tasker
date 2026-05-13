"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { unbounded } from "@/app/fonts";
import { logger } from "@/utils/logger";
import {
  Mail,
  MapPin,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Heart,
  CheckCircle2,
  Phone,
  ArrowUpRight,
  Globe,
  Download
} from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import Logo from "./ui/Logo";
import Brand from "./ui/Brand";
import SocialMediaIcons from "./SocialMediaIcons";
import { useUI } from "@/contexts/UIContext";

export default function Footer() {
  const pathname = usePathname();
  const { t, isRTL } = useTranslation();
  const { showToast } = useUI();
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [footerCopyrightText, setFooterCopyrightText] = useState("© 2026 AmbiTasker. Empowering local professionals across Pakistan 🇵🇰");

  // Fetch branding settings
  useEffect(() => {
    fetch("/api/branding")
      .then(res => res.json())
      .then(data => {
        if (data && data.footerCopyrightText) {
          setFooterCopyrightText(data.footerCopyrightText);
        }
      })
      .catch(err => console.error("Failed to fetch footer text:", err));
  }, []);

  // Don't show footer on focused pages (chat, onboarding, auth)
  const hideOn = ["/chat", "/onboarding", "/register", "/login", "/splash"];
  if (hideOn.some(path => pathname?.startsWith(path))) {
    return null;
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribed(true);
    setTimeout(() => {
      setEmail("");
      setIsSubscribed(false);
    }, 3000);
  };

  const footerLinks = {
    explore: [
      { name: t("footer.browseServices"), href: "/search" },
      { name: t("footer.popularNearYou"), href: "/search?sort=popular" },
      { name: t("footer.howItWorks"), href: "/how-it-works" },
      { name: t("footer.giftCards"), href: "/contact" },
      { name: t("footer.AmbiTasker Pro") || "Ambi Tasker Pro", href: "/signup/provider" },
    ],
    company: [
      { name: t("footer.aboutUs"), href: "/about" },
      { name: t("footer.careers"), href: "/contact" },
      { name: t("footer.pressNews"), href: "/contact" },
      { name: t("footer.trustSafety"), href: "/terms" },
    ],
    support: [
      { name: t("footer.support"), href: "/contact" },
      { name: t("footer.terms"), href: "/terms" },
      { name: t("footer.privacy"), href: "/privacy" },
      { name: t("footer.cookieSettings"), href: "/contact" },
      { name: t("footer.accessibility"), href: "/contact" },
    ],
  };

  const socialLinks = []; // Intentionally empty to clean up but avoid other refactoring

  return (
    <footer className="relative overflow-hidden pt-24 pb-12 border-t border-border transition-colors duration-500 bg-background">
      {/* Animated Background Glows */}
      <div className={`absolute top-0 ${isRTL ? 'right-1/4' : 'left-1/4'} w-[500px] h-[500px] bg-primary/5 dark:bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 animate-pulse pointer-events-none`} />
      <div className={`absolute bottom-0 ${isRTL ? 'left-1/4' : 'right-1/4'} w-[400px] h-[400px] bg-accent/5 dark:bg-accent/10 blur-[100px] rounded-full translate-y-1/2 pointer-events-none`} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-16 mb-20">
          {/* Brand Column */}
          <div className="lg:col-span-2 text-left" dir="ltr">
            <div className="space-y-10">
              <Link href="/" className="inline-block transition-transform hover:scale-[1.02]">
                <Brand size="lg" />
              </Link>
              <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
                Your trusted partner for home services and professional tasks. 
                Connecting expertise with local demand since 2024.
              </p>
            </div>

            <div className="space-y-4">
              <div className={`flex items-center gap-4 text-foreground group cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-all group-hover:scale-110">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">{t("footer.emailUs")}</p>
                  <a href="mailto:ambitasker@gmail.com" className="font-bold hover:text-primary transition-colors text-sm">ambitasker@gmail.com</a>
                </div>
              </div>

              <div className={`flex items-center gap-4 text-foreground group ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent transition-all group-hover:scale-110">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">{t("footer.callSupport")}</p>
                  <span className="font-bold text-sm" dir="ltr">+92 300 123 4567</span>
                </div>
              </div>

              <div className={`flex items-center gap-4 text-foreground dark:text-white group ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center text-text-secondary transition-all group-hover:scale-110">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">{t("footer.headquarters")}</p>
                  <span className="font-bold text-sm">Haripur, KPK, Pakistan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className={`lg:col-span-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              <h3 className={`${unbounded.className} font-black text-foreground mb-8 text-[11px] uppercase tracking-[0.2em]`}>
                {t(`footer.${title}`)}
              </h3>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className={`text-text-secondary hover:text-primary transition-all text-[13px] font-bold flex items-center gap-2 group ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <span className="w-1 h-1 rounded-full bg-border group-hover:bg-primary transition-colors" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Mobile App Column */}
          <div className={`lg:col-span-1 ${isRTL ? 'text-right' : 'text-left'}`}>
            <h3 className={`${unbounded.className} font-black text-foreground dark:text-white mb-10 text-[11px] uppercase tracking-[0.3em]`}>
              {t("footer.download")}
            </h3>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => showToast("iOS App coming soon to App Store!", "info")}
                className={`flex items-center gap-4 px-6 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[20px] hover:bg-primary hover:text-white transition-all duration-300 text-left group shadow-lg active:scale-95 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                <Download className="w-5 h-5 group-hover:animate-bounce shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-tighter opacity-60 leading-none mb-1">{t("footer.appStore")}</span>
                  <span className="text-xs font-black leading-none">{t("footer.iosVersion")}</span>
                </div>
              </button>
              <button 
                onClick={() => showToast("Android APK coming soon!", "info")}
                className={`flex items-center gap-4 px-6 py-4 bg-card border border-border rounded-[20px] hover:border-primary/20 hover:shadow-xl transition-all duration-300 shadow-sm active:scale-95 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                <Download className="w-5 h-5 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-tighter opacity-50 leading-none mb-1">{t("footer.playStore")}</span>
                  <span className="text-xs font-black leading-none text-foreground">{t("footer.androidApk")}</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Newsletter & Bottom Bar */}
        <div className="border-t border-border dark:border-gray-800 pt-16 pb-8">
          <div className={`flex flex-col lg:flex-row justify-between items-center gap-8 mb-16 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
            <div className={`max-w-md ${isRTL ? 'text-right' : 'text-left'}`}>
              <h2 className={`${unbounded.className} text-xl font-black text-foreground dark:text-white mb-3 tracking-tight`}>
                {t("footer.newsletter")}
              </h2>
              <p className="text-sm text-text-secondary dark:text-gray-400 font-bold leading-relaxed">
                {t("footer.newsletterDesc")}
              </p>
            </div>

            <div className="w-full lg:w-auto max-w-lg flex-1">
              <form onSubmit={handleSubscribe} className={`flex gap-2 p-2 bg-card border border-border rounded-2xl focus-within:ring-4 focus-within:ring-primary/5 focus-within:border-primary/20 transition-all shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 px-4 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Mail className="w-4 h-4 text-text-hint" />
                  <input
                    type="email"
                    placeholder="name@email.com"
                    className={`bg-transparent border-none px-0 py-3 text-xs text-foreground placeholder:text-text-hint focus:ring-0 font-bold w-full ${isRTL ? 'text-right' : 'text-left'}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 h-12 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-all active:scale-95 shadow-lg shadow-black/5"
                >
                  {isSubscribed ? <CheckCircle2 className="w-4 h-4" /> : t("footer.subscribe")}
                </button>
              </form>
            </div>
          </div>

          {/* Socials & Copyright */}
          <div className={`flex flex-col md:flex-row justify-between items-center gap-6 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <SocialMediaIcons />
            </div>

            <div className={`flex flex-col items-center gap-3 ${isRTL ? 'md:items-start' : 'md:items-end'}`}>
              <div className={`flex items-center gap-6 text-[11px] font-black text-text-hint uppercase tracking-widest ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Link href="/terms" className="hover:text-primary transition-colors">{t("footer.terms")}</Link>
                <Link href="/privacy" className="hover:text-primary transition-colors">{t("footer.privacy")}</Link>
                <Link href="/contact" className="hover:text-primary transition-colors">{t("footer.support")}</Link>
              </div>
              <div className={`flex items-center gap-2 text-[11px] text-text-hint font-bold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span>{footerCopyrightText}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
