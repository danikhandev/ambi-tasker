"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Settings, Globe, Shield, Bell, CreditCard, Layout, 
    Save, Loader2, Plus, Trash2, Edit3, CheckCircle2, 
    XCircle, Info, ExternalLink, Facebook, Instagram, 
    Twitter, Linkedin, Youtube, Globe2
} from "lucide-react";
import { unbounded } from "@/app/fonts";
import { useUI } from "@/contexts/UIContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useAdmin } from "@/contexts/AdminContext";
import { useSound } from "@/contexts/SoundContext";

const PLATFORMS = [
    { id: "facebook", icon: Facebook, color: "text-[#1877F2]" },
    { id: "instagram", icon: Instagram, color: "text-[#E4405F]" },
    { id: "twitter", icon: Twitter, color: "text-foreground" },
    { id: "linkedin", icon: Linkedin, color: "text-[#0A66C2]" },
    { id: "youtube", icon: Youtube, color: "text-[#FF0000]" },
    { id: "website", icon: Globe2, color: "text-primary" }
];

type TabType = "general" | "branding" | "payment" | "social" | "notifications" | "security";

export default function AdminSettingsPage() {
    const { showToast, setLanguage } = useUI();
    const { theme, switchTheme } = useAdmin();
    const { 
        isSoundEnabled, setSoundEnabled, 
        isUISoundEnabled, setUISoundEnabled,
        playNotificationSound, playClickSound 
    } = useSound();
    const { t, language } = useTranslation();
    const { setPageTitle } = useUI();
    const [activeTab, setActiveTab] = useState<TabType>("general");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    useEffect(() => {
        setPageTitle(t("admin.adminSettingsLabel") || "Admin Settings", "");
    }, [setPageTitle, t]);

    const [settings, setSettings] = useState<any>({
        appName: "AmbiTasker",
        logoUrl: "",
        faviconUrl: "",
        platformFeePercentage: 10,
        currency: "PKR",
        timezone: "UTC+5",
        paymentGateway: "PayFast",
        isPaymentEnabled: true,
        supportEmail: "",
        supportPhone: "",
        emailNotificationsEnabled: true,
        pushNotificationsEnabled: true,
        twoFactorAuthEnabled: false,
        loginAlertsEnabled: false,
        socialLinks: [],
        footerCopyrightText: "© 2026 AmbiTasker. Empowering local professionals across Pakistan 🇵🇰",
        trustedUsersCount: 1000,
        trustedBadgeText: "Trusted by {count} happy customers"
    });

    const [socialForm, setSocialForm] = useState({ platform: "facebook", url: "", isActive: true });
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingChanges, setPendingChanges] = useState<string[]>([]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/admin/settings");
                const data = await res.json();
                if (data.success && data.data) {
                    setSettings(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
                showToast("Failed to load settings", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [showToast]);

    const handleUpdateField = (field: string, value: any) => {
        setSettings((prev: any) => ({ ...prev, [field]: value }));
    };

    const detectChanges = () => {
        // This is a simplified check for critical fields
        const criticalFields = ["platformFeePercentage", "currency", "paymentGateway", "isPaymentEnabled"];
        // In a real app, we'd compare against initialSettings state
        // For now, we'll just show the modal if any critical tab is being saved
        if (activeTab === "payment" || activeTab === "general") {
            setShowConfirm(true);
        } else {
            handleSave();
        }
    };

    const handleSave = async () => {
        setShowConfirm(false);
        setSaving(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });
            const data = await res.json();
            if (data.success) {
                showToast("Platform configuration synchronized", "success");
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            showToast(error.message || "Failed to save settings", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleAddSocial = () => {
        if (!socialForm.url) return showToast("URL is required", "error");
        
        const newLinks = [...settings.socialLinks];
        if (editingIndex !== null) {
            newLinks[editingIndex] = socialForm;
            setEditingIndex(null);
        } else {
            newLinks.push(socialForm);
        }
        
        handleUpdateField("socialLinks", newLinks);
        setSocialForm({ platform: "facebook", url: "", isActive: true });
    };

    const removeSocial = (index: number) => {
        const newLinks = settings.socialLinks.filter((_: any, i: number) => i !== index);
        handleUpdateField("socialLinks", newLinks);
    };

    const TabButton = ({ id, icon: Icon, label }: { id: TabType, icon: any, label: string }) => (
        <button
            onClick={() => { playClickSound(); setActiveTab(id); }}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${
                activeTab === id 
                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                : "text-text-hint hover:bg-muted hover:text-foreground"
            }`}
        >
            <Icon size={18} className={activeTab === id ? "animate-pulse" : ""} />
            <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
        </button>
    );

    const SectionHeader = ({ title }: { title: string }) => (
        <div className="mb-10">
            <h2 className={`${unbounded.className} text-xl font-black text-foreground mb-2`}>{title}</h2>
        </div>
    );

    const InputGroup = ({ label, field, type = "text", placeholder = "" }: any) => {
        const isUrlField = field === "logoUrl" || field === "faviconUrl";
        const isValidUrl = !isUrlField || !settings[field] || settings[field].startsWith("http");

        return (
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-hint ml-1">
                    {label}
                    {isUrlField && !isValidUrl && <span className="text-rose-500 ml-2 normal-case font-bold">! Invalid URL</span>}
                </label>
                <input 
                    type={type}
                    value={settings[field] || ""}
                    onChange={(e) => handleUpdateField(field, type === "number" ? parseFloat(e.target.value) : e.target.value)}
                    placeholder={placeholder}
                    className={`w-full px-6 py-4 bg-background border rounded-2xl text-sm font-bold focus:outline-none transition-all shadow-sm ${
                        isUrlField && !isValidUrl ? "border-rose-500/50 focus:border-rose-500" : "border-border/50 focus:border-primary/30"
                    }`}
                />
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">Loading Admin Universe...</p>
            </div>
        );
    }

    return (
        <div className="pb-20 max-w-[1400px] mx-auto">
            <div className="flex justify-end mb-8">
                <button
                    onClick={detectChanges}
                    disabled={saving}
                    className="px-8 py-4 bg-gray-950 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-black/10 hover:bg-primary transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? "Syncing..." : "Apply Config"}
                </button>
            </div>
            
            {/* Production Level Confirmation Modal */}
            <AnimatePresence>
                {showConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowConfirm(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-card border border-border rounded-[32px] p-8 shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-6">
                                <Shield size={32} />
                            </div>
                            <h3 className={`${unbounded.className} text-xl font-black text-foreground mb-4`}>Critical Update</h3>
                            <p className="text-sm text-text-secondary leading-relaxed mb-8">
                                You are about to modify core platform parameters. These changes affect real-time calculations, payments, and system behavior. Are you sure you want to proceed?
                            </p>
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleSave}
                                    className="w-full py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                                >
                                    Confirm and Deploy
                                </button>
                                <button 
                                    onClick={() => setShowConfirm(false)}
                                    className="w-full py-4 bg-muted text-text-secondary text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-muted/80 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-6">
                {/* Sidebar Tabs */}
                <div className="lg:col-span-3 space-y-2">
                    <TabButton id="general" icon={Settings} label="General" />
                    <TabButton id="branding" icon={Layout} label="Branding" />
                    <TabButton id="payment" icon={CreditCard} label="Payments" />
                    <TabButton id="social" icon={Globe} label="Social Media" />
                    <TabButton id="notifications" icon={Bell} label="Notifications" />
                    <TabButton id="security" icon={Shield} label="Security" />
                    
                    <div className="mt-10 p-6 bg-primary/5 rounded-3xl border border-primary/10">
                        <div className="flex items-start gap-3">
                            <Info size={16} className="text-primary shrink-0 mt-0.5" />
                            <p className="text-[10px] font-medium text-primary/80 leading-relaxed">
                                Changes here affect the live production environment. Ensure all branding assets are high resolution.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-9 bg-card dark:bg-gray-900 border border-border dark:border-white/5 rounded-[48px] p-8 md:p-12 shadow-sm relative overflow-hidden group min-h-[600px]">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                    
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeTab === "general" && (
                                <div className="space-y-8">
                                    <SectionHeader title="Platform Settings" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputGroup label="App Name" field="appName" />
                                        <InputGroup label="Timezone" field="timezone" />
                                        <InputGroup label="Currency" field="currency" />
                                        <InputGroup label="Platform Fee (%)" field="platformFeePercentage" type="number" />
                                        <InputGroup label="Support Email" field="supportEmail" />
                                        <InputGroup label="Support Phone" field="supportPhone" />
                                    </div>

                                    <div className="pt-8 border-t border-border/50">
                                        <SectionHeader title="Appearance" />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-hint ml-1">System Language</label>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => setLanguage('en')}
                                                        className={`flex-1 py-4 rounded-2xl text-xs font-bold transition-all border ${language === 'en' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-background border-border/50 text-text-hint hover:border-primary/30'}`}
                                                    >
                                                        English (US)
                                                    </button>
                                                    <button 
                                                        onClick={() => setLanguage('ur')}
                                                        className={`flex-1 py-4 rounded-2xl text-xs font-bold transition-all border ${language === 'ur' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-background border-border/50 text-text-hint hover:border-primary/30'}`}
                                                    >
                                                        اردو (Urdu)
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-hint ml-1">Interface Theme</label>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => switchTheme('light')}
                                                        className={`flex-1 py-4 rounded-2xl text-xs font-bold transition-all border ${theme === 'light' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-background border-border/50 text-text-hint hover:border-amber-500/30'}`}
                                                    >
                                                        Light Mode
                                                    </button>
                                                    <button 
                                                        onClick={() => switchTheme('dark')}
                                                        className={`flex-1 py-4 rounded-2xl text-xs font-bold transition-all border ${theme === 'dark' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-background border-border/50 text-text-hint hover:border-indigo-600/30'}`}
                                                    >
                                                        Dark Mode
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "branding" && (
                                <div className="space-y-10">
                                    <SectionHeader title="Branding Assets" />
                                    <div className="space-y-6 mb-10">
                                        <InputGroup label="Footer Copyright Text" field="footerCopyrightText" placeholder="© 2026 AmbiTasker..." />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                            <InputGroup label="Logo URL" field="logoUrl" placeholder="https://..." />
                                            <div className="p-6 bg-muted/20 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center gap-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">Logo Preview</p>
                                                {settings.logoUrl ? (
                                                    <img src={settings.logoUrl} alt="Logo" className="h-12 object-contain" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-text-hint"><Layout size={24} /></div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <InputGroup label="Favicon URL" field="faviconUrl" placeholder="https://..." />
                                            <div className="p-6 bg-muted/20 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center gap-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">Favicon Preview</p>
                                                {settings.faviconUrl ? (
                                                    <img src={settings.faviconUrl} alt="Favicon" className="w-10 h-10 object-contain" />
                                                ) : (
                                                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-text-hint"><Layout size={20} /></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-10 border-t border-border/50">
                                        <SectionHeader title="Social Proof" />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-6">
                                                <InputGroup label="Base Trusted Count" field="trustedUsersCount" type="number" placeholder="1000" />
                                                <p className="text-[10px] text-text-hint">This value is added to the real-time user count for display.</p>
                                            </div>
                                            <div className="space-y-6">
                                                <InputGroup label="Badge Text Pattern" field="trustedBadgeText" placeholder="Trusted by {count} happy customers" />
                                                <p className="text-[10px] text-text-hint">Use {'{count}'} as a placeholder for the final number.</p>
                                            </div>
                                        </div>
                                        <div className="mt-8 p-6 bg-primary/5 rounded-3xl border border-primary/10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Live Preview</p>
                                            <p className="text-sm font-bold text-foreground">
                                                {settings.trustedBadgeText?.replace("{count}", settings.trustedUsersCount?.toLocaleString() || "0")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "payment" && (
                                <div className="space-y-8">
                                    <SectionHeader title="Payments" />
                                    <div className="bg-muted/10 border border-border p-8 rounded-3xl space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground">Payment Gateway</h4>
                                                <p className="text-xs text-text-hint mt-1">Currently active processing provider</p>
                                            </div>
                                            <div className="px-5 py-2.5 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                {settings.paymentGateway}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-6 border-t border-border/50">
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground">Transaction Status</h4>
                                                <p className="text-xs text-text-hint mt-1">Enable or disable live payments globally</p>
                                            </div>
                                            <button 
                                                onClick={() => handleUpdateField("isPaymentEnabled", !settings.isPaymentEnabled)}
                                                className={`relative w-14 h-8 rounded-full transition-all duration-300 ${settings.isPaymentEnabled ? "bg-emerald-500" : "bg-muted shadow-inner"}`}
                                            >
                                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${settings.isPaymentEnabled ? "left-[26px]" : "left-[4px]"}`} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 p-6 bg-blue-50/50 border border-blue-100 rounded-2xl">
                                        <ExternalLink size={16} className="text-blue-600" />
                                        <p className="text-[11px] font-bold text-blue-700">Manage API keys and webhooks directly in your PayFast Dashboard.</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === "social" && (
                                <div className="space-y-8">
                                    <SectionHeader title="Social Media" />
                                    
                                    <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl p-8 rounded-[32px] border border-border shadow-sm mb-10">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-hint ml-1">Platform</label>
                                                <select 
                                                    value={socialForm.platform}
                                                    onChange={(e) => setSocialForm({ ...socialForm, platform: e.target.value })}
                                                    className="w-full px-6 py-4 bg-background border border-border/50 rounded-2xl text-xs font-bold appearance-none cursor-pointer focus:outline-none"
                                                >
                                                    {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.id.charAt(0).toUpperCase() + p.id.slice(1)}</option>)}
                                                </select>
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-hint ml-1">Link URL</label>
                                                <div className="flex gap-4">
                                                    <input 
                                                        type="url"
                                                        placeholder="https://..."
                                                        value={socialForm.url}
                                                        onChange={(e) => setSocialForm({ ...socialForm, url: e.target.value })}
                                                        className="flex-1 px-6 py-4 bg-background border border-border/50 rounded-2xl text-xs font-bold focus:outline-none"
                                                    />
                                                    <button 
                                                        onClick={handleAddSocial}
                                                        className="px-6 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-all active:scale-95"
                                                    >
                                                        {editingIndex !== null ? <Save size={18} /> : <Plus size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {settings.socialLinks.map((link: any, index: number) => {
                                            const platform = PLATFORMS.find(p => p.id === link.platform);
                                            const Icon = platform?.icon || Globe;
                                            return (
                                                <div key={index} className="flex items-center justify-between p-5 bg-muted/10 border border-border rounded-2xl group">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center ${platform?.color}`}>
                                                            <Icon size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black uppercase tracking-widest text-foreground">{link.platform}</p>
                                                            <p className="text-[10px] text-text-hint truncate max-w-[120px]">{link.url}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => { setSocialForm(link); setEditingIndex(index); }}
                                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => removeSocial(index)}
                                                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {settings.socialLinks.length === 0 && (
                                            <div className="md:col-span-2 text-center py-20 bg-muted/5 border border-dashed border-border rounded-3xl">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">No connections established yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === "notifications" && (
                                <div className="space-y-8">
                                    <SectionHeader title="Notifications" />
                                    <div className="bg-muted/10 border border-border rounded-3xl overflow-hidden">
                                        {[
                                            { label: "Email Notifications", field: "emailNotificationsEnabled", desc: "Automated receipts, alerts, and system updates" },
                                            { label: "Push Notifications", field: "pushNotificationsEnabled", desc: "Real-time mobile alerts for bookings and chats" }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-8 border-b border-border/50 last:border-0 group">
                                                <div>
                                                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{item.label}</h4>
                                                    <p className="text-xs text-text-hint mt-1">{item.desc}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleUpdateField(item.field, !settings[item.field])}
                                                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${settings[item.field] ? "bg-primary" : "bg-muted shadow-inner"}`}
                                                >
                                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${settings[item.field] ? "left-[26px]" : "left-[4px]"}`} />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Local Sound Preferences for Admin */}
                                        <div className="bg-primary/5 p-8 mt-4 border-t border-primary/10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-6">Local Sound Preferences</p>
                                            
                                            <div className="flex items-center justify-between mb-6 group">
                                                <div>
                                                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Notification Alerts</h4>
                                                    <p className="text-xs text-text-hint mt-1">Play sound when new system alerts arrive</p>
                                                </div>
                                                <button 
                                                    onClick={() => { playClickSound(); setSoundEnabled(!isSoundEnabled); }}
                                                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${isSoundEnabled ? "bg-primary" : "bg-muted shadow-inner"}`}
                                                >
                                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${isSoundEnabled ? "left-[26px]" : "left-[4px]"}`} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between group">
                                                <div>
                                                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">UI Interaction Sounds</h4>
                                                    <p className="text-xs text-text-hint mt-1">Click feedback for buttons and navigation</p>
                                                </div>
                                                <button 
                                                    onClick={() => { setUISoundEnabled(!isUISoundEnabled); playClickSound(); }}
                                                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${isUISoundEnabled ? "bg-primary" : "bg-muted shadow-inner"}`}
                                                >
                                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${isUISoundEnabled ? "left-[26px]" : "left-[4px]"}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "security" && (
                                <div className="space-y-8">
                                    <SectionHeader title="Security" />
                                    <div className="bg-muted/10 border border-border rounded-3xl overflow-hidden">
                                        {[
                                            { label: "Universal 2FA", field: "twoFactorAuthEnabled", desc: "Enforce two-factor authentication for all administrative accounts" },
                                            { label: "Admin Login Alerts", field: "loginAlertsEnabled", desc: "Notify super-admins when a new login occurs from an unknown device" }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-8 border-b border-border/50 last:border-0 group">
                                                <div>
                                                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{item.label}</h4>
                                                    <p className="text-xs text-text-hint mt-1">{item.desc}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleUpdateField(item.field, !settings[item.field])}
                                                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${settings[item.field] ? "bg-gray-950" : "bg-muted shadow-inner"}`}
                                                >
                                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${settings[item.field] ? "left-[26px]" : "left-[4px]"}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
