"use client";

import { Fragment, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = "md",
}: ModalProps) {
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-surface-950/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container - Scrollable on mobile */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={cn(
                  "w-full bg-white shadow-2xl overflow-visible",
                  "rounded-t-2xl sm:rounded-2xl",
                  "max-h-[90vh] sm:max-h-[85vh]",
                  "flex flex-col",
                  sizes[size]
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header - Sticky */}
                {(title || description) && (
                  <div className="flex items-start justify-between p-4 sm:p-6 pb-0 flex-shrink-0">
                    <div className="pr-4">
                      {title && (
                        <h2 className="text-base sm:text-lg font-semibold text-surface-900">
                          {title}
                        </h2>
                      )}
                      {description && (
                        <p className="mt-1 text-xs sm:text-sm text-surface-500">
                          {description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 -m-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-lg transition-colors flex-shrink-0"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {/* Content - Scrollable */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
              </motion.div>
            </div>
          </div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}
