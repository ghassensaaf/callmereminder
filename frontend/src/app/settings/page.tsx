"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Settings, Phone, Building2, Sparkles, FileText } from "lucide-react";

import { Header } from "@/components/layout";
import { AuthGuard } from "@/components/auth-guard";
import {
  VapiConfigSection,
  TemplatesSection,
  PromptSettingsSection,
  OrganizationSection,
} from "@/components/settings";
import { Button } from "@/components/ui";

type SettingsTab = "vapi" | "organization" | "prompt" | "templates";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("vapi");

  return (
    <AuthGuard>
      <div className="min-h-screen">
        <Header />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 mb-6"
          >
            ← Back to dashboard
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
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
                  Configure your account and preferences
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={activeTab === "vapi" ? "primary" : "outline"}
                leftIcon={<Phone className="h-4 w-4" />}
                onClick={() => setActiveTab("vapi")}
              >
                Vapi
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeTab === "organization" ? "primary" : "outline"}
                leftIcon={<Building2 className="h-4 w-4" />}
                onClick={() => setActiveTab("organization")}
              >
                Organization
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeTab === "prompt" ? "primary" : "outline"}
                leftIcon={<Sparkles className="h-4 w-4" />}
                onClick={() => setActiveTab("prompt")}
              >
                Prompt
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeTab === "templates" ? "primary" : "outline"}
                leftIcon={<FileText className="h-4 w-4" />}
                onClick={() => setActiveTab("templates")}
              >
                Templates
              </Button>
            </div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "vapi" && <VapiConfigSection />}
              {activeTab === "organization" && <OrganizationSection />}
              {activeTab === "prompt" && <PromptSettingsSection />}
              {activeTab === "templates" && <TemplatesSection />}
            </motion.div>
          </motion.div>
        </main>
      </div>
    </AuthGuard>
  );
}
