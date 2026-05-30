import React from 'react';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export type ServiceStatus = 'active' | 'inactive' | 'paused' | 'pending';

interface StatusBadgeProps {
  status: ServiceStatus;
}

const statusMap: Record<ServiceStatus, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: 'Active', color: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  inactive: { label: 'Inactive', color: 'bg-red-50 text-red-700 border-red-200', icon: <AlertCircle className="w-3 h-3" /> },
  paused: { label: 'Paused', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="w-3 h-3" /> },
  pending: { label: 'Pending Review', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="w-3 h-3" /> },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const cfg = statusMap[status] ?? statusMap.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-bold uppercase ${cfg.color}`}>\
      {cfg.icon}
      {cfg.label}
    </span>
  );
};
