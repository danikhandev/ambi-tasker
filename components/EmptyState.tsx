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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card rounded-[32px] border border-dashed border-border"
    >
      <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-6 text-text-disabled shadow-sm border border-border/50">
        <Icon className="w-8 h-8" strokeWidth={1.5} />
      </div>
      <h3 className={`${unbounded.className} text-xl font-bold text-foreground mb-2`}>
        {title}
      </h3>
      <p className="text-text-secondary font-medium max-w-sm mb-6">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all text-sm hover:-translate-y-0.5 active:scale-95 duration-200"
        >
          {actionText}
        </button>
      )}
    </motion.div>
  );
}

export default EmptyState;
