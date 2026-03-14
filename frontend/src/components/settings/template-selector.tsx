"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui";
import { templatesApi } from "@/lib/api";

interface TemplateSelectorProps {
  onSelect: (title: string, message: string) => void;
  disabled?: boolean;
}

export function TemplateSelector({ onSelect, disabled }: TemplateSelectorProps) {
  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: () => templatesApi.list(),
  });

  if (isLoading || !templates?.length) return null;

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-surface-600 dark:text-surface-400 flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Use template
      </span>
      <div className="flex flex-wrap gap-2">
        {templates.map((t) => (
          <Button
            key={t.id}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onSelect(t.title, t.message)}
          >
            {t.title}
          </Button>
        ))}
      </div>
    </div>
  );
}
