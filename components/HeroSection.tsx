"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, ArrowRight, UserPlus, Sparkles } from "lucide-react";
import { unbounded } from "../app/fonts";
import { useTranslation } from "@/hooks/useTranslation";
import { IS_BETA, PLATFORM_SUBTITLE, getActiveDistrictLabel } from "@/constants/locationConfig";
import styles from "./HeroSection.module.css";

interface HeroSectionProps {
  onSearch?: (query: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <section className={styles.heroContainer}>
      <div className={styles.backgroundGlow} />
      
      <div className={styles.contentWrapper}>
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto px-4">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={styles.badge}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {IS_BETA 
                ? `${PLATFORM_SUBTITLE} • ${getActiveDistrictLabel()}` 
                : (t("landing.hero.badge") || "#1 Service Marketplace")}
            </span>
          </motion.div>

          {/* 1. Large headline */}
          <motion.h1 
            className={`${unbounded.className} ${styles.headline}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Find Trusted <span className="text-primary">Services</span> Near You
          </motion.h1>

          {/* 2. Supporting subtitle */}
          <motion.p 
            className={styles.subtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Connect with verified professionals or start earning by offering your services.
          </motion.p>

          {/* 3. Two CTA Buttons */}
          <motion.div 
            className={styles.ctaWrapper}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/search" className={styles.primaryBtn}>
              Find a Service
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/signup/provider" className={styles.secondaryBtn}>
              Join as a Provider
              <UserPlus className="w-5 h-5" />
            </Link>
          </motion.div>

          {/* 4. Optional search bar below buttons */}
          <motion.div
            className={styles.searchWrapper}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
              <div className={styles.inputGroup}>
                <Search className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder={t("landing.hero.searchPlaceholder") || "What service are you looking for?"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <button type="submit" className={styles.searchBtn}>
                {t("landing.hero.searchBtn") || "Quick Search"}
              </button>
            </form>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            className={styles.trustBadges}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
          >
            <span>{t("landing.wcu.feat1Title") || "Verified Experts"}</span>
            <span>{t("booking.ambiGuarantee") || "Secure Bookings"}</span>
            <span>{t("landing.wcu.feat4Title") || "24/7 Support"}</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
