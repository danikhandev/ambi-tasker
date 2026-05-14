import React from "react";
import { motion } from "framer-motion";
import { Ghost, Inbox } from "lucide-react";
import { unbounded } from "@/app/fonts";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center bg-card/30 backdrop-blur-sm rounded-[48px] border border-dashed border-border/60 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      <div className="relative z-10 w-24 h-24 bg-background border border-border rounded-[32px] flex items-center justify-center mb-8 text-primary/40 shadow-xl shadow-black/[0.02] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
        <Icon className="w-10 h-10 group-hover:text-primary transition-colors" strokeWidth={1.5} />
      </div>
      
      <h3 className={`${unbounded.className} text-2xl font-black text-foreground mb-3 relative z-10`}>
        {title}
      </h3>
      
      <p className="text-text-hint font-medium max-w-[320px] mb-8 leading-relaxed relative z-10">
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="relative z-10 px-8 py-4 bg-foreground text-background font-black uppercase tracking-widest rounded-2xl hover:bg-primary hover:text-white hover:shadow-2xl hover:shadow-primary/20 transition-all text-[10px] hover:-translate-y-1 active:scale-95 duration-300"
        >
          {actionText}
        </button>
      )}
    </motion.div>
  );
}

export default EmptyState;
