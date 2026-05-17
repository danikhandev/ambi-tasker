"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, ChevronRight, Shield, ShieldCheck, LogIn, User2, MessageSquare, Bell, LogOut, LayoutDashboard, Hammer, Zap, Droplets, Paintbrush, Truck, Briefcase, Search, Check, Globe, Wrench, Siren, Stethoscope, Sun, Scissors, Video, BookOpen, Leaf, Sparkles, Car, HardHat, PartyPopper, Smartphone, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { unbounded } from "@/app/fonts";
import { useUser } from "@/contexts/UserContext";
import { useUI } from "@/contexts/UIContext";
import { useTranslation } from "@/hooks/useTranslation";
import Image from "next/image";
import Logo from "./ui/Logo";
import Brand from "./ui/Brand";
import CircularFrame from "./CircularFrame";
import OnlineDot from "./OnlineDot";
import { SERVICES_LIST, type ServiceItem } from "@/constants/services";
import NotificationBell from "./notifications/NotificationBell";
import BrandText from "./BrandText";
import { useUnreadCount } from "@/hooks/useUnreadCount";

/** Chat icon with live unread badge */
function ChatIconWithBadge({ userId }: { userId: string }) {
  const unread = useUnreadCount(userId);
  return (
    <Link href="/messages" className="relative p-2 text-foreground/50 hover:text-primary hover:bg-primary/5 rounded-xl transition-all duration-200">
      <MessageSquare className="w-5 h-5" />
      {unread > 0 && (
        <span className="absolute top-2 right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}


const SERVICE_CATEGORIES = [
  // 1️⃣ Core Services (Priority)
  {
    id: "electrician",
    nameKey: "categories.electrician.name",
    slug: "electrician",
    icon: Zap,
    descriptionKey: "categories.electrician.desc",
    popularKeys: ["services.electrician_popular.wiring", "services.electrician_popular.elecRepair", "services.electrician_popular.fixtureInst"]
  },
  {
    id: "plumber",
    nameKey: "categories.plumber.name",
    slug: "plumber",
    icon: Droplets,
    descriptionKey: "categories.plumber.desc",
    popularKeys: ["services.plumber_popular.pipeRepair", "services.plumber_popular.fixtureInst", "services.plumber_popular.plumbingRepair"]
  },
  {
    id: "mechanic",
    nameKey: "categories.mechanic.name",
    slug: "mechanic",
    icon: Wrench,
    descriptionKey: "categories.mechanic.desc",
    popularKeys: ["services.mechanic_popular.bikeRepair", "services.mechanic_popular.carRepair", "services.mechanic_popular.engineService"]
  },
  {
    id: "painting",
    nameKey: "categories.painting.name",
    slug: "painting",
    icon: Paintbrush,
    descriptionKey: "categories.painting.desc",
    popularKeys: ["services.painting_popular.house", "services.painting_popular.wallTexture", "services.painting_popular.interior"]
  },
  {
    id: "education",
    nameKey: "categories.education.name",
    slug: "education",
    icon: BookOpen,
    descriptionKey: "categories.education.desc",
    popularKeys: ["services.education_popular.homeTutor", "services.education_popular.onlineTutor", "services.education_popular.skillTraining"]
  },
  {
    id: "gardening",
    nameKey: "categories.gardening.name",
    slug: "gardening",
    icon: Leaf,
    descriptionKey: "categories.gardening.desc",
    popularKeys: ["services.gardening_popular.lawn", "services.gardening_popular.planting", "services.gardening_popular.landscape"]
  },
  {
    id: "cleaning",
    nameKey: "categories.cleaning.name",
    slug: "cleaning",
    icon: Sparkles,
    descriptionKey: "categories.cleaning.desc",
    popularKeys: ["services.cleaning_popular.home", "services.cleaning_popular.office", "services.cleaning_popular.deep"]
  },
  {
    id: "security",
    nameKey: "categories.security.name",
    slug: "security",
    icon: ShieldCheck,
    descriptionKey: "categories.security.desc",
    popularKeys: ["services.security_popular.guard", "services.security_popular.homeSecurity", "services.security_popular.cctv"]
  },
  {
    id: "automotive",
    nameKey: "categories.automotive.name",
    slug: "automotive",
    icon: Car,
    descriptionKey: "categories.automotive.desc",
    popularKeys: ["services.automotive_popular.wash", "services.automotive_popular.detailing", "services.automotive_popular.maintenance"]
  },

  // 2️⃣ New Categories
  {
    id: "appliance-repair",
    nameKey: "categories.appliance-repair.name",
    slug: "appliance-repair",
    icon: Smartphone,
    descriptionKey: "categories.appliance-repair.desc",
    popularKeys: ["services.appliance_popular.acRepair", "services.appliance_popular.fridgeRepair", "services.appliance_popular.washingMachine"]
  },
  {
    id: "emergency-assistance",
    nameKey: "categories.emergency-assistance.name",
    slug: "emergency-assistance",
    icon: Siren,
    descriptionKey: "categories.emergency-assistance.desc",
    popularKeys: ["services.emergency_popular.plumbing", "services.emergency_popular.electrical", "services.emergency_popular.roadside"]
  },
  {
    id: "health-medical",
    nameKey: "categories.health-medical.name",
    slug: "health-medical",
    icon: Stethoscope,
    descriptionKey: "categories.health-medical.desc",
    popularKeys: ["services.health_popular.doctorVisit", "services.health_popular.nurseCare", "services.health_popular.labTest"]
  },
  {
    id: "solar-installation",
    nameKey: "categories.solar-installation.name",
    slug: "solar-installation",
    icon: Sun,
    descriptionKey: "categories.solar-installation.desc",
    popularKeys: ["services.solar_popular.installation", "services.solar_popular.inverter", "services.solar_popular.battery"]
  },
  {
    id: "beauty-salon",
    nameKey: "categories.beauty-salon.name",
    slug: "beauty-salon",
    icon: Scissors,
    descriptionKey: "categories.beauty-salon.desc",
    popularKeys: ["services.beauty_popular.haircut", "services.beauty_popular.facial", "services.beauty_popular.massage"]
  },
  {
    id: "cctv-installation",
    nameKey: "categories.cctv-installation.name",
    slug: "cctv-installation",
    icon: Video,
    descriptionKey: "categories.cctv-installation.desc",
    popularKeys: ["services.cctv_popular.setup", "services.cctv_popular.securitySystem", "services.cctv_popular.alarm"]
  },
  {
    id: "home-renovation",
    nameKey: "categories.home-renovation.name",
    slug: "home-renovation",
    icon: HardHat,
    descriptionKey: "categories.home-renovation.desc",
    popularKeys: ["services.renovation_popular.fullHome", "services.renovation_popular.kitchen", "services.renovation_popular.bathroom"]
  },
  {
    id: "event-management",
    nameKey: "categories.event-management.name",
    slug: "event-management",
    icon: PartyPopper,
    descriptionKey: "categories.event-management.desc",
    popularKeys: ["services.event_popular.wedding", "services.event_popular.decoration", "services.event_popular.catering"]
  }
];


export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<typeof SERVICE_CATEGORIES[0] | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const { t, isRTL, language } = useTranslation();
  const { setLanguage } = useUI();
  const { user, logout, activePerspective, switchPerspective, loading: userLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();


  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Load recent searches
    const saved = localStorage.getItem("recent_searches");
    if (saved) setRecentSearches(JSON.parse(saved));

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const saveSearch = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recent_searches", JSON.stringify(updated));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    saveSearch(searchQuery);
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery("");
    setShowSearchDropdown(false);
  };

  const handleSwitchPerspective = async (perspective: "consumer" | "provider") => {
    await switchPerspective(perspective);
    if (perspective === "consumer") {
      router.push("/user/dashboard");
    } else {
      router.push("/provider/dashboard");
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === "en" ? "ur" : "en";
    setLanguage(nextLang);
  };

  const currentDashboardLink = activePerspective === "consumer" ? "/user/dashboard" : "/provider/dashboard";

  // Hide header on focused auth/onboarding pages
  const hideHeaderOn = ["/onboarding", "/signup", "/login", "/splash"];
  if (hideHeaderOn.some(path => pathname?.startsWith(path))) return null;

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
          ? "bg-white/98 backdrop-blur-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_24px_-4px_rgba(0,0,0,0.04)] border-b border-black/[0.04]"
          : "bg-white border-b border-black/[0.04]"
          }`}
      >
        <nav className={`max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 transition-all duration-500 ${isScrolled ? 'py-2' : 'py-2.5 sm:py-3'}`}>
          <div className="flex items-center justify-between" style={{ flexWrap: 'nowrap', gap: '16px' }}>
            {/* Logo & Branding */}
            <div style={{ flex: 'none' }}>
              <Link
                href="/"
                className={`relative z-50 group transition-all duration-200 active:scale-[0.97] flex items-center ${isRTL ? "origin-right" : "origin-left"}`}
                dir="ltr"
              >
                <Brand
                  size="sm"
                  className="group-hover:opacity-80 transition-opacity duration-200"
                />
              </Link>
            </div>

            {/* Desktop Navigation - Center Zone */}
            <div className={`hidden lg:flex items-center`} style={{ flex: 'none', gap: '20px' }}>
              {activePerspective === 'provider' ? (
                <div className="w-10" /> // Minimal spacer for layout balance
              ) : (
                <>
                  {/* Find a Service Mega Menu */}
                  <div
                    className="relative"
                    onMouseEnter={() => setActiveDropdown("find-service")}
                    onMouseLeave={() => {
                      setActiveDropdown(null);
                      setActiveCategory(null);
                    }}
                  >
                    <button
                      className={`flex items-center gap-1.5 transition-all duration-200 font-semibold text-[11px] uppercase tracking-[0.08em] py-2 ${activeDropdown === "find-service" ? "text-primary" : "text-foreground/70 hover:text-foreground"
                        }`}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {t("header.services") || t("nav.services") || "Find a Service"}
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-300 ${activeDropdown === "find-service" ? "rotate-180" : ""
                          }`}
                      />
                    </button>

                    <AnimatePresence>
                      {activeDropdown === "find-service" && (
                        <motion.div
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 15, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className={`absolute top-full mt-4 w-[800px] bg-card rounded-2xl shadow-xl border border-border flex h-[400px] z-50 overflow-hidden ${isRTL ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}`}
                        >
                          {/* Left/Right based on RTL: Category List */}
                          <div className={`w-1/3 bg-muted/50 py-6 ${isRTL ? 'border-l' : 'border-r'} border-border`}>
                            {SERVICE_CATEGORIES.map((cat) => (
                              <button
                                key={cat.id}
                                onMouseEnter={() => setActiveCategory(cat)}
                                className={`w-full text-left px-8 py-4 text-sm font-semibold flex items-center justify-between group transition-all ${activeCategory?.id === cat.id
                                  ? "bg-card text-primary"
                                  : "text-text-secondary hover:bg-card hover:text-primary"
                                  } ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                              >
                                <span className="flex items-center gap-3">
                                  <cat.icon className={`w-5 h-5 transition-transform duration-300 ${activeCategory?.id === cat.id ? "scale-110" : ""}`} />
                                  {t(cat.nameKey)}
                                </span>
                                {activeCategory?.id === cat.id && <ChevronRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />}
                              </button>
                            ))}
                          </div>

                          {/* Details Area */}
                          <div className="w-2/3 p-8 bg-card relative">
                            {activeCategory ? (
                              <motion.div
                                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={activeCategory.id}
                                className={`h-full flex flex-col ${isRTL ? 'text-right items-end' : 'text-left items-start'}`}
                              >
                                <div className={`flex items-center gap-4 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                  <div className="w-14 h-14 bg-primary/10 rounded-2xl text-primary flex items-center justify-center">
                                    <activeCategory.icon className="w-8 h-8" />
                                  </div>
                                  <div className={isRTL ? 'text-right' : ''}>
                                    <h3 className={`${unbounded.className} text-xl font-bold text-foreground`}>
                                      {t(activeCategory.nameKey)}
                                    </h3>
                                    <p className="text-text-hint text-xs mt-1">{activeCategory.descriptionKey ? t(activeCategory.descriptionKey) : ""}</p>
                                  </div>
                                </div>

                                <div className={`grid grid-cols-2 gap-x-8 gap-y-4 mb-auto mt-10 w-full ${isRTL ? 'rtl-grid' : ''}`}>
                                  <div className={isRTL ? 'text-right' : ''}>
                                    <h4 className="text-[10px] font-bold text-text-hint uppercase tracking-[0.2em] mb-4">
                                      {t("footer.popularNearYou")}
                                    </h4>
                                    <div className="space-y-3">
                                      {activeCategory.popularKeys.map((key) => (
                                        <Link
                                          key={key}
                                          href={`/search?category=${activeCategory.slug}&q=${t(key)}`}
                                          className={`block text-xs text-text-secondary hover:text-primary transition-colors flex items-center gap-2 group ${isRTL ? 'flex-row-reverse' : ''}`}
                                        >
                                          <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary transition-colors" />
                                          {t(key)}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                  <div className={isRTL ? 'text-right' : ''}>
                                    <h4 className="text-[10px] font-bold text-text-hint uppercase tracking-[0.2em] mb-4">
                                      {t("providerOnboarding.steps.serviceIntelligence")}
                                    </h4>
                                    <ul className="space-y-3">
                                      <li className={`text-xs text-text-hint flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        <Check className="w-4 h-4 text-green-500" /> {t("common.verified")}
                                      </li>
                                      <li className={`text-xs text-text-hint flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        <Check className="w-4 h-4 text-green-500" /> <BrandText text={t("booking.ambiGuarantee")} />
                                      </li>
                                      <li className={`text-xs text-text-hint flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        <Check className="w-4 h-4 text-green-500" /> {t("nav.support")}
                                      </li>
                                    </ul>
                                  </div>
                                </div>

                                <Link
                                  href={`/search?category=${activeCategory.slug}`}
                                  className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark shadow-sm hover:shadow-md transition-all w-fit mt-8 active:scale-95 transition-all duration-200"
                                >
                                  {t("common.next")} {t(activeCategory.nameKey)}
                                </Link>
                              </motion.div>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center text-text-hint">
                                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                                  <Search className="w-10 h-10 opacity-30" />
                                </div>
                                <p className="font-bold text-sm">{t("header.searchPlaceholder")}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Link
                    href="/how-it-works"
                    className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-semibold text-[11px] uppercase tracking-[0.08em] relative group py-2"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {t("nav.howItWorks") || "How it Works"}
                    <span className={`absolute bottom-0 w-0 h-[2px] bg-primary rounded-full group-hover:w-full transition-all duration-300 ${isRTL ? "right-0" : "left-0"}`} />
                  </Link>

                  <Link
                    href="/about"
                    className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-semibold text-[11px] uppercase tracking-[0.08em] relative group py-2"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {t("nav.aboutUs") || "About Us"}
                    <span className={`absolute bottom-0 w-0 h-[2px] bg-primary rounded-full group-hover:w-full transition-all duration-300 ${isRTL ? "right-0" : "left-0"}`} />
                  </Link>
                </>
              )}
            </div>

            {/* Desktop CTA / Profile Zone */}
            <div className="hidden lg:flex items-center" style={{ flex: 'none', gap: '10px' }}>
              {/* Language Switcher Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 text-foreground/60 hover:text-foreground transition-all duration-200 border border-black/[0.04] group"
                title={t("header.switchLanguage")}
              >
                <Globe className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-[10px] font-bold uppercase tracking-wide leading-none">
                  {language === "en" ? "اردو" : "EN"}
                </span>
              </button>

              {user && (
              <div className="relative hidden xl:block group">
                <form onSubmit={handleSearchSubmit} className={`relative group/search`}>
                  <Search className={`absolute start-3.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-foreground/30 transition-colors duration-200 group-focus-within/search:text-primary`} />
                  <input
                    type="text"
                    placeholder={t("header.whatServiceNeed")}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchDropdown(true);
                    }}
                    onFocus={() => setShowSearchDropdown(true)}
                    className={`ps-9 pe-4 h-9 w-52 border border-black/[0.06] rounded-xl bg-gray-50/80 text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 focus:bg-white transition-all duration-200 text-[11px] font-medium group-hover/search:bg-white group-hover/search:border-black/[0.08]`}
                  />
                </form>

                {/* Search Dropdown */}
                <AnimatePresence>
                  {showSearchDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowSearchDropdown(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute top-full left-0 right-0 mt-3 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden min-w-[320px]"
                      >
                        {searchQuery.trim() ? (
                          <div className="p-2">
                            <div className="px-4 py-3 text-[10px] font-black text-text-hint uppercase tracking-widest border-b border-border/50 mb-2">
                              {t("search.suggestions") || "Suggestions"}
                            </div>
                            <div className="space-y-1">
                              {SERVICE_CATEGORIES.filter(c => t(c.nameKey).toLowerCase().includes(searchQuery.toLowerCase()))
                                .slice(0, 2)
                                .map(cat => (
                                  <button
                                    key={cat.id}
                                    onClick={() => {
                                      saveSearch(t(cat.nameKey));
                                      router.push(`/search?category=${cat.slug}`);
                                      setShowSearchDropdown(false);
                                      setSearchQuery("");
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 rounded-xl transition-all group"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                      <cat.icon size={14} />
                                    </div>
                                    <div className={isRTL ? 'text-right' : ''}>
                                      <span className="text-xs font-bold text-foreground block">{t(cat.nameKey)}</span>
                                      <span className="text-[9px] font-bold text-text-hint uppercase tracking-tighter">Category</span>
                                    </div>
                                  </button>
                                ))}

                              {SERVICES_LIST.filter((s: ServiceItem) => t(s.titleKey).toLowerCase().includes(searchQuery.toLowerCase()))
                                .slice(0, 3)
                                .map((service: ServiceItem) => (
                                  <button
                                    key={service.id}
                                    onClick={() => {
                                      saveSearch(t(service.titleKey));
                                      router.push(`/search?q=${encodeURIComponent(t(service.titleKey))}`);
                                      setShowSearchDropdown(false);
                                      setSearchQuery("");
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 rounded-xl transition-all group"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-accent/5 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                                      <service.icon size={14} />
                                    </div>
                                    <div className={isRTL ? 'text-right' : ''}>
                                      <span className="text-xs font-bold text-foreground block">{t(service.titleKey)}</span>
                                      <span className="text-[9px] font-bold text-text-hint uppercase tracking-tighter">Service</span>
                                    </div>
                                  </button>
                                ))}
                            </div>
                            <button
                              onClick={handleSearchSubmit}
                              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-primary/5 rounded-xl transition-all group border-t border-border/30 mt-2"
                            >
                              <Search size={16} className="text-primary" />
                              <span className="text-xs font-black text-primary italic">Search for &quot;{searchQuery}&quot;</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 space-y-6">
                            {recentSearches.length > 0 && (
                              <div>
                                <div className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] mb-3">{t("search.recent") || "Recent Searches"}</div>
                                <div className="space-y-1">
                                  {recentSearches.map((s, i) => (
                                    <button
                                      key={i}
                                      onClick={() => {
                                        setSearchQuery(s);
                                        router.push(`/search?q=${encodeURIComponent(s)}`);
                                        setShowSearchDropdown(false);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs font-bold text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all flex items-center gap-2"
                                    >
                                      <Clock size={12} className="opacity-50" /> {s}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div>
                              <div className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] mb-4">{t("search.popular") || "Popular Categories"}</div>
                              <div className="grid grid-cols-2 gap-2">
                                {SERVICE_CATEGORIES.slice(0, 4).map(cat => (
                                  <button
                                    key={cat.id}
                                    onClick={() => {
                                      router.push(`/search?category=${cat.slug}`);
                                      setShowSearchDropdown(false);
                                    }}
                                    className="px-3 py-2 bg-muted/50 rounded-xl text-[10px] font-bold text-foreground hover:bg-primary hover:text-white transition-all text-center"
                                  >
                                    {t(cat.nameKey)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              )}
              {!user && (
                <Link
                  href="/signup/provider"
                  className="hidden 2xl:block text-[10px] font-bold uppercase tracking-[0.06em] text-foreground/50 hover:text-primary transition-colors duration-200"
                  style={{ whiteSpace: 'nowrap', flex: 'none' }}
                >
                  {t("header.becomeProvider")}
                </Link>
              )}

              {user ? (
                <>
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-0.5 bg-gray-50 p-1 rounded-xl border border-black/[0.04]">
                      <ChatIconWithBadge userId={user.id} />
                      <NotificationBell />
                    </div>

                    {/* Airbnb-style Profile Pill */}
                    <div
                      className="relative"
                      onMouseEnter={() => setShowProfileMenu(true)}
                      onMouseLeave={() => setShowProfileMenu(false)}
                    >
                      <button className="flex items-center gap-2 p-1 pl-3 bg-white border border-black/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-full hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-200 active:scale-[0.97] group">
                        <Menu className="w-3.5 h-3.5 text-foreground/40 group-hover:text-foreground/70 transition-colors duration-200" />
                        <div className="relative">
                           {user.avatar ? (
                             <CircularFrame
                               src={user.avatar}
                               alt="P"
                               size={32}
                               border={false}
                             />
                           ) : (
                             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                               <User2 className="w-4 h-4" />
                             </div>
                           )}
                           <div className="absolute -top-0.5 -right-0.5 z-10">
                              <OnlineDot isOnline={true} size={10} />
                           </div>
                        </div>
                      </button>

                      <AnimatePresence>
                        {showProfileMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className={`absolute top-full mt-3 w-64 bg-card rounded-2xl shadow-2xl border border-border/60 p-2 z-50 ${isRTL ? 'left-0' : 'right-0'}`}
                          >
                            <div className="px-4 py-4 border-b border-muted/50 mb-2">
                              <p className="text-sm font-black text-foreground truncate">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-[10px] font-medium text-text-hint truncate mt-0.5 tracking-tighter">
                                {user.email?.toLowerCase()}
                              </p>
                            </div>

                            <Link 
                              href={user.email?.toLowerCase() === "adminambitasker@gmail.com" ? "/admin/dashboard" : (user.role === 'PROVIDER' ? currentDashboardLink : "/user/dashboard")} 
                              className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-text-secondary hover:bg-primary/5 hover:text-primary rounded-xl transition-all"
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              {t("nav.dashboard")}
                            </Link>

                            <Link href="/user/profile" className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-text-secondary hover:bg-primary/5 hover:text-primary rounded-xl transition-all">
                              <User2 className="w-4 h-4" />
                              {t("header.accountSettings")}
                            </Link>

                            <div className="border-t border-muted/40 mt-2 pt-2">
                              {/* Perspective Switch — Disabled for Super Admin */}
                              {user.email?.toLowerCase() !== "adminambitasker@gmail.com" && (user.role === "PROVIDER" || user.role === "ADMIN") && (
                                <button
                                  onClick={() => handleSwitchPerspective(activePerspective === "consumer" ? "provider" : "consumer")}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-primary hover:bg-primary/5 rounded-xl transition-all"
                                >
                                  <Zap className="w-4 h-4" />
                                  {activePerspective === "consumer" ? "Enter Provider Dashboard" : "Enter Customer Dashboard"}
                                </button>
                              )}
                              
                              {user.role === "USER" && !user.isUserSignUpForProvider && (
                                <Link href="/become-provider" className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-primary hover:bg-primary/5 rounded-xl transition-all">
                                  <Hammer className="w-4 h-4" />
                                  {t("header.becomeProvider")}
                                </Link>
                              )}
                              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                <LogOut className="w-4 h-4" />
                                {t("header.signOut")}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 'none' }}>
                  <Link
                    href="/login"
                    className="text-[11px] font-semibold uppercase tracking-[0.06em] text-foreground/60 hover:text-foreground transition-colors duration-200"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {t("auth.signIn") || "Sign In"}
                  </Link>
                  <Link
                    href="/select-role"
                    className="h-9 px-5 flex items-center justify-center bg-foreground text-white text-[11px] font-bold uppercase tracking-[0.06em] rounded-full hover:bg-primary transition-all duration-300 active:scale-[0.97] shadow-sm hover:shadow-lg hover:shadow-primary/15"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {t("onboarding.getStarted") || "Get Started"}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Toggle & Search */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={toggleLanguage}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 border border-black/[0.04]"
              >
                <span className="text-[9px] font-bold text-foreground/60">{language === "en" ? "اردو" : "EN"}</span>
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-foreground text-background shadow-sm"
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: isRTL ? "-100%" : "100%" }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ opacity: 0, x: isRTL ? "-100%" : "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed inset-0 z-40 bg-background lg:hidden pt-28 px-8 flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}
          >
            <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar">
              {activePerspective === 'provider' ? (
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] mb-6">{t("nav.dashboard")}</h3>
                  <Link href="/provider/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block text-2xl font-black text-foreground">
                    {t("nav.dashboard")}
                  </Link>
                  <Link href="/provider/bookings" onClick={() => setIsMobileMenuOpen(false)} className="block text-2xl font-black text-foreground">
                    {t("nav.bookings")}
                  </Link>
                  <Link href="/provider/earnings" onClick={() => setIsMobileMenuOpen(false)} className="block text-2xl font-black text-foreground">
                    {t("nav.earnings")}
                  </Link>
                  <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="block text-2xl font-black text-foreground">
                    {t("nav.aboutUs")}
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] mb-6">{t("header.services")}</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {SERVICE_CATEGORIES.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/search?category=${cat.slug}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-5 p-4 bg-muted/30 rounded-2xl group transition-all active:scale-[0.98] ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                          <div className="p-3 bg-card rounded-xl text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                            <cat.icon className="w-6 h-6" />
                          </div>
                          <span className="text-lg font-black text-foreground">{t(cat.nameKey)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-muted pt-8 space-y-6">
                    <Link href="/how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="block text-xl font-black text-foreground">
                      {t("nav.howItWorks")}
                    </Link>
                    <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="block text-xl font-black text-foreground">
                      {t("nav.aboutUs")}
                    </Link>
                    {!user?.isUserSignUpForProvider && (
                      <Link href="/become-provider" onClick={() => setIsMobileMenuOpen(false)} className="block text-xl font-black text-primary flex items-center gap-2">
                        <Zap className="w-5 h-5 animate-pulse" />
                        {t("header.becomeProvider")}
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="py-8 border-t border-muted mt-auto">
              {user ? (
                <div className="space-y-4">
                  <Link
                    href={currentDashboardLink}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn-primary w-full h-14 rounded-xl shadow-lg shadow-primary/20"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    {t("nav.dashboard")}
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    className="flex items-center justify-center gap-3 w-full h-14 border border-red-100 bg-red-50/50 rounded-xl font-bold text-xs uppercase tracking-widest text-red-600"
                  >
                    <LogOut className="w-5 h-5" />
                    {t("header.signOut")}
                  </button>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Link
                    href="/select-role"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 h-14 flex items-center justify-center border border-muted rounded-xl font-bold text-xs uppercase tracking-widest"
                  >
                    {t("auth.signIn")}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn-primary flex-1 h-14 rounded-xl shadow-lg shadow-primary/20"
                  >
                    {t("onboarding.getStarted")}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
