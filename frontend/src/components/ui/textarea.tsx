"use client";

import { forwardRef, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-surface-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full rounded-xl border bg-white px-4 py-3 text-sm text-surface-900",
            "placeholder:text-surface-400",
            "transition-all duration-200 resize-none",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
            "disabled:bg-surface-50 disabled:text-surface-500 disabled:cursor-not-allowed",
            error
              ? "border-danger-500 focus:ring-danger-500/30 focus:border-danger-500"
              : "border-surface-200 hover:border-surface-300",
            className
          )}
          {...props}
        />
        {(error || hint) && (
          <p
            className={cn(
              "mt-1.5 text-xs",
              error ? "text-danger-500" : "text-surface-500"
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
