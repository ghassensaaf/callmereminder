"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="relative mb-6">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full blur-2xl scale-150 opacity-60" />
        
        {/* Icon container */}
        <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-100 to-white rounded-2xl border border-primary-200/50 shadow-lg shadow-primary-500/10">
          <div className="text-primary-600">{icon}</div>
        </div>
        
        {/* Decorative dots */}
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary-200 rounded-full animate-pulse" />
        <div className="absolute -bottom-1 -left-3 w-3 h-3 bg-primary-300 rounded-full animate-pulse animation-delay-200" />
      </div>

      <h3 className="text-lg font-semibold text-surface-900 mb-2">{title}</h3>
      <p className="text-sm text-surface-500 max-w-sm leading-relaxed mb-6">
        {description}
      </p>
      
      {action && <div>{action}</div>}
    </motion.div>
  );
}
