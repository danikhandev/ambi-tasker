"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, Edit3, Save, Loader2, ArrowRight, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import CircularFrame from '../CircularFrame';
import { useTranslation } from '@/hooks/useTranslation';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { useUI } from '@/contexts/UIContext';
import { Camera, Trash2, X } from 'lucide-react';
import { validateImage } from '@/services/upload/validators';
import { uploadImage, deleteImage } from '@/services/supabase-storage';
import CameraCapture from '../CameraCapture';
import { unbounded } from '@/app/fonts';

import LocationSelector from '../LocationSelector';
import AddressManager from './AddressManager';

interface UserProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  bio?: string;
  rating?: number;
  reviews?: number;
  isUserSignUpForProvider?: boolean;
  districtId?: string;
  cityId?: string;
  areaId?: string;
  role?: string;
}

export default function UserProfileTab({ user, onSuccess, onError }: { user: UserProfile, onSuccess: (msg: string) => void, onError?: (msg: string) => void }) {
  const { t, isRTL } = useTranslation();
  const { switchPerspective, activePerspective, refetch } = useUser();
  const { showToast } = useUI();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    address: user.address || '',
    bio: user.bio || '',
    avatar: user.avatar || '',
    districtId: user.districtId || '',
    cityId: user.cityId || '',
    areaId: user.areaId || '',
  });

  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeData, setUpgradeData] = useState({
    professionalTitle: '',
    serviceDescription: ''
  });

  const handleAvatarCapture = async (image: string) => {
    try {
      setUploading(true);
      setShowCamera(false);
      const response = await fetch(image);
      const blob = await response.blob();
      const publicUrl = await uploadImage(blob);
      
      // Persist immediately for production-level experience
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: `${formData.firstName} ${formData.lastName}`,
          profileImage: publicUrl 
        }),
      });

      setFormData(prev => ({ ...prev, avatar: publicUrl }));
      await refetch(); // Update global user context
      showToast(t("settings.imageCaptured") || "Profile image updated successfully!", "success");
    } catch (err: any) {
      console.error("Upload error:", err);
      showToast(t("common.error") || "Failed to upload image", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setUploading(true);
      
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: `${formData.firstName} ${formData.lastName}`,
          profileImage: "" 
        }),
      });

      setFormData(prev => ({ ...prev, avatar: "" }));
      await refetch();
      showToast(t("settings.imageDeleted") || "Profile image removed", "success");
    } catch (err) {
      showToast(t("common.error"), "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      if (onError) onError(t("auth.firstLastNameRequired"));
      return;
    }

    if (formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/[\s-]/g, '');
      if (!/^((\+92)|(0))?3\d{9}$/.test(cleanPhone)) {
        if (onError) onError(t("auth.invalidPhone"));
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.phone,
          address: formData.address,
          profileImage: formData.avatar,
          districtId: formData.districtId,
          cityId: formData.cityId,
          areaId: formData.areaId,
          bio: formData.bio
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      await refetch();
      setIsEditing(false);
      onSuccess(t("common.success"));
    } catch (err: any) {
      console.error("Save error:", err);
      if (onError) onError(err.message || t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/user/become-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalTitle: upgradeData.professionalTitle,
          serviceDescription: upgradeData.serviceDescription,
          areaId: formData.areaId
        })
      });

      if (!response.ok) {
        throw new Error("Failed to upgrade account");
      }

      await refetch();
      setShowUpgradeModal(false);
      showToast(t("auth.becomeProviderSuccess") || "Welcome to the professional team!", "success");
      
      // Auto switch to provider perspective
      await switchPerspective('provider');
      router.push('/provider/dashboard');
    } catch (err: any) {
      showToast(err.message || "Failed to upgrade", "error");
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card p-8 rounded-2xl shadow-sm border border-border"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-6 items-center text-center sm:text-left w-full">
          <div className="relative group shrink-0">
            {formData.avatar ? (
              <CircularFrame
                src={formData.avatar}
                alt="Profile"
                size={96}
                className="border-4 border-[#d4af37]/20 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-[#d4af37]/20 shadow-xl overflow-hidden bg-white flex items-center justify-center text-primary">
                <User className="w-10 h-10" />
              </div>
            )}
            <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white shadow-sm z-10" title="Verified Customer">
              <span className="text-[10px] font-bold">✓</span>
            </div>
            <div className="absolute inset-0 rounded-full flex items-center justify-center z-20 overflow-hidden">
                <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all group/overlay" />
                <div className="relative flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all group/btn"
                  >
                    <Camera className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                  </button>
                  {formData.avatar && (
                    <button 
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="w-10 h-10 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-600 transition-all group/btn"
                    >
                      <Trash2 className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white z-30">
                <Loader2 className="w-6 h-6 animate-spin mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{t("common.loading")}</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-foreground leading-tight mb-2 truncate">{user.firstName} {user.lastName}</h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <span className="text-primary text-xs font-bold uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-xl">{t("common.verified")}</span>
              <div className="flex items-center gap-1 text-yellow-400">
                <span>★</span>
                <span className="text-foreground font-bold text-sm ml-1">{user.rating || "5.0"}</span>
                <span className="text-text-hint text-xs ml-1">({user.reviews || 0} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 mt-4 md:mt-0">
          {user && user.role !== 'ADMIN' && (
            <button
              onClick={async () => {
                if (!user.isUserSignUpForProvider) {
                  setShowUpgradeModal(true);
                  return;
                }
                const nextPerspective = activePerspective === 'consumer' ? 'provider' : 'consumer';
                await switchPerspective(nextPerspective);
                router.push(nextPerspective === 'provider' ? '/provider/dashboard' : '/dashboard');
                showToast(`${t("header.switchTo")} ${nextPerspective === 'provider' ? t("header.proMode") : t("header.userMode")} ${t("common.success")}`, "success");
              }}
              className="flex items-center justify-center gap-2 text-sm font-bold text-text-secondary hover:text-primary transition-colors px-4 py-3 bg-secondary rounded-xl border border-border hover:border-primary/30 w-full sm:w-auto shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></svg>
              <span className="whitespace-nowrap">
                {!user.isUserSignUpForProvider
                  ? t("header.becomeProvider")
                  : (t("header.switchTo") + " " + (activePerspective === 'consumer' ? t("header.proMode") : t("header.userMode")))
                }
              </span>
            </button>
          )}
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="flex items-center justify-center gap-2 text-sm font-bold text-primary hover:text-primary-dark transition-colors px-5 py-3 bg-primary/5 rounded-xl border border-primary/10 hover:border-primary/30 w-full sm:w-auto whitespace-nowrap shrink-0">
              <Edit3 className="w-4 h-4" /> {t("settings.editProfile")}
            </button>
          ) : (
            <button onClick={handleSave} disabled={isLoading} className="flex items-center justify-center gap-2 text-sm font-bold text-white hover:bg-green-700 bg-green-600 px-5 py-3 rounded-xl border border-green-600 shadow-lg shadow-green-600/20 disabled:opacity-50 transition-all active:scale-95 transition-all duration-200 w-full sm:w-auto whitespace-nowrap shrink-0">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isLoading ? t("settings.saving") : t("settings.saveChanges")}
            </button>
          )}
        </div>
      </div>

      {user.bio && !isEditing && (
        <div className="p-4 bg-muted rounded-2xl border border-border mb-8 italic text-text-secondary text-sm font-medium">
          &quot;{user.bio}&quot;
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputRow name="firstName" label={t("settings.firstName")} value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
            <InputRow name="lastName" label={t("settings.lastName")} value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
          </div>
          <InputRow name="phone" label={t("settings.phoneNumber")} value={formData.phone} type="tel" onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          
          <div className="py-4">
             <label className="block text-sm font-black uppercase tracking-widest text-text-hint mb-4">
               {t("common.location") || "Working Region"}
             </label>
             <LocationSelector 
               value={{
                 districtId: formData.districtId,
                 cityId: formData.cityId,
                 areaId: formData.areaId
               }}
               onChange={(loc) => setFormData({ 
                 ...formData, 
                 districtId: loc.districtId, 
                 cityId: loc.cityId, 
                 areaId: loc.areaId 
               })}
               fields={["district", "area"]}
               className="space-y-4"
             />
          </div>

          <InputRow name="address" label="Detailed Address / Landmark" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          <InputRow name="bio" label={t("settings.bio") || "Bio"} value={formData.bio} isTextArea={true} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          <InfoRow icon={User} label={t("settings.firstName")} value={`${user.firstName} ${user.lastName}`} />
          <InfoRow icon={Mail} label={t("settings.emailAddress")} value={user.email?.toLowerCase() || t("common.error")} />
          <InfoRow icon={Phone} label={t("settings.phoneNumber")} value={user.phone || t("common.error")} />
        </div>
      )}

      {/* Address Management Section */}
      <div className="mt-12 pt-12 border-t border-border">
        <AddressManager />
      </div>

      <AnimatePresence>
        {showCamera && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[999] flex items-center justify-center p-6">
            <div className="w-full max-w-xl">
               <CameraCapture 
                 type="selfie" 
                 onCapture={handleAvatarCapture} 
                 onClose={() => setShowCamera(false)}
                 allowUpload={true}
               />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Upgrade to Provider Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className={`${unbounded.className} text-2xl font-black text-foreground mb-1`}>{t("header.becomeProvider")}</h2>
                    <p className="text-text-secondary text-sm font-medium">Join our community of skilled professionals</p>
                  </div>
                  <button onClick={() => setShowUpgradeModal(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-hint block">Professional Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Master Plumber, Senior Electrician"
                      value={upgradeData.professionalTitle}
                      onChange={(e) => setUpgradeData({...upgradeData, professionalTitle: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl border border-border bg-muted focus:bg-card transition-all font-bold text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-hint block">Service Description</label>
                    <textarea 
                      placeholder="Tell us about your skills and experience..."
                      value={upgradeData.serviceDescription}
                      onChange={(e) => setUpgradeData({...upgradeData, serviceDescription: e.target.value})}
                      rows={4}
                      className="w-full px-6 py-4 rounded-2xl border border-border bg-muted focus:bg-card transition-all font-bold text-sm resize-none"
                    />
                  </div>
                  
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Save className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-1">KYC Reminder</h4>
                      <p className="text-[11px] font-medium text-text-secondary leading-relaxed">After upgrading, you&apos;ll need to upload your ID card for verification before accepting bookings.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 py-4 rounded-2xl border border-border font-bold text-sm hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpgrade}
                    disabled={isUpgrading || !upgradeData.professionalTitle.trim()}
                    className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    Confirm Upgrade
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Move these outside to prevent focus-loss on re-render
const InfoRow = ({ icon: Icon, label, value }: { icon: LucideIcon, label: string, value: string }) => (
  <div className="py-4 border-b border-border">
    <p className="text-sm text-text-secondary mb-1">{label}</p>
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-text-hint" />
      <p className="text-foreground">{value}</p>
    </div>
  </div>
);

const InputRow = ({ name, label, value, onChange, type = "text", isTextArea = false }: { name: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, type?: string, isTextArea?: boolean }) => (
  <div className="py-2">
    <label htmlFor={name} className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
    {isTextArea ? (
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={3}
        className="w-full px-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
      />
    ) : (
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
      />
    )}
  </div>
);
