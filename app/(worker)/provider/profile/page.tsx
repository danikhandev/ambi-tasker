"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import { SERVICE_CATEGORIES } from "@/constants/services";
import {
  Edit3, Save, Loader2, PlusCircle, Trash2, Banknote, CheckCircle, X, AlertCircle, Mail, Camera
} from "lucide-react";
import ConnectSection from "@/components/ConnectSection";
import CircularFrame from "@/components/CircularFrame";
import { Star, Award, TrendingUp, MapPin } from "lucide-react";
import LocationSelector from "@/components/LocationSelector";
import { useRouter } from "next/navigation";
import { uploadImage } from '@/services/supabase-storage';
import CameraCapture from "@/components/CameraCapture";
import { useUI } from "@/contexts/UIContext";
import PageHeader from "@/components/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useAdmin } from "@/contexts/AdminContext";
import KYCUpload from "@/components/profile/KYCUpload";

interface ProviderService {
  id: string;
  title: string;
  price: number;
  type: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  image: string;
}

interface ProviderProfile {
  id: string;
  userId: string;
  name: string;
  bio: string;
  experience: string;
  education?: string;
  hourlyRate: number;
  category: string;
  services: ProviderService[];
  portfolio: PortfolioItem[];
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | "NOT_STARTED";
  serviceAreas?: any[];
}

