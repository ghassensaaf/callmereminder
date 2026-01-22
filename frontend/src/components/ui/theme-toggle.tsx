"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme();

  const themes = [
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
    { value: "system" as const, icon: Monitor, label: "System" },
  ];

  // Render placeholder to prevent layout shift
  if (!mounted) {
    return (
      <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-100 dark:bg-surface-800">
        {themes.map(({ value, icon: Icon, label }) => (
          <div key={value} className="p-2 rounded-lg">
            <Icon className="h-4 w-4 text-surface-400" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-100 dark:bg-surface-800">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            "relative p-2 rounded-lg transition-colors",
            theme === value
              ? "text-primary-600 dark:text-primary-400"
              : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
          )}
          title={label}
        >
          {theme === value && (
            <motion.div
              layoutId="theme-toggle-bg"
              className="absolute inset-0 bg-white dark:bg-surface-700 rounded-lg shadow-sm"
              transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
            />
          )}
          <Icon className="h-4 w-4 relative z-10" />
        </button>
      ))}
    </div>
  );
}
