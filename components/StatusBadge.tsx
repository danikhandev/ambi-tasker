"use client";
import { cn } from "@/utils/cn";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

export type ServiceStatus = "active" | "paused" | "inactive";

export const statusConfig: Record<ServiceStatus, { label: string; color: string; icon: any }> = {
  active: {
    label: "Approved",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  paused: {
    label: "Pending",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  inactive: {
    label: "Rejected",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    icon: AlertCircle,
  },
};

export const StatusBadge: React.FC<{ status: ServiceStatus }> = ({ status }) => {
  const { label, color, icon: Icon } = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl border text-[10px] font-bold uppercase ${color}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
};
