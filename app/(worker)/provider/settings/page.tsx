"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Camera, Lock, Globe, Bell, Shield, ShieldAlert, Headphones,
    LogOut, ChevronRight, Moon, Sun, Eye, EyeOff,
    Check, AlertCircle, CheckCircle2, Loader2,
    Smartphone, Mail, MapPin, Briefcase, Calendar, Zap
} from "lucide-react";
import { unbounded } from "@/app/fonts";
import { useUser } from "@/contexts/UserContext";
import { useUI } from "@/contexts/UIContext";
import { useTranslation } from "@/hooks/useTranslation";
import BrandText from "@/components/BrandText";
import { useRouter } from "next/navigation";
import { useSound } from "@/contexts/SoundContext";
import Image from "next/image";
import Link from "next/link";
import ConnectSection from "@/components/ConnectSection";
import { themes, ThemeType } from "@/constants/themes";

type SettingsSection = "profile" | "password" | "notifications" | "privacy" | "availability" | "theme" | "language" | null;

export default function WorkerSettingsPage() {
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
    const [showSuccess, setShowSuccess] = useState("");
    const [saving, setSaving] = useState(false);

    // Availability settings
    const [availability, setAvailability] = useState({
        isOnline: true,
        autoAccept: false,
        workingHours: {
            start: "09:00",
            end: "18:00"
        },
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"]
    });

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user?.id) return;
            try {
                // Fetch Provider Profile
                const resProfile = await fetch('/api/provider/profile');
                const dataProfile = await resProfile.json();
                if (dataProfile.success && dataProfile.data) {
                    setAvailability(prev => ({ ...prev, isOnline: !!dataProfile.data.isAvailable }));
                }

                // Fetch User Settings
                const resSettings = await fetch('/api/user/settings');
                const dataSettings = await resSettings.json();
                if (dataSettings.success) {
                    if (dataSettings.providerSettings?.notifications) setNotifSettings(dataSettings.providerSettings.notifications);
                    if (dataSettings.providerSettings?.availability) setAvailability(prev => ({ ...prev, ...dataSettings.providerSettings.availability }));
                    if (dataSettings.settings?.language) setGlobalLang(dataSettings.settings.language);
                }
            } catch (error) {
                console.error("Failed to load settings", error);
            }
        };
        fetchSettings();
    }, [user?.id]);

    // Profile form
    const [profileForm, setProfileForm] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        phone: user?.phone || "+92",
        specialization: "Plumbing & Electrical",
    });

    // Notification settings
    const [notifSettings, setNotifSettings] = useState({
        newJobAlerts: true,
        jobUpdates: true,
        paymentAlerts: true,
        customerMessages: true,
        pushNotifs: true,
    });

    // Password form
    const [passwordForm, setPasswordForm] = useState({
        current: "",
        newPassword: "",
        confirm: "",
    });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

    const handleSave = async (section: string) => {
        setSaving(true);
        try {
            if (section === "Profile" && user?.id) {
                const res = await fetch('/api/user/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: `${profileForm.firstName} ${profileForm.lastName}`,
                        phone: profileForm.phone,
                    })
                });
                const resJson = await res.json();
                if (!resJson.success) throw new Error(resJson.error || "Update failed");
            } else if (section === "Availability settings" && user?.id) {
                const res = await fetch('/api/provider/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        isAvailable: availability.isOnline
                    })
                });
                const resJson = await res.json();
                if (!resJson.success) throw new Error(resJson.error || "Update failed");

                // Save working hours to settings table
                const resSettings = await fetch('/api/user/settings', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'PROVIDER', settings: { availability } })
                });
                const resSettingsJson = await resSettings.json();
                if (!resSettingsJson.success) throw new Error(resSettingsJson.error || "Failed to update availability settings");
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
                const payload: any = {};
                if (section.includes("Notification")) payload.notifications = notifSettings;
                if (section.includes("Theme")) payload.theme = theme;
                if (section.includes("Language")) payload.language = globalLang;

                if (Object.keys(payload).length > 0) {
                    const res = await fetch('/api/user/settings', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'PROVIDER', settings: payload })
                    });
                    const resJson = await res.json();
                    if (!resJson.success) throw new Error(resJson.error || "Failed to save preferences");
                }
            }
            showToast(`${section} ${t("common.success").toLowerCase()}!`, "success");
        } catch (err: any) {
            showToast(`Failed to save: ${err.message}`, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const isVerified = user?.idVerificationStatus === "VERIFIED";

    const ToggleSwitch = ({ enabled, onChange, label, disabled = false }: { enabled: boolean; onChange: () => void; label: string; disabled?: boolean }) => (
        <div className={`flex items-center justify-between py-4 border-b border-gray-50 last:border-0 ${disabled ? "opacity-50 grayscale select-none" : ""}`}>
            <div className="flex-1">
                <span className="text-sm font-semibold text-foreground">{label}</span>
                {disabled && (
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-tighter mt-0.5">Verification Required</p>
                )}
            </div>
            <button
                onClick={disabled ? undefined : onChange}
                disabled={disabled}
                className={`relative w-12 h-7 rounded-full transition-all duration-300 ${enabled && !disabled ? "bg-primary" : "bg-gray-200"}`}
            >
                <motion.div
                    className="absolute top-1 w-5 h-5 bg-card rounded-full shadow-md"
                    animate={{ left: enabled ? (isRTL ? 4 : 24) : (isRTL ? 24 : 4) }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </button>
        </div>
    );

    const settingsItems = [
        { id: "profile" as SettingsSection, icon: User, label: t("settings.editProfile"), desc: t("settings.updateProfessionalDetails"), color: "bg-blue-50 text-blue-600" },
        { id: "availability" as SettingsSection, icon: Calendar, label: "Availability Settings", desc: "Manage your working hours & online status", color: "bg-emerald-50 text-emerald-600" },
        { id: "password" as SettingsSection, icon: Lock, label: t("settings.changePassword"), desc: t("settings.updatePassword"), color: "bg-violet-50 text-violet-600" },
        { id: "notifications" as SettingsSection, icon: Bell, label: t("settings.jobNotifications"), desc: t("settings.manageJobNotifications"), color: "bg-amber-50 text-amber-600" },
        { id: "theme" as SettingsSection, icon: Moon, label: t("settings.themeSettings") || "Theme Settings", desc: t("settings.selectTheme") || "Change the look of your dashboard", color: "bg-indigo-50 text-indigo-600" },
        { id: "language" as SettingsSection, icon: Globe, label: t("settings.language") || "Language", desc: t("settings.selectLanguage") || "Choose your preferred language", color: "bg-sky-50 text-sky-600" },
        { id: "privacy" as SettingsSection, icon: Shield, label: t("settings.privacySecurity"), desc: t("settings.controlDataSettings"), color: "bg-green-50 text-green-600" },
    ];

    return (
        <div className="flex-1 bg-muted/50 min-h-screen">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className={`${unbounded.className} text-2xl font-black text-foreground`}>{t("settings.settings")}</h1>
                    <p className="text-sm text-text-secondary font-medium mt-1">{t("settings.manageWorkerAccount")}</p>
                </motion.div>

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-card rounded-[28px] border border-border p-6 mb-6 flex items-center gap-5 shadow-sm"
                >
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                            {user?.avatar ? (
                                <Image src={user.avatar} alt="Profile" fill className="object-cover" />
                            ) : (
                                <User className="w-8 h-8 text-primary" />
                            )}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className={`${unbounded.className} text-lg font-black text-foreground truncate`}>
                            {user?.firstName} {user?.lastName}
                        </h2>
                        <p className="text-sm text-text-secondary font-medium truncate">{user?.email}</p>
                        <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 text-[10px] font-black uppercase tracking-tight rounded-xl ${
                            isVerified ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                        }`}>
                            {isVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                            {isVerified ? t("settings.verifiedProfessional") : "Unverified Identity"}
                        </span>
                    </div>
                </motion.div>

                {/* Settings Items */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card rounded-[28px] border border-border overflow-hidden shadow-sm mb-6"
                >
                    {settingsItems.map((item, i) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(activeSection === item.id ? null : item.id)}
                            className={`w-full flex items-center gap-4 px-6 py-5 hover:bg-muted/80 transition-all group ${i < settingsItems.length - 1 ? "border-b border-gray-50" : ""
                                } ${activeSection === item.id ? "bg-muted/80" : ""}`}
                        >
                            <div className={`w-11 h-11 rounded-2xl ${item.color} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground">{item.label}</p>
                                <p className="text-xs text-text-hint font-medium mt-0.5">{item.desc}</p>
                            </div>
                            <ChevronRight className={`w-5 h-5 text-text-disabled group-hover:text-primary transition-all ${activeSection === item.id ? "rotate-90 text-primary" : ""}`} />
                        </button>
                    ))}
                </motion.div>

                {/* Expanded Panels */}
                <AnimatePresence mode="wait">
                    {activeSection === "profile" && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-card rounded-[28px] border border-border p-6 mb-6 shadow-sm overflow-hidden"
                        >
                            <h3 className={`${unbounded.className} text-base font-bold text-foreground mb-6`}>{t("settings.editProfile")}</h3>
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">{t("settings.firstName")}</label>
                                        <input
                                            type="text" value={profileForm.firstName}
                                            onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                                            className="w-full px-4 py-3.5 bg-muted border border-border rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">{t("settings.lastName")}</label>
                                        <input
                                            type="text" value={profileForm.lastName}
                                            onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                                            className="w-full px-4 py-3.5 bg-muted border border-border rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">{t("settings.specialization")}</label>
                                    <input
                                        type="text" value={profileForm.specialization}
                                        onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                                        className="w-full px-4 py-3.5 bg-muted border border-border rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => handleSave("Profile")}
                                    disabled={saving}
                                    className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                    {saving ? t("settings.saving") : t("settings.saveChanges")}
                                </button>
                            </div>
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
                                    className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-primary/20"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                                    {saving ? t("settings.updating") : t("settings.updatePasswordBtn")}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeSection === "availability" && (
                        <motion.div
                            key="availability"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-card rounded-[28px] border border-border p-6 mb-6 shadow-sm overflow-hidden"
                        >
                            <h3 className={`${unbounded.className} text-base font-bold text-foreground mb-6`}>Work Availability</h3>
                            <div className="space-y-4">
                                <ToggleSwitch
                                    label="Online Status"
                                    enabled={availability.isOnline}
                                    onChange={() => setAvailability(p => ({ ...p, isOnline: !p.isOnline }))}
                                    disabled={!isVerified}
                                />
                                <div className="p-4 bg-muted/50 rounded-2xl mb-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                                            <Zap className="w-4 h-4" />
                                        </div>
                                        <p className="text-xs font-bold text-foreground">Auto-Accept Direct Requests</p>
                                    </div>
                                    <ToggleSwitch
                                        label="Enable Auto-Accept"
                                        enabled={availability.autoAccept}
                                        onChange={() => setAvailability(p => ({ ...p, autoAccept: !p.autoAccept }))}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs font-black text-text-hint uppercase tracking-widest">Working Days</p>
                                    <div className="flex flex-wrap gap-2">
                                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                                            const isActive = availability.days.includes(day);
                                            return (
                                                <button
                                                    key={day}
                                                    onClick={() => {
                                                        const nextDays = isActive
                                                            ? availability.days.filter(d => d !== day)
                                                            : [...availability.days, day];
                                                        setAvailability(p => ({ ...p, days: nextDays }));
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border ${isActive
                                                        ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                                        : "bg-muted border-border text-text-hint hover:border-primary/30"
                                                        }`}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs font-black text-text-hint uppercase tracking-widest">Default Working Hours</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Start Time</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-hint" />
                                                <input
                                                    type="time"
                                                    value={availability.workingHours.start}
                                                    onChange={(e) => setAvailability(p => ({ ...p, workingHours: { ...p.workingHours, start: e.target.value } }))}
                                                    className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">End Time</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-hint" />
                                                <input
                                                    type="time"
                                                    value={availability.workingHours.end}
                                                    onChange={(e) => setAvailability(p => ({ ...p, workingHours: { ...p.workingHours, end: e.target.value } }))}
                                                    className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleSave("Availability settings")}
                                    disabled={saving}
                                    className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-emerald-100"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                    {saving ? t("settings.saving") : "Update Availability"}
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
                            <h3 className={`${unbounded.className} text-base font-bold text-foreground mb-6`}>{t("settings.jobNotifications")}</h3>
                            <ToggleSwitch label={t("settings.newJobAlerts")} enabled={notifSettings.newJobAlerts} onChange={() => setNotifSettings(p => ({ ...p, newJobAlerts: !p.newJobAlerts }))} />
                            <ToggleSwitch label={t("settings.jobStatusUpdates")} enabled={notifSettings.jobUpdates} onChange={() => setNotifSettings(p => ({ ...p, jobUpdates: !p.jobUpdates }))} />
                            <ToggleSwitch label={t("settings.paymentAlerts")} enabled={notifSettings.paymentAlerts} onChange={() => setNotifSettings(p => ({ ...p, paymentAlerts: !p.paymentAlerts }))} />
                            <ToggleSwitch label={t("settings.customerMessages")} enabled={notifSettings.customerMessages} onChange={() => setNotifSettings(p => ({ ...p, customerMessages: !p.customerMessages }))} />
                            <ToggleSwitch label={t("settings.pushNotifications")} enabled={notifSettings.pushNotifs} onChange={() => setNotifSettings(p => ({ ...p, pushNotifs: !p.pushNotifs }))} />
                            
                            {/* New Notification Sound Toggle */}
                            <div className="mt-6 pt-6 border-t border-gray-50">
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
                                <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                                    <span className="text-sm font-semibold text-text-secondary">Notification Tone</span>
                                    <select 
                                        value={selectedTone}
                                        onChange={(e) => setSelectedTone(e.target.value)}
                                        className="bg-muted text-foreground text-xs font-bold px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 border-none appearance-none cursor-pointer"
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
                                    Test Notification Sound
                                </button>
                            </div>
                            <button
                                onClick={() => handleSave("Notification preferences")}
                                disabled={saving}
                                className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                {saving ? t("settings.saving") : t("settings.savePreferences")}
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
                            <h3 className={`${unbounded.className} text-base font-bold text-foreground mb-2`}>{t("settings.themeSettings") || "Theme Settings"}</h3>
                            <p className="text-xs text-text-hint font-medium mb-6">{t("settings.selectTheme") || "Select and apply your preferred theme"}</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                                {(Object.entries(themes) as [ThemeType, typeof themes.blue][]).map(([id, themeData]) => (
                                    <motion.button
                                        key={id}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setTheme(id)}
                                        className={`relative flex flex-col rounded-[22px] border-2 transition-all overflow-hidden ${theme === id
                                            ? "border-primary shadow-xl shadow-primary/10 ring-4 ring-primary/5"
                                            : "border-border hover:border-primary/30"
                                            }`}
                                    >
                                        {/* Live Preview */}
                                        <div className="p-3 pb-2" style={{ backgroundColor: themeData.background }}>
                                            <div className="rounded-xl overflow-hidden border" style={{ borderColor: id === 'black' ? '#262626' : '#E5E7EB' }}>
                                                <div className="h-6 flex items-center gap-1.5 px-2.5" style={{ backgroundColor: themeData.card, borderBottom: `1px solid ${id === 'black' ? '#262626' : '#E5E7EB'}` }}>
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#EF4444" }} />
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#F59E0B" }} />
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#10B981" }} />
                                                    <div className="flex-1" />
                                                    <div className="w-12 h-1 rounded-full" style={{ backgroundColor: id === 'black' ? '#262626' : '#E5E7EB' }} />
                                                </div>
                                                <div className="p-2.5 space-y-1.5" style={{ backgroundColor: themeData.background }}>
                                                    <div className="flex gap-2">
                                                        <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: themeData.primary, opacity: 0.15 }} />
                                                        <div className="flex-1 space-y-1">
                                                            <div className="h-1.5 rounded-full w-3/4" style={{ backgroundColor: themeData.text, opacity: 0.7 }} />
                                                            <div className="h-1 rounded-full w-1/2" style={{ backgroundColor: themeData.text, opacity: 0.3 }} />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1.5">
                                                        <div className="h-4 rounded-md flex-1" style={{ backgroundColor: themeData.primary }} />
                                                        <div className="h-4 rounded-md w-8" style={{ backgroundColor: id === 'black' ? '#262626' : '#E5E7EB' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Label */}
                                        <div className="px-4 py-3.5 flex items-center gap-3 bg-card">
                                            <div className="w-8 h-8 rounded-xl shadow-sm flex items-center justify-center" style={{ backgroundColor: themeData.primary }}>
                                                {theme === id ? <Check className="w-4 h-4" style={{ color: id === 'black' ? '#000' : '#FFF' }} /> : <div className="w-3 h-3 rounded-full" style={{ backgroundColor: id === 'blue' ? '#3B82F6' : id === 'gray' ? '#6366F1' : '#D4AF37' }} />}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-black uppercase tracking-widest text-foreground">{t(`settings.${id}Theme`) || id}</p>
                                                <p className="text-[10px] text-text-hint font-bold">{t(`settings.${id}ThemeDesc`) || `Apply ${id} theme`}</p>
                                            </div>
                                        </div>

                                        {theme === id && (
                                            <motion.div
                                                layoutId="theme-active-provider"
                                                className="absolute top-2.5 right-2.5 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
                                            >
                                                <Check className="w-3.5 h-3.5 text-primary-foreground" />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>

                            <button
                                onClick={() => handleSave("Theme settings")}
                                disabled={saving}
                                className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                {saving ? (t("settings.saving") || "Saving...") : (t("settings.saveThemePreferences") || "Save Theme Preferences")}
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
                            <h3 className={`${unbounded.className} text-base font-bold text-foreground mb-2`}>{t("settings.language") || "Language Settings"}</h3>
                            <p className="text-xs text-text-hint font-medium mb-6">{t("settings.selectLanguage") || "Select your preferred language"}</p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {[
                                    { id: "en", name: "English", native: "English", icon: "🇺🇸" },
                                    { id: "ur", name: "Urdu", native: "اردو", icon: "🇵🇰" }
                                ].map((lang) => (
                                    <button
                                        key={lang.id}
                                        onClick={() => setGlobalLang(lang.id as any)}
                                        className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                                            globalLang === lang.id 
                                            ? "border-primary bg-primary/5 text-primary" 
                                            : "border-border hover:border-primary/20 text-text-secondary"
                                        }`}
                                    >
                                        <span className="text-2xl">{lang.icon}</span>
                                        <div className="text-center">
                                            <p className="text-sm font-bold">{lang.native}</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{lang.name}</p>
                                        </div>
                                        {globalLang === lang.id && (
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            
                            <button
                                onClick={() => handleSave("Language preferences")}
                                disabled={saving}
                                className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                {saving ? t("settings.saving") : t("settings.savePreferences")}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-card rounded-[28px] border border-border overflow-hidden shadow-sm"
                >
                    <Link href="/support" className="flex items-center gap-4 px-6 py-5 hover:bg-muted/80 transition-all group border-b border-gray-50">
                        <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                            <Headphones className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-foreground">{t("settings.helpSupport")}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-text-disabled group-hover:text-primary" />
                    </Link>
                    <button 
                        onClick={async () => {
                            const nextPerspective = activePerspective === 'consumer' ? 'provider' : 'consumer';
                            await switchPerspective(nextPerspective);
                            router.push(nextPerspective === 'provider' ? '/provider' : '/dashboard');
                            showToast(`${t("header.switchTo")} ${nextPerspective === 'provider' ? t("header.proMode") : t("header.userMode")} ${t("common.success")}`, "success");
                        }}
                        className="w-full flex items-center gap-4 px-6 py-5 hover:bg-primary/5 transition-all group border-b border-gray-50"
                    >
                        <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></svg>
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-bold text-foreground">{t("header.switchTo")} {activePerspective === 'consumer' ? t("header.proMode") : t("header.userMode")}</p>
                            <p className="text-[10px] text-text-hint font-bold uppercase tracking-widest">Toggle Account Perspective</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-text-disabled group-hover:text-primary" />
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-5 hover:bg-red-50/50 transition-all group">
                        <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                            <LogOut className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-bold text-red-600">{t("settings.signOut")}</p>
                    </button>
                </motion.div>

                {/* Connect Section */}
                <div className="mt-12 pt-12 border-t border-border">
                    <ConnectSection />
                </div>

                <p className="text-center text-xs text-text-disabled font-medium mt-8"><BrandText text={t("footer.madeInPakistan")} /></p>
            </div>
        </div>
    );
}
