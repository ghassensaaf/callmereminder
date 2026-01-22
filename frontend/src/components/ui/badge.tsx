"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "outline";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  pulse?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      dot = false,
      pulse = false,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: "bg-surface-100 text-surface-700 border-surface-200",
      primary:
        "bg-primary-50 text-primary-700 border-primary-200",
      success:
        "bg-success-50 text-success-600 border-success-100",
      warning:
        "bg-warning-50 text-warning-600 border-warning-100",
      danger: "bg-danger-50 text-danger-600 border-danger-100",
      info: "bg-primary-50 text-primary-600 border-primary-100",
      outline: "bg-transparent border-surface-300 text-surface-600",
    };

    const dotColors = {
      default: "bg-surface-400",
      primary: "bg-primary-500",
      success: "bg-success-500",
      warning: "bg-warning-500",
      danger: "bg-danger-500",
      info: "bg-primary-500",
      outline: "bg-surface-400",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-xs",
      lg: "px-3 py-1.5 text-sm",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 font-medium rounded-full border",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span className="relative flex h-2 w-2">
            {pulse && (
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                  dotColors[variant]
                )}
              />
            )}
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                dotColors[variant]
              )}
            />
          </span>
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
