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
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-950/20 rounded-full blur-2xl scale-150 opacity-60" />
        
        {/* Icon container */}
        <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-100 to-white dark:from-primary-900/50 dark:to-surface-800 rounded-2xl border border-primary-200/50 dark:border-primary-700/30 shadow-lg shadow-primary-500/10 dark:shadow-primary-500/5">
          <div className="text-primary-600 dark:text-primary-400">{icon}</div>
        </div>
        
        {/* Decorative dots */}
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary-200 dark:bg-primary-800 rounded-full animate-pulse" />
        <div className="absolute -bottom-1 -left-3 w-3 h-3 bg-primary-300 dark:bg-primary-700 rounded-full animate-pulse animation-delay-200" />
      </div>

      <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">{title}</h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm leading-relaxed mb-6">
        {description}
      </p>
      
      {action && <div>{action}</div>}
    </motion.div>
  );
}
