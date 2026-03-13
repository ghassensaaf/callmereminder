"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "@/lib/auth-client";
import { settingsApi } from "@/lib/api";
import { Button, Input, Card } from "@/components/ui";
import { Header } from "@/components/layout";
import { Phone, Settings, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [vapiApiKey, setVapiApiKey] = useState("");
  const [vapiPhoneNumberId, setVapiPhoneNumberId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      settingsApi.get().then((data) => {
        setVapiPhoneNumberId(data.vapiPhoneNumberId ?? "");
      });
    }
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsApi.update({
        vapiApiKey: vapiApiKey.trim() || undefined,
        vapiPhoneNumberId: vapiPhoneNumberId.trim() || undefined,
      });
      toast.success("Settings saved");
      setVapiApiKey("");
    } catch (err) {
      toast.error("Failed to save settings");
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
            <h2 className="font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Vapi Configuration
            </h2>
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
                placeholder="Enter new API key to update"
                hint="Your key is stored securely and never shown"
              />
              <Input
                label="Vapi Phone Number ID"
                type="text"
                value={vapiPhoneNumberId}
                onChange={(e) => setVapiPhoneNumberId(e.target.value)}
                placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save settings"}
              </Button>
            </form>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
