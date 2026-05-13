"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User as UserIcon, Camera, Lock, Globe, Bell, Shield, Headphones,
    LogOut, ChevronRight, Moon, Sun, Eye, EyeOff,
    Check, X, AlertCircle, CheckCircle2, Loader2,
    Smartphone, Mail, MapPin, ShieldCheck, Zap
} from "lucide-react";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import { unbounded } from "@/app/fonts";
import { useUser } from "@/contexts/UserContext";
import { useUI } from "@/contexts/UIContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useSound } from "@/contexts/SoundContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HARIPUR_AREAS, PAKISTAN_DISTRICTS, getCitiesForDistrict, getAreasForCity } from "@/constants/locations";

import ConnectSection from "@/components/ConnectSection";
import { themes, ThemeType } from "@/constants/themes";

type SettingsSection = "profile" | "password" | "notifications" | "privacy" | "language" | "theme" | null;

export default function SettingsPage() {
    const { user, logout, switchPerspective, activePerspective } = useUser();
    const router = useRouter();

    const { theme, setTheme, language: globalLang, setLanguage: setGlobalLang, showToast } = useUI();
    const { 
        isSoundEnabled, setSoundEnabled, 
        isUISoundEnabled, setUISoundEnabled,
        playNotificationSound, playClickSound,
        availableTones, selectedTone, setSelectedTone 
    } = useSound();
    const { t, isRTL } = useTranslation();
    const [activeSection, setActiveSection] = useState<SettingsSection>(null);

    // Profile form
    const [profileForm, setProfileForm] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        phone: user?.phone || "+92",
        address: user?.address || "",
    });

    // Password form
    const [passwordForm, setPasswordForm] = useState({
        current: "",
        newPassword: "",
        confirm: "",
    });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

    // Notification settings
    const [notifSettings, setNotifSettings] = useState({
        bookingUpdates: true,
        providerStatus: true,
        paymentAlerts: true,
        promotions: false,
        emailNotifs: true,
        smsNotifs: true,
        pushNotifs: true,
    });

    // Privacy settings
    const [privacySettings, setPrivacySettings] = useState({
        profileVisible: true,
        showLocation: false,
        shareActivity: false,
        twoFactorAuth: false,
    });

    const [saving, setSaving] = useState(false);

    // Fetch initial settings
    useEffect(() => {
        if (!user) return;
        setProfileForm({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phone: user.phone || "+92",
            address: user.address || "",
        });
        
        fetch("/api/user/settings").then(res => res.json()).then(data => {
            if (data.success && data.settings) {
                if (data.settings.notifications) setNotifSettings(data.settings.notifications);
                if (data.settings.privacy) setPrivacySettings(data.settings.privacy);
                if (data.settings.language) setGlobalLang(data.settings.language);
            }
        });
    }, [user]);

    const handleSave = async (section: string) => {
        setSaving(true);
        try {
            if (section === "Profile") {
                const res = await fetch("/api/user/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: `${profileForm.firstName} ${profileForm.lastName}`.trim(),
                        phone: profileForm.phone,
                        address: profileForm.address
                    })
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
            } else if (section === "Password") {
                const res = await fetch("/api/user/change-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        currentPassword: passwordForm.current,
                        newPassword: passwordForm.newPassword
                    })
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
                setPasswordForm({ current: "", newPassword: "", confirm: "" });
            } else {
                // Settings payload
                const settingsPayload: any = {};
                if (section.includes("Notification")) settingsPayload.notifications = notifSettings;
                if (section.includes("Privacy")) settingsPayload.privacy = privacySettings;
                if (section.includes("Language")) settingsPayload.language = globalLang;
                if (section.includes("Theme")) settingsPayload.theme = theme;

                const res = await fetch("/api/user/settings", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: user?.isUserSignUpForProvider && activePerspective === 'provider' ? 'PROVIDER' : 'USER', settings: settingsPayload })
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
            }
            showToast(`${section} ${t("common.success").toLowerCase()}!`, "success");
        } catch (error: any) {
            showToast(error.message || `Failed to update ${section}`, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const settingsItems = [
        { id: "profile" as SettingsSection, icon: UserIcon, label: t("settings.editProfile"), desc: t("settings.updatePersonalInfo"), color: "bg-blue-50 text-blue-600" },
        { id: "password" as SettingsSection, icon: Lock, label: t("settings.changePassword"), desc: t("settings.updatePassword"), color: "bg-violet-50 text-violet-600" },
        { id: "notifications" as SettingsSection, icon: Bell, label: t("settings.notifications"), desc: t("settings.manageNotifications"), color: "bg-amber-50 text-amber-600" },
        { id: "privacy" as SettingsSection, icon: Shield, label: t("settings.privacySecurity"), desc: t("settings.controlPrivacy"), color: "bg-green-50 text-green-600" },
        { id: "language" as SettingsSection, icon: Globe, label: t("settings.languageDisplay"), desc: "Manage your preferred language", color: "bg-pink-50 text-pink-600" },
        { id: "theme" as SettingsSection, icon: Moon, label: t("settings.themeSettings") || "Theme Settings", desc: t("settings.selectTheme") || "Select and change application theme", color: "bg-indigo-50 text-indigo-600" },
        { id: "verification" as any, icon: ShieldCheck, label: "Identity Verification", desc: "Secure your account with biometric ID", color: "bg-emerald-50 text-emerald-600" },
    ];

    const bottomItems = [
        { icon: Headphones, label: t("settings.helpSupport"), href: "/support", color: "bg-teal-50 text-teal-600" },
    ];

    const ToggleSwitch = ({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label: string }) => (
        <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
            <span className="text-sm font-semibold text-text-secondary">{label}</span>
            <button
                onClick={onChange}
                className={`relative w-12 h-7 rounded-full transition-all duration-300 ${enabled ? "bg-primary" : "bg-gray-200"}`}
                aria-label={`Toggle ${label}`}
            >
                <motion.div
                    className="absolute top-1 w-5 h-5 bg-card rounded-full shadow-md"
                    animate={{ left: enabled ? (isRTL ? 4 : 24) : (isRTL ? 24 : 4) }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </button>
        </div>
    );

    const displayName = user?.firstName ? `${user.firstName} ${user.lastName}` : "User Profile";

    return (
        <div className="flex-1 bg-background min-h-screen">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                <PageHeader 
                    title={t("settings.settings")}
                    subtitle={t("settings.managePreferences")}
                />

                {/* Profile Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden bg-foreground rounded-[40px] p-8 md:p-10 mb-10 shadow-2xl shadow-primary/10 group"
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] -mr-48 -mt-48 group-hover:bg-primary/30 transition-colors duration-700" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 blur-[100px] -ml-32 -mb-32" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-10">
                        <div className="relative">
                            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white/10 p-1 bg-gradient-to-tr from-primary to-accent shadow-2xl relative overflow-hidden group/avatar">
                                <div className="w-full h-full rounded-full bg-foreground flex items-center justify-center overflow-hidden relative">
                                    {user?.avatar ? (
                                        <Image src={user.avatar} alt="Profile" fill className="object-cover group-hover/avatar:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <UserIcon className="w-12 h-12 text-white/20" />
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveSection("profile")}
                                className="absolute bottom-1 right-1 w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all border-4 border-foreground"
                                aria-label="Change profile picture"
                            >
                                <Camera className="w-4.5 h-4.5" />
                            </button>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <h2 className={`${unbounded.className} text-2xl md:text-3xl font-black text-white mb-3 tracking-tight`}>
                                {user?.firstName} <span className="text-primary">{user?.lastName}</span>
                            </h2>
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                                <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10">
                                    {user?.isUserSignUpForProvider ? t("settings.professionalMode") : t("settings.personalAccount")}
                                </span>
                                <span className="px-4 py-1.5 bg-primary/20 text-primary-foreground/90 text-[10px] font-black uppercase tracking-widest rounded-xl border border-primary/20">
                                    ID: {user?.id?.slice(0, 8)}
                                </span>
                            </div>
                        </div>

                        {user && (
                            <button
                                onClick={async () => {
                                    const nextPerspective = activePerspective === 'provider' ? 'consumer' : 'provider';
                                    await switchPerspective(nextPerspective);
                                    if (user.isUserSignUpForProvider) {
                                        router.push(nextPerspective === 'provider' ? '/provider/dashboard' : '/user/dashboard');
                                        showToast(`Switched to ${nextPerspective === 'provider' ? 'Provider' : 'User'} Mode`, "success");
                                    }
                                }}
                                className="px-6 py-4 bg-white text-gray-950 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all active:scale-95 shadow-xl shadow-black/10 flex items-center gap-3 whitespace-nowrap"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></svg>
                                {!user.isUserSignUpForProvider
                                    ? t("header.becomeProvider")
                                    : (activePerspective === 'provider' ? t("header.userMode") : t("header.proMode"))
                                }
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Settings Sequence Section */}
                <div className="space-y-4 mb-10">
                    {settingsItems.map((item, idx) => (
                        <motion.div key={item.id} className="relative">
                            <motion.button
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + idx * 0.05 }}
                                onClick={() => {
                                    if (item.id === "verification") {
                                        router.push(user?.isUserSignUpForProvider ? "/provider/verify" : "/verify");
                                    } else {
                                        setActiveSection(activeSection === item.id ? null : item.id);
                                    }
                                }}
                                className={`w-full flex items-center gap-6 p-6 md:p-8 rounded-[32px] border-2 transition-all group relative overflow-hidden ${activeSection === item.id
                                    ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 z-10"
                                    : "bg-card border-border hover:border-primary/40 shadow-sm hover:bg-primary/[0.02]"
                                    }`}
                            >
                                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${activeSection === item.id ? "bg-white/20" : item.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                    <item.icon size={activeSection === item.id ? 28 : 24} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className={`text-xs md:text-sm font-black uppercase tracking-widest ${activeSection === item.id ? "text-white" : "text-foreground"}`}>
                                        {item.label}
                                    </h3>
                                    <p className={`text-[10px] md:text-[11px] font-bold mt-1 uppercase tracking-tighter ${activeSection === item.id ? "text-white/60" : "text-text-hint"}`}>
                                        {item.desc}
                                    </p>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    {item.id === "verification" && user?.idVerificationStatus && (
                                        <div className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${user.idVerificationStatus === "VERIFIED" ? "bg-green-500/20 text-green-600" :
                                            user.idVerificationStatus === "PENDING" ? "bg-amber-500/20 text-amber-600" :
                                                "bg-red-500/20 text-red-600"
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.idVerificationStatus === "VERIFIED" ? "bg-green-500" :
                                                user.idVerificationStatus === "PENDING" ? "bg-amber-500" :
                                                    "bg-red-500"
                                                }`} />
                                            {user.idVerificationStatus}
                                        </div>
                                    )}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${activeSection === item.id ? "bg-white/10 rotate-90" : "bg-secondary group-hover:bg-primary group-hover:text-white"}`}>
                                        <ChevronRight size={20} strokeWidth={3} />
                                    </div>
                                </div>
                            </motion.button>
                        </motion.div>
                    ))}
                </div>

                {/* Expandable Settings Panels */}
                <AnimatePresence mode="wait">
                    {activeSection === "profile" && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-card rounded-[28px] border border-border p-6 mb-6 shadow-sm overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                        <UserIcon className="w-5 h-5" />
                                    </div>
                                    <h2 className={`${unbounded.className} text-lg font-bold text-foreground`}>{t("settings.editProfile")}</h2>
                                </div>
                                <button onClick={() => setActiveSection(null)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                                    <X className="w-5 h-5 text-text-hint" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 block px-1">{t("settings.firstName")}</label>
                                    <input
                                        type="text"
                                        className="w-full px-6 py-4.5 bg-background border border-border rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-foreground placeholder:text-text-hint/40"
                                        value={profileForm.firstName}
                                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                                        placeholder="Enter first name"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 block px-1">{t("settings.lastName")}</label>
                                    <input
                                        type="text"
                                        className="w-full px-6 py-4.5 bg-background border border-border rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-foreground placeholder:text-text-hint/40"
                                        value={profileForm.lastName}
                                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                                        placeholder="Enter last name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 mb-8">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-hint block">{t("settings.emailAddress")}</label>
                                <div className="relative">
                                    <Mail className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-text-hint" />
                                    <input
                                        type="email"
                                        disabled
                                        className="w-full py-4 bg-secondary border border-border rounded-2xl transition-all font-bold text-text-hint cursor-not-allowed"
                                        value={profileForm.email}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-hint block">{t("settings.phoneNumber")}</label>
                                    <div className="relative">
                                        <Smartphone className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-text-hint" />
                                        <input
                                            type="text"
                                            className="w-full py-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-bold text-foreground"
                                            value={profileForm.phone}
                                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 mb-10">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-hint block">{t("settings.completeAddress")}</label>
                                <div className="relative">
                                    <MapPin className="absolute top-4 w-5 h-5 text-text-hint" />
                                    <textarea
                                        rows={3}
                                        className="w-full py-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-bold text-foreground resize-none"
                                        value={profileForm.address}
                                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => handleSave("Profile")}
                                disabled={saving}
                                className="btn-primary w-full py-4"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                {saving ? t("settings.saving") : t("settings.saveChanges")}
                            </button>
                        </motion.div>
                    )}

                    {activeSection === "password" && (
                        <motion.div
                            key="password"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-card rounded-[28px] border border-border p-6 mb-6 shadow-sm overflow-hidden"
                        >
                            <h3 className={`${unbounded.className} text-base font-bold text-foreground mb-6`}>{t("settings.changePassword")}</h3>
                            <div className="space-y-5">
                                {[
                                    { key: "current" as const, label: t("settings.currentPassword"), value: passwordForm.current },
                                    { key: "new" as const, label: t("settings.newPassword"), value: passwordForm.newPassword },
                                    { key: "confirm" as const, label: t("settings.confirmNewPassword"), value: passwordForm.confirm },
                                ].map((field) => (
                                    <div key={field.key}>
                                        <label className="block text-[10px] font-black text-text-hint uppercase tracking-widest mb-2">{field.label}</label>
                                        <div className="relative">
                                            <Lock className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-text-hint" />
                                            <input
                                                type={showPasswords[field.key] ? "text" : "password"}
                                                value={field.value}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (field.key === "current") setPasswordForm(prev => ({ ...prev, current: val }));
                                                    else if (field.key === "new") setPasswordForm(prev => ({ ...prev, newPassword: val }));
                                                    else setPasswordForm(prev => ({ ...prev, confirm: val }));
                                                }}
                                                className="w-full py-4 bg-background border border-border rounded-2xl font-bold text-foreground focus:ring-2 focus:ring-primary/20 transition-all"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                                                className="absolute top-1/2 -translate-y-1/2 text-text-hint hover:text-foreground transition-colors"
                                                aria-label={showPasswords[field.key] ? "Hide password" : "Show password"}
                                            >
                                                {showPasswords[field.key] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {passwordForm.newPassword && passwordForm.confirm && (
                                    <div className={`flex items-center gap-2 text-xs font-semibold ${passwordForm.newPassword === passwordForm.confirm ? "text-green-600" : "text-red-500"}`}>
                                        {passwordForm.newPassword === passwordForm.confirm ? (
                                            <><CheckCircle2 className="w-4 h-4" /> {t("settings.passwordsMatch")}</>
                                        ) : (
                                            <><AlertCircle className="w-4 h-4" /> {t("settings.passwordsNotMatch")}</>
                                        )}
                                    </div>
                                )}
                                <button
                                    onClick={() => handleSave("Password")}
                                    disabled={saving || !passwordForm.current || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirm}
                                    className="btn-primary w-full py-4 mt-4"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                                    {saving ? t("settings.updating") : t("settings.updatePasswordBtn")}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeSection === "notifications" && (
                        <motion.div
                            key="notifications"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-card rounded-[28px] border border-border p-6 mb-6 shadow-sm overflow-hidden"
                        >
                            <h3 className={`${unbounded.className} text-base font-bold text-foreground mb-2`}>{t("settings.notificationPreferences")}</h3>
                            <p className="text-xs text-text-hint font-medium mb-6">{t("settings.chooseNotifications")}</p>

                            <div className="mb-6">
                                <p className="text-[10px] font-black text-text-hint uppercase tracking-widest mb-3">{t("settings.alerts")}</p>
                                <ToggleSwitch label={t("settings.bookingUpdates")} enabled={notifSettings.bookingUpdates} onChange={() => setNotifSettings(p => ({ ...p, bookingUpdates: !p.bookingUpdates }))} />
                                <ToggleSwitch label={t("settings.providerStatus")} enabled={notifSettings.providerStatus} onChange={() => setNotifSettings(p => ({ ...p, providerStatus: !p.providerStatus }))} />
                                <ToggleSwitch label={t("settings.paymentAlerts")} enabled={notifSettings.paymentAlerts} onChange={() => setNotifSettings(p => ({ ...p, paymentAlerts: !p.paymentAlerts }))} />
                                <ToggleSwitch label={t("settings.promotionsOffers")} enabled={notifSettings.promotions} onChange={() => setNotifSettings(p => ({ ...p, promotions: !p.promotions }))} />
                                
                                {/* New Notification Sound Toggle */}
                                <div className="mt-6 pt-6 border-t border-border">
                                    <p className="text-[10px] font-black text-text-hint uppercase tracking-widest mb-3">Sound Settings</p>
                                    <ToggleSwitch 
                                        label="Notification Sound" 
                                        enabled={isSoundEnabled} 
                                        onChange={() => setSoundEnabled(!isSoundEnabled)} 
                                    />
                                    <ToggleSwitch 
                                        label="Button & Tab Sound" 
                                        enabled={isUISoundEnabled} 
                                        onChange={() => setUISoundEnabled(!isUISoundEnabled)} 
                                    />
                                    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
                                        <span className="text-sm font-semibold text-text-secondary">Notification Tone</span>
                                        <select 
                                            value={selectedTone}
                                            onChange={(e) => setSelectedTone(e.target.value)}
                                            className="bg-secondary text-foreground text-xs font-bold px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 border-none appearance-none cursor-pointer"
                                        >
                                            {availableTones.map(tone => (
                                                <option key={tone} value={tone}>{tone.charAt(0).toUpperCase() + tone.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button 
                                        onClick={() => playNotificationSound()}
                                        className="mt-4 text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:opacity-80 transition-opacity"
                                    >
                                        <Zap size={14} />
                                        Test Sound
                                    </button>
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="text-[10px] font-black text-text-hint uppercase tracking-widest mb-3">{t("settings.channels")}</p>
                                <ToggleSwitch label={t("settings.emailNotifications")} enabled={notifSettings.emailNotifs} onChange={() => setNotifSettings(p => ({ ...p, emailNotifs: !p.emailNotifs }))} />
                                <ToggleSwitch label={t("settings.smsNotifications")} enabled={notifSettings.smsNotifs} onChange={() => setNotifSettings(p => ({ ...p, smsNotifs: !p.smsNotifs }))} />
                                <ToggleSwitch label={t("settings.pushNotifications")} enabled={notifSettings.pushNotifs} onChange={() => setNotifSettings(p => ({ ...p, pushNotifs: !p.pushNotifs }))} />
                            </div>

                            <button
                                onClick={() => handleSave("Notification preferences")}
                                disabled={saving}
                                className="btn-primary w-full py-4 mt-2"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                {saving ? t("settings.saving") : t("settings.savePreferences")}
                            </button>
                        </motion.div>
                    )}

                    {activeSection === "privacy" && (
                        <motion.div
                            key="privacy"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-card rounded-[28px] border border-border p-6 mb-6 shadow-sm overflow-hidden"
                        >
                            <h3 className={`${unbounded.className} text-base font-bold text-foreground mb-2`}>{t("settings.privacySecurity")}</h3>
                            <p className="text-xs text-text-hint font-medium mb-6">{t("settings.controlPrivacy")}</p>

                            <ToggleSwitch label={t("settings.profileVisibleToProviders")} enabled={privacySettings.profileVisible} onChange={() => setPrivacySettings(p => ({ ...p, profileVisible: !p.profileVisible }))} />
                            <ToggleSwitch label={t("settings.shareLocationWithProviders")} enabled={privacySettings.showLocation} onChange={() => setPrivacySettings(p => ({ ...p, showLocation: !p.showLocation }))} />
                            <ToggleSwitch label={t("settings.shareActivityForAnalytics")} enabled={privacySettings.shareActivity} onChange={() => setPrivacySettings(p => ({ ...p, shareActivity: !p.shareActivity }))} />
                            <ToggleSwitch label={t("settings.twoFactorAuthentication")} enabled={privacySettings.twoFactorAuth} onChange={() => setPrivacySettings(p => ({ ...p, twoFactorAuth: !p.twoFactorAuth }))} />

                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl">
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-blue-900 dark:text-blue-400">{t("settings.yourDataIsSecure")}</p>
                                        <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">{t("settings.encryptionDesc")} <Link href="/privacy" className="underline font-bold">{t("settings.privacyPolicy")}</Link>.</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleSave("Privacy settings")}
                                disabled={saving}
                                className="btn-primary w-full py-4 mt-6"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                {saving ? t("settings.saving") : t("settings.saveSettings")}
                            </button>
                        </motion.div>
                    )}

                    {activeSection === "language" && (
                        <motion.div
                            key="language"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-card rounded-[28px] border border-border p-6 mb-6 shadow-sm overflow-hidden"
                        >
                            <h3 className={`${unbounded.className} text-base font-bold text-foreground mb-6`}>{t("settings.languageDisplay")}</h3>

                            <div className="mb-8">
                                <label className="block text-[10px] font-black text-text-hint uppercase tracking-widest mb-4">{t("settings.chooseLanguage")}</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { code: "en" as const, label: t("settings.english"), flag: "🇬🇧" },
                                        { code: "ur" as const, label: t("settings.urdu"), flag: "🇵🇰" },
                                    ].map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => setGlobalLang(lang.code)}
                                            className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${globalLang === lang.code
                                                ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5"
                                                : "border-border dark:border-white/5 hover:border-primary/30 text-text-hint"
                                                }`}
                                        >
                                            <span className="text-3xl grayscale-[0.3] hover:grayscale-0 transition-all">{lang.flag}</span>
                                            <span className="text-sm font-black uppercase tracking-tight">{lang.label}</span>
                                            {globalLang === lang.code && <Check className="w-4 h-4 text-primary" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => handleSave("Language settings")}
                                disabled={saving}
                                className="btn-primary w-full py-5"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                {saving ? t("settings.updating") : t("settings.persistPreferences")}
                            </button>
                        </motion.div>
                    )}

                    {activeSection === "theme" && (
                        <motion.div
                            key="theme"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-card rounded-[28px] border border-border p-6 mb-6 shadow-sm overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                        <Moon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className={`${unbounded.className} text-lg font-bold text-foreground`}>{t("settings.themeSettings") || "Theme Settings"}</h2>
                                        <p className="text-xs text-text-hint font-medium">{t("settings.selectTheme") || "Select and apply your preferred theme"}</p>
                                    </div>
                                </div>
                                <button onClick={() => setActiveSection(null)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                                    <X className="w-5 h-5 text-text-hint" />
                                </button>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {(Object.entries(themes) as [ThemeType, typeof themes.blue][]).map(([id, themeData]) => (
                                    <motion.button
                                        key={id}
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setTheme(id)}
                                        className={`relative flex flex-col rounded-[32px] border-2 transition-all overflow-hidden ${theme === id
                                            ? "border-primary shadow-2xl shadow-primary/20 ring-4 ring-primary/10"
                                            : "border-border hover:border-primary/40 shadow-sm"
                                            }`}
                                    >
                                        {/* Live Preview - Larger and more detailed */}
                                        <div className="p-4 pb-2" style={{ backgroundColor: themeData.background }}>
                                            <div className="rounded-2xl overflow-hidden border-2 shadow-inner" style={{ borderColor: id === 'black' ? '#262626' : '#E5E7EB' }}>
                                                {/* Mini header */}
                                                <div className="h-8 flex items-center gap-2 px-3" style={{ backgroundColor: themeData.card, borderBottom: `1px solid ${id === 'black' ? '#262626' : '#E5E7EB'}` }}>
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#EF4444" }} />
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#F59E0B" }} />
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#10B981" }} />
                                                    <div className="flex-1" />
                                                    <div className="w-16 h-1.5 rounded-full" style={{ backgroundColor: id === 'black' ? '#262626' : '#E5E7EB' }} />
                                                </div>
                                                {/* Mini body */}
                                                <div className="p-4 space-y-2.5" style={{ backgroundColor: themeData.background }}>
                                                    <div className="flex gap-3">
                                                        <div className="w-10 h-10 rounded-xl shadow-sm" style={{ backgroundColor: themeData.primary, opacity: 0.2 }} />
                                                        <div className="flex-1 space-y-2">
                                                            <div className="h-2 rounded-full w-3/4" style={{ backgroundColor: themeData.text, opacity: 0.8 }} />
                                                            <div className="h-1.5 rounded-full w-1/2" style={{ backgroundColor: themeData.text, opacity: 0.4 }} />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="h-6 rounded-lg flex-1 shadow-sm" style={{ backgroundColor: themeData.primary }} />
                                                        <div className="h-6 rounded-lg w-10 border shadow-sm" style={{ borderColor: id === 'black' ? '#262626' : '#E5E7EB', backgroundColor: themeData.card }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="px-5 py-4.5 flex items-center gap-4 bg-card">
                                            <div className="w-10 h-10 rounded-xl shadow-sm flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: themeData.primary }}>
                                                {theme === id ? <Check size={18} strokeWidth={3} style={{ color: id === 'black' ? '#000' : '#FFF' }} /> : <div className="w-4 h-4 rounded-full border-2 border-white/20" style={{ backgroundColor: id === 'blue' ? '#3B82F6' : id === 'gray' ? '#6366F1' : '#D4AF37' }} />}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-black uppercase tracking-[0.1em] text-foreground">{t(`settings.${id}Theme`) || id}</p>
                                                <p className="text-[10px] text-text-hint font-bold opacity-70 leading-tight">{t(`settings.${id}ThemeDesc`) || `Apply ${id} theme`}</p>
                                            </div>
                                        </div>

                                        {theme === id && (
                                            <motion.div
                                                layoutId="theme-active-indicator"
                                                className="absolute top-4 right-4 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/20"
                                            >
                                                <Check size={14} strokeWidth={4} />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>                      </div>

                            <button
                                onClick={() => handleSave("Theme settings")}
                                disabled={saving}
                                className="btn-primary w-full py-5"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                {saving ? (t("settings.saving") || "Saving...") : (t("settings.saveThemePreferences") || "Save Theme Preferences")}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom Links */}
                {/* Bottom Utility Sections */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-card rounded-[32px] border-2 border-border overflow-hidden shadow-xl shadow-black/[0.02] mt-8"
                >
                    {bottomItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="flex items-center gap-6 px-8 py-6 hover:bg-primary/[0.03] transition-all group border-b-2 border-border last:border-0"
                        >
                            <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm`}>
                                <item.icon size={20} strokeWidth={2.5} />
                            </div>
                            <div className="flex-1">
                                <p className="text-base font-black text-foreground tracking-tight">{item.label}</p>
                                <p className="text-[11px] text-text-hint font-bold uppercase tracking-widest mt-0.5 opacity-60">Help Center & Support</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                <ChevronRight size={18} strokeWidth={3} />
                            </div>
                        </Link>
                    ))}
                    
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-6 px-8 py-7 text-left hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-all group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-sm">
                            <LogOut size={20} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                            <p className="text-base font-black text-red-600 tracking-tight">{t("settings.signOut")}</p>
                            <p className="text-[10px] text-red-400 font-black uppercase tracking-[0.2em] mt-0.5">{t("settings.secureLogout")}</p>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            End Session
                        </div>
                    </button>
                </motion.div>

                {/* Connect Section */}
                <div className="mt-12 pt-12 border-t border-border">
                    <ConnectSection />
                </div>

                <p className="text-center text-[10px] text-text-hint font-black uppercase tracking-widest mt-12 pb-8">{t("footer.madeInPakistan")}</p>
            </div >
        </div >
    );
}
