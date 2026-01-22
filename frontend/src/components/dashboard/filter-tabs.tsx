"use client";

import { cn } from "@/lib/utils";
import { ReminderStatus } from "@/types/reminder";

type FilterOption = ReminderStatus | "all";

interface FilterTabsProps {
  value: FilterOption;
  onChange: (value: FilterOption) => void;
}

const tabs: { value: FilterOption; label: string }[] = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

export function FilterTabs({ value, onChange }: FilterTabsProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 bg-surface-100 rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            value === tab.value
              ? "bg-white text-surface-900 shadow-sm"
              : "text-surface-600 hover:text-surface-900"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
