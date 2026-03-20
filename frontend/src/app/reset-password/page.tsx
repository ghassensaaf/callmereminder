"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { Button, Input, Card } from "@/components/ui";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be 128 characters or less"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const isInvalid = error === "INVALID_TOKEN" || !token;

  async function onSubmit(data: FormData) {
    if (!token) return;
    setApiError("");
    try {
      const result = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });
      if (result.error) {
        setApiError(result.error.message || "Failed to reset password. The link may have expired.");
        return;
      }
      setDone(true);
    } catch {
      setApiError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link href="/" className="flex items-center gap-3 justify-center mb-8 group">
          <Image
            src="/logo.png"
            alt="Dialcues"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
            priority
          />
          <span className="font-display font-bold text-xl text-surface-900 dark:text-surface-50">
            Dialcues
          </span>
        </Link>

        <Card variant="elevated" className="p-8">
          <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50 mb-2">
            {isInvalid ? "Invalid link" : done ? "Password reset" : "Choose a new password"}
          </h1>

          {isInvalid ? (
            <div className="space-y-4">
              <p className="text-surface-500 dark:text-surface-400 text-sm">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link href="/forgot-password">
                <Button className="w-full">Request new link</Button>
              </Link>
            </div>
          ) : done ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-300 text-sm">
                Your password has been updated. You can now sign in with your new password.
              </div>
              <Link href="/login">
                <Button className="w-full">Sign in</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {apiError && (
                <div className="p-3 rounded-lg bg-danger-50 dark:bg-danger-950/30 text-danger-700 dark:text-danger-300 text-sm">
                  {apiError}
                </div>
              )}
              <Input
                label="New password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                hint="At least 8 characters"
                error={errors.password?.message}
                {...register("password")}
              />
              <Input
                label="Confirm password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                error={errors.confirm?.message}
                {...register("confirm")}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Resetting..." : "Reset password"}
              </Button>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