export default function ProviderProfilePage() {
  const { user, loading: userLoading, switchPerspective, refetch: refetchUser } = useUser();
  const { admin } = useAdmin();
  const { showToast } = useUI();
  const router = useRouter();
  const { t, isRTL } = useTranslation();
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (admin) {
      router.replace('/admin/profile');
    }
  }, [admin, router]);

  const [formData, setFormData] = useState({
    bio: '',
    experience: '',
    education: '',
    hourlyRate: 0,
    categories: [] as string[],
    services: [] as ProviderService[],
    portfolio: [] as PortfolioItem[],
    serviceAreas: [] as any[],
  });

  const [selectedLocation, setSelectedLocation] = useState({
    provinceId: "",
    provinceName: "",
    districtId: "",
    districtName: "",
    cityId: "",
    cityName: "",
    areaId: "",
    areaName: "",
  });

  useEffect(() => {
    // Fetch real worker profile associated with the logged-in user
    async function fetchProfile() {
      if (user && user.isUserSignUpForProvider) {
        setIsLoading(true);
        try {
          const res = await fetch("/api/provider/profile");
          const json = await res.json();
          
          if (json.success && json.data) {
            const dbWorker = json.data;

            const category = dbWorker.professionalTitle || "";
            const services: any[] = [];
            const portfolio: any[] = [];
            const serviceAreas = dbWorker.serviceAreas || [];

            setProviderProfile({
              id: dbWorker.id,
              userId: dbWorker.userId,
              name: dbWorker.user?.name || user.firstName + ' ' + user.lastName,
              bio: dbWorker.serviceDescription || '',
              experience: String(dbWorker.experienceYears ? `${dbWorker.experienceYears} Years` : ''),
              education: '',
              hourlyRate: dbWorker.hourlyRate || 0,
              category: category,
              services: dbWorker.servicesList || [],
              portfolio: dbWorker.portfolio || [],
              verificationStatus: dbWorker.verificationStatus,
              serviceAreas: serviceAreas,
            });
            
            setFormData({
              bio: dbWorker.serviceDescription || '',
              experience: String(dbWorker.experienceYears ? `${dbWorker.experienceYears} Years` : ''),
              education: '',
              hourlyRate: dbWorker.hourlyRate || 0,
              categories: category ? [category] : [],
              services: dbWorker.servicesList || [],
              portfolio: dbWorker.portfolio || [],
              serviceAreas: serviceAreas,
            });
          }
        } catch (err) {
          console.error("Provider profile fetch error:", err);
          setError("Failed to load provider profile.");
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchProfile();
  }, [user]);

  const handleAvatarCapture = async (image: string) => {
    try {
      setUploading(true);
      setShowCamera(false);
      
      const response = await fetch(image);
      const blob = await response.blob();
      const publicUrl = await uploadImage(blob);
      
      // Update the user profile with the new avatar via API
      const upRes = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: `${user?.firstName} ${user?.lastName}`,
          profileImage: publicUrl 
        }),
      });

      if (!upRes.ok) throw new Error("Failed to update avatar");

      await refetchUser();
      showToast(t("settings.imageCaptured") || "Profile image updated successfully!", "success");
    } catch (err: any) {
      console.error("Upload error:", err);
      showToast(t("common.error") || "Failed to upload image", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    try {
      setUploading(true);
      const upRes = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: `${user.firstName} ${user.lastName}`,
          profileImage: "" 
        }),
      });

      if (!upRes.ok) throw new Error("Failed to remove avatar");

      await refetchUser();
      showToast(t("settings.imageDeleted") || "Profile image removed", "success");
    } catch (err) {
      showToast(t("common.error"), "error");
    } finally {
      setUploading(false);
    }
  };

  const handlePortfolioImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      setUploading(true);
      const publicUrl = await uploadImage(file, 'portfolio', `${user.id}/${Date.now()}`);
      handlePortfolioChange(index, 'image', publicUrl);
      showToast(t("settings.imageCaptured") || "Portfolio image uploaded!", "success");
    } catch (err) {
      showToast(t("common.error"), "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload: any = {
        serviceDescription: formData.bio,
        experienceYears: parseInt(formData.experience.split(' ')[0]) || 0,
        hourlyRate: formData.hourlyRate,
        portfolio: formData.portfolio,
        servicesList: formData.services,
        serviceAreas: formData.serviceAreas.map((sa: any) => sa.id),
      };
      
      if (formData.categories.length > 0) {
        payload.professionalTitle = formData.categories[0];
      }

      const response = await fetch('/api/provider/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile");
      }

      setSuccess("Professional profile updated successfully!");
      setIsEditing(false);
      
      // Refresh local profile data
      if (providerProfile) {
        setProviderProfile({
          ...providerProfile,
          ...formData
        });
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save profile changes.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { id: Date.now().toString(), title: '', price: 0, type: 'FIXED' }]
    }));
  };

  const handleServiceChange = (index: number, field: string, value: string | number) => {
    setFormData(prev => {
      const newServices = [...prev.services];
      newServices[index] = { ...newServices[index], [field]: value };
      return { ...prev, services: newServices };
    });
  };

  const handleRemoveService = (id: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(s => s.id !== id)
    }));
  };

  const handleAddPortfolioItem = () => {
    setFormData(prev => ({
      ...prev,
      portfolio: [...prev.portfolio, { id: Date.now().toString(), title: '', image: '' }]
    }));
  };

  const handlePortfolioChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newPortfolio = [...prev.portfolio];
      newPortfolio[index] = { ...newPortfolio[index], [field]: value };
      return { ...prev, portfolio: newPortfolio };
    });
  };

  const handleRemovePortfolioItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter(p => p.id !== id)
    }));
  };

  if (userLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-lg text-foreground ml-3">Loading user...</p>
      </div>
    );
  }

  if (!user.isUserSignUpForProvider) {
    return (
      <div className="flex-1 bg-muted p-6 flex items-center justify-center">
        <div className="text-center bg-card p-8 rounded-xl shadow-sm border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-4">You are not registered as a Provider</h2>
          <p className="text-text-secondary mb-6">
            To manage your provider profile, please complete the onboarding process.
          </p>
          <Link href="/provider/onboarding" className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 hover:-translate-y-0.5 active:scale-95 transition-all duration-200">
            Become a Provider
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-muted p-6">
      <PageHeader 
        title="My Provider"
        highlightedText="Profile"
        subtitle="Manage your public profile, services, and portfolio."
      />

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm my-6"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm my-6"
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
            <button onClick={() => setSuccess("")} className="ml-auto"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card p-8 rounded-2xl shadow-sm border border-border mt-6"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <CircularFrame
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`}
                alt="Provider Avatar"
                size={96}
                className="border-4 border-primary/20 shadow-xl"
              />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary border-2 border-card flex items-center justify-center text-white shadow-lg z-10">
                <Award size={14} className="fill-current" />
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
                  {user.avatar && (
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
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-black text-foreground">{user.firstName} {user.lastName}</h2>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg border border-primary/20">
                  {t("common.verified") || "Verified Pro"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm font-bold">
                <div className="flex items-center gap-1.5 text-yellow-500">
                  <Star size={16} className="fill-current" />
                  <span className="text-foreground">4.9</span>
                  <span className="text-text-hint font-medium">(124 {t("common.reviews") || "reviews"})</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-border" />
                <div className="flex items-center gap-1.5 text-primary">
                  <TrendingUp size={16} />
                  <span>{formData.experience || "5+ Years Exp"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-primary/10 text-primary rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all border border-primary/20 active:scale-95 flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> {t("settings.editProfile") || "Edit Profile"}
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 bg-muted text-text-secondary rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all border border-border active:scale-95"
                >
                  {t("common.cancel") || "Cancel"}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-primary transition-all shadow-lg shadow-black/10 disabled:opacity-50 active:scale-95 flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isLoading ? (t("settings.saving") || "Saving...") : (t("settings.saveChanges") || "Save Profile")}
                </button>
              </div>
            )}
            <button
              onClick={() => {
                switchPerspective('consumer');
                window.location.href = '/dashboard';
              }}
              className="px-6 py-3 bg-muted text-text-secondary rounded-xl font-black text-[11px] uppercase tracking-widest hover:text-primary transition-all border border-border hover:border-primary/30 active:scale-95 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></svg> {t("header.switchTo")} {t("header.userMode")}
            </button>
          </div>
        </div>

        <form onSubmit={handleSave}>
          {/* General Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-1">Bio</label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:bg-muted"
              />
            </div>
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-foreground mb-1">Experience</label>
              <input
                type="text"
                id="experience"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:bg-muted mb-4"
              />
              <label htmlFor="education" className="block text-sm font-medium text-foreground mb-1">Education</label>
              <input
                type="text"
                id="education"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:bg-muted"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-8 pb-8 border-b border-border">
            <h3 className="font-bold text-lg text-foreground mb-4">Categories</h3>
            <div className="flex flex-wrap gap-2 mb-4"> {/* Added mb-4 for spacing */}
              {SERVICE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    if (isEditing) {
                      setFormData(prev => ({
                        ...prev,
                        categories: prev.categories.includes(cat.name)
                          ? prev.categories.filter(c => c !== cat.name)
                          : [...prev.categories, cat.name]
                      }));
                    }
                  }}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${formData.categories.includes(cat.name)
                    ? "bg-primary text-white border-primary"
                    : "bg-muted text-foreground border-border hover:bg-gray-100"
                    } ${!isEditing ? "cursor-default" : ""}`}
                  disabled={!isEditing}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Service Areas Coverage */}
          <div className="mb-8 pb-8 border-b border-border">
            <h3 className="font-bold text-lg text-foreground mb-4">Service Coverage Areas</h3>
            <p className="text-xs text-text-hint mb-6 flex items-center gap-2 italic">
              <MapPin className="w-4 h-4" /> You can serve multiple districts, cities, or specific neighborhoods. Adding an area makes you visible to customers there.
            </p>
            
            <div className="space-y-6">
              {/* Active Areas Tags */}
              <div className="flex flex-wrap gap-3">
                {formData.serviceAreas?.length > 0 ? (
                  formData.serviceAreas.map((area: any) => {
                    const areaId = area.id;
                    const displayName = area.name + (area.city?.name ? `, ${area.city.name}` : '');
                    return (
                      <div key={areaId} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl font-bold text-xs group">
                        <MapPin size={12} />
                        {displayName}
                        {isEditing && (
                          <button 
                            type="button" 
                            onClick={() => setFormData(prev => ({ 
                              ...prev, 
                              serviceAreas: prev.serviceAreas.filter((item: any) => item.id !== areaId)
                            }))} 
                            className="p-1 hover:bg-primary/20 rounded-full transition-colors"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-text-hint italic p-4 bg-muted rounded-xl w-full text-center border border-dashed border-border">
                    No service areas added. Add your first area below.
                  </div>
                )}
              </div>

              {/* Add New Area Selector */}
              {isEditing && (
                 <div className="p-6 bg-muted/30 rounded-2xl border border-border">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-text-hint mb-4">Add a new coverage area</h4>
                    <LocationSelector 
                      value={selectedLocation}
                      onChange={(loc) => {
                        setSelectedLocation(loc);
                        if (loc.areaId && !formData.serviceAreas?.some((sa: any) => sa.id === loc.areaId)) {
                          const newArea = {
                            id: loc.areaId,
                            name: loc.areaName,
                            city: {
                              name: loc.cityName || ""
                            }
                          };
                          setFormData(prev => ({
                            ...prev,
                            serviceAreas: [...(prev.serviceAreas || []), newArea]
                          }));
                          showToast(`${loc.areaName} added to your coverage!`, "success");
                          
                          // Reset selection for selector
                          setSelectedLocation({
                            provinceId: "",
                            provinceName: "",
                            districtId: "",
                            districtName: "",
                            cityId: "",
                            cityName: "",
                            areaId: "",
                            areaName: "",
                          });
                        }
                      }}
                      fields={["province", "district", "city", "area"]}
                    />
                 </div>
              )}
            </div>
          </div>

          {/* Services Offered */}

          {/* Portfolio */}
          <div className="mb-8 pb-8 border-b border-border">
            <h3 className="font-bold text-lg text-foreground mb-4">Portfolio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.portfolio.map((item, index) => (
                <div key={item.id} className="p-4 border border-border rounded-xl relative">
                  <label className="block text-sm font-medium text-foreground mb-1">Project Title</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handlePortfolioChange(index, 'title', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-muted mb-3"
                  />
                  <label className="block text-sm font-medium text-foreground mb-1">Image</label>
                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 rounded-xl bg-muted border border-border overflow-hidden relative flex-shrink-0">
                      {item.image ? (
                        <Image src={item.image} alt="P" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-hint">
                          <PlusCircle size={20} />
                        </div>
                      )}
                      {isEditing && uploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.image}
                          onChange={(e) => handlePortfolioChange(index, 'image', e.target.value)}
                          placeholder="Image URL"
                          className="w-full px-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs mb-2"
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById(`port-file-${index}`)?.click()}
                          className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                        >
                          {t("camera.chooseDocument") || "Upload Image"}
                        </button>
                        <input
                          id={`port-file-${index}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePortfolioImageUpload(index, e)}
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-text-hint truncate flex-1">{item.image}</p>
                    )}
                  </div>
                  {isEditing && (
                    <button type="button" onClick={() => handleRemovePortfolioItem(item.id)} className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {isEditing && (
              <button type="button" onClick={handleAddPortfolioItem} className="mt-4 flex items-center gap-2 text-primary hover:underline active:scale-95 transition-all duration-200">
                <PlusCircle className="w-5 h-5" /> Add Portfolio Item
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {/* KYC Verification Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        <KYCUpload 
          currentStatus={providerProfile?.verificationStatus as any} 
          onSuccess={() => {
            setSuccess("KYC documents submitted! We will review them shortly.");
            // Refresh profile to show pending status
            router.refresh();
            window.location.reload(); 
          }}
        />
      </motion.div>

      {/* Connect Section */}
      <div className="mt-12 pt-12 border-t border-border">
        <ConnectSection />
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
    </div>
  );
}