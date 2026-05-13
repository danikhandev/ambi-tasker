"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Trash2, Home, Briefcase, Star, Loader2, Map as MapIcon, X, Check } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useUI } from '@/contexts/UIContext';
import LocationSelector from '../LocationSelector';

interface Address {
  id: string;
  label: string;
  address: string;
  districtId?: string;
  cityId?: string;
  areaId?: string;
  isDefault: boolean;
  district?: { name: string };
  city?: { name: string };
  area?: { name: string };
}

export default function AddressManager() {
  const { t, isRTL } = useTranslation();
  const { showToast } = useUI();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    label: '',
    address: '',
    districtId: '',
    cityId: '',
    areaId: '',
    isDefault: false
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/user/addresses');
      const data = await res.json();
      if (data.success) {
        setAddresses(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label || !formData.address) {
      showToast("Label and address are required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const url = '/api/user/addresses';
      const method = editingId ? 'PATCH' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.success) {
        showToast(editingId ? "Address updated" : "Address added", "success");
        fetchAddresses();
        resetForm();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save address", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const res = await fetch(`/api/user/addresses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Address deleted", "success");
        fetchAddresses();
      }
    } catch (err) {
      showToast("Failed to delete address", "error");
    }
  };

  const handleSetDefault = async (address: Address) => {
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...address, isDefault: true })
      });
      if (res.ok) {
        showToast("Default address updated", "success");
        fetchAddresses();
      }
    } catch (err) {
      showToast("Failed to update default address", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      address: '',
      districtId: '',
      cityId: '',
      areaId: '',
      isDefault: false
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const getLabelIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('home')) return <Home className="w-4 h-4" />;
    if (l.includes('work') || l.includes('office')) return <Briefcase className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black uppercase tracking-widest text-foreground">
          {t("profile.savedAddresses") || "Saved Addresses"}
        </h3>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary hover:text-white transition-all"
          >
            <Plus className="w-4 h-4" />
            {t("common.add") || "Add New"}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {(isAdding || editingId) ? (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onSubmit={handleSave}
            className="p-6 bg-muted rounded-2xl border border-border space-y-4"
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-foreground">
                {editingId ? "Edit Address" : "New Address"}
              </h4>
              <button type="button" onClick={resetForm} className="text-text-hint hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Label (e.g. Home, Work)</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={e => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 bg-card"
                  placeholder="Home"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Region</label>
                <LocationSelector
                  value={{ districtId: formData.districtId, areaId: formData.areaId, cityId: formData.cityId }}
                  onChange={loc => setFormData({ ...formData, ...loc })}
                  fields={["district", "area"]}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Detailed Address</label>
              <textarea
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 bg-card resize-none"
                rows={2}
                placeholder="Street name, house number, landmarks..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="isDefault" className="text-sm font-bold text-text-secondary">Set as default address</label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingId ? "Update Address" : "Save Address"}
              </button>
            </div>
          </motion.form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.length === 0 ? (
              <div className="col-span-2 py-12 text-center bg-muted/50 rounded-2xl border border-dashed border-border">
                <MapIcon className="w-8 h-8 text-text-hint mx-auto mb-2 opacity-50" />
                <p className="text-sm text-text-hint font-medium">No saved addresses yet</p>
              </div>
            ) : (
              addresses.map(addr => (
                <motion.div
                  layout
                  key={addr.id}
                  className={`p-5 rounded-2xl border transition-all ${addr.isDefault ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-card border-border hover:border-primary/30'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${addr.isDefault ? 'bg-primary text-white' : 'bg-muted text-text-secondary'}`}>
                        {getLabelIcon(addr.label)}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground flex items-center gap-2">
                          {addr.label}
                          {addr.isDefault && <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Default</span>}
                        </h4>
                        <p className="text-[11px] text-text-hint font-bold uppercase tracking-widest">
                          {addr.area?.name || addr.district?.name || "Global"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefault(addr)}
                          className="p-2 text-text-hint hover:text-primary transition-colors"
                          title="Set as Default"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingId(addr.id);
                          setFormData({
                            label: addr.label,
                            address: addr.address,
                            districtId: addr.districtId || '',
                            cityId: addr.cityId || '',
                            areaId: addr.areaId || '',
                            isDefault: addr.isDefault
                          });
                        }}
                        className="p-2 text-text-hint hover:text-foreground transition-colors"
                      >
                        <Briefcase className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(addr.id)}
                        className="p-2 text-text-hint hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary font-medium line-clamp-2 leading-relaxed">
                    {addr.address}
                  </p>
                </motion.div>
              ))
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
