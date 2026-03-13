"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { settingsApi } from "@/lib/api";
import { Button, Input, Card, Badge } from "@/components/ui";
import { Header } from "@/components/layout";
import { Phone, Settings, ArrowLeft, Trash2, TestTube } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending } = useSession();
  const [vapiApiKey, setVapiApiKey] = useState("");
  const [vapiPhoneNumberId, setVapiPhoneNumberId] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(),
    enabled: !!session,
  });

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (settings?.vapiPhoneNumberId) {
      setVapiPhoneNumberId(settings.vapiPhoneNumberId);
    } else {
      setVapiPhoneNumberId("");
    }
  }, [settings?.vapiPhoneNumberId]);

  async function handleTest() {
    const apiKey = vapiApiKey.trim();
    const phoneId = vapiPhoneNumberId.trim();
    if (!apiKey || !phoneId) {
      toast.error("Enter API key and phone number ID to test");
      return;
    }
    setTesting(true);
    try {
      await settingsApi.test({ vapiApiKey: apiKey, vapiPhoneNumberId: phoneId });
      toast.success("Configuration is valid");
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : "Validation failed";
      toast.error(msg || "Invalid configuration");
    } finally {
      setTesting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Remove Vapi configuration? Voice reminders will stop working until you add new credentials.")) return;
    setDeleting(true);
    try {
      await settingsApi.delete();
      queryClient.setQueryData(["settings"], { vapiApiKey: null, vapiPhoneNumberId: null, hasVapiKeys: false });
      setVapiApiKey("");
      setVapiPhoneNumberId("");
      toast.success("Vapi configuration removed");
    } catch {
      toast.error("Failed to remove configuration");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await settingsApi.update({
        vapiApiKey: vapiApiKey.trim() || undefined,
        vapiPhoneNumberId: vapiPhoneNumberId.trim() || undefined,
      });
      queryClient.setQueryData(["settings"], updated);
      toast.success("Settings saved");
      setVapiApiKey("");
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.detail : "Failed to save";
      toast.error(msg || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  }

  if (isPending || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-surface-500">Loading...</div>
      </div>
    );
  }

  const hasConfig = settings?.hasVapiKeys ?? false;

  return (
    <div className="min-h-screen">
      <Header onCreateClick={() => router.push("/")} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/50">
              <Settings className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50">
                Settings
              </h1>
              <p className="text-surface-500 dark:text-surface-400 text-sm">
                Configure your Vapi credentials for voice reminders
              </p>
            </div>
          </div>

          <Card variant="elevated" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Vapi Configuration
              </h2>
              {!settingsLoading && (
                hasConfig ? (
                  <Badge variant="success" dot>
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="warning" dot>
                    Not configured
                  </Badge>
                )
              )}
            </div>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
              Add your Vapi API key and phone number ID to enable voice call reminders.{" "}
              <Link href="/docs/vapi" className="text-primary-600 dark:text-primary-400 hover:underline">
                How to get these →
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Vapi API Key"
                type="password"
                value={vapiApiKey}
                onChange={(e) => setVapiApiKey(e.target.value)}
                placeholder={hasConfig ? "Enter new API key to update" : "Enter your API key"}
                hint="Your key is stored securely and never shown"
              />
              <Input
                label="Vapi Phone Number ID"
                type="text"
                value={vapiPhoneNumberId}
                onChange={(e) => setVapiPhoneNumberId(e.target.value)}
                placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save settings"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={testing || !vapiApiKey.trim() || !vapiPhoneNumberId.trim()}
                  onClick={handleTest}
                >
                  <TestTube className="h-4 w-4 mr-1.5" />
                  {testing ? "Testing..." : "Test"}
                </Button>
                {hasConfig && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-danger-600 dark:text-danger-400 border-danger-200 dark:border-danger-800 hover:bg-danger-50 dark:hover:bg-danger-950/30"
                    disabled={deleting}
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    {deleting ? "Removing..." : "Remove"}
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
