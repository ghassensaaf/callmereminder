"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Header } from "@/components/layout";
import { Card } from "@/components/ui";
import { ArrowLeft, Key, Phone, CheckCircle } from "lucide-react";

export default function VapiGuidePage() {
  return (
    <div className="min-h-screen">
      <Header onCreateClick={() => window.location.href = "/"} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to settings
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50">
            How to get your Vapi credentials
          </h1>

          <Card variant="elevated" className="p-6 space-y-6">
            <div>
              <h2 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2 mb-2">
                <Key className="h-4 w-4 text-primary-500" />
                1. Get your API Key
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-surface-600 dark:text-surface-300 text-sm">
                <li>Go to <a href="https://dashboard.vapi.ai" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">dashboard.vapi.ai</a></li>
                <li>Sign up or log in</li>
                <li>Navigate to <strong>Settings</strong> → <strong>API Keys</strong></li>
                <li>Click <strong>Create API Key</strong></li>
                <li>Copy the key (it starts with a long string) and paste it in Settings</li>
              </ol>
            </div>

            <div>
              <h2 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-primary-500" />
                2. Get your Phone Number ID
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-surface-600 dark:text-surface-300 text-sm">
                <li>In the Vapi dashboard, go to <strong>Phone Numbers</strong></li>
                <li>Click <strong>Import</strong> or <strong>Buy</strong> a number</li>
                <li>Vapi offers a free trial number for testing</li>
                <li>After adding a number, copy its <strong>Phone Number ID</strong> (a UUID like <code className="bg-surface-100 dark:bg-surface-800 px-1 rounded">123e4567-e89b-12d3-a456-426614174000</code>)</li>
                <li>Paste it in Settings</li>
              </ol>
            </div>

            <div className="p-4 rounded-lg bg-success-50 dark:bg-success-950/30 border border-success-200 dark:border-success-800">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-success-800 dark:text-success-200">Free tier available</p>
                  <p className="text-success-700 dark:text-success-300 mt-1">
                    Vapi offers a free tier to get started. Check <a href="https://vapi.ai/pricing" target="_blank" rel="noopener noreferrer" className="underline">vapi.ai/pricing</a> for current limits.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
