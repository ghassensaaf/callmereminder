"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Sparkles, Wand2, Save } from "lucide-react";

import { Button, Card, Input, Textarea } from "@/components/ui";
import { settingsApi } from "@/lib/api";

type PromptMode = "default" | "custom" | "generated";

export function PromptSettingsSection() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(),
  });

  const [mode, setMode] = useState<PromptMode>("default");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [tone, setTone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const profile = settings?.promptProfile;
    if (!profile) return;
    setMode(profile.mode);
    setCustomPrompt(profile.customPrompt || "");
    setGeneratedPrompt(profile.generatedPrompt || "");
    setBusinessName(profile.businessName || "");
    setIndustry(profile.industry || "");
    setTone(profile.tone || "");
    setNotes(profile.notes || "");
  }, [settings]);

  async function savePromptSettings(nextMode: PromptMode = mode) {
    setSaving(true);
    try {
      await settingsApi.updatePrompt({
        mode: nextMode,
        customPrompt,
        generatedPrompt,
        businessName,
        industry,
        tone,
        notes,
      });
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Prompt settings saved");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to save prompt settings");
    } finally {
      setSaving(false);
    }
  }

  async function generatePrompt() {
    setGenerating(true);
    try {
      const result = await settingsApi.generatePrompt({
        businessName,
        industry,
        tone,
        notes,
      });
      setGeneratedPrompt(result.generatedPrompt || "");
      setMode("generated");
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success(
        result.provider === "openrouter"
          ? "Prompt generated with AI"
          : "Generated a prompt template (fallback mode)"
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to generate prompt");
    } finally {
      setGenerating(false);
    }
  }

  const activePrompt =
    mode === "custom" ? customPrompt : mode === "generated" ? generatedPrompt : "";
  const hasActiveOrganization = !!settings?.activeOrganizationId;

  return (
    <Card variant="elevated" className="p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          AI call prompt
        </h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 max-w-xl">
          Choose how your company wants reminder calls to sound: default behavior, your own custom prompt, or an AI-generated prompt.
        </p>
        {!hasActiveOrganization && (
          <p className="text-sm text-warning-700 dark:text-warning-300 mt-2">
            Create or join an organization first to manage shared company prompts.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant={mode === "default" ? "primary" : "outline"} onClick={() => setMode("default")}>
          Default
        </Button>
        <Button type="button" size="sm" variant={mode === "custom" ? "primary" : "outline"} onClick={() => setMode("custom")}>
          Custom prompt
        </Button>
        <Button type="button" size="sm" variant={mode === "generated" ? "primary" : "outline"} onClick={() => setMode("generated")}>
          Generated prompt
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Acme Dental Clinic" />
        <Input label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Healthcare, retail, logistics..." />
        <Input label="Tone" value={tone} onChange={(e) => setTone(e.target.value)} placeholder="Friendly, formal, concise..." />
      </div>

      <Textarea
        label="Business notes for AI generator"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Compliance notes, wording preferences, what to avoid..."
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Wand2 className="h-4 w-4" />}
          isLoading={generating}
          disabled={!hasActiveOrganization}
          onClick={generatePrompt}
        >
          Generate prompt (free model)
        </Button>
      </div>

      <Textarea
        label="Custom prompt"
        rows={7}
        value={customPrompt}
        onChange={(e) => setCustomPrompt(e.target.value)}
        placeholder="Write your company's system prompt..."
        hint="Used only when mode is set to Custom prompt."
      />

      <Textarea
        label="Generated prompt"
        rows={7}
        value={generatedPrompt}
        onChange={(e) => setGeneratedPrompt(e.target.value)}
        placeholder="AI-generated prompt appears here..."
        hint="Used only when mode is set to Generated prompt."
      />

      {mode !== "default" && (
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/80 dark:bg-surface-900/40 p-3">
          <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Active prompt preview</p>
          <p className="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap line-clamp-6">
            {activePrompt || "No prompt content yet."}
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          leftIcon={<Save className="h-4 w-4" />}
          isLoading={saving}
          disabled={!hasActiveOrganization}
          onClick={() => savePromptSettings(mode)}
        >
          Save prompt settings
        </Button>
      </div>
    </Card>
  );
}
