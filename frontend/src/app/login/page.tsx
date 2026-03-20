"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button, Input, Card } from "@/components/ui";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Please enter your email address")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Please enter your password"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const [apiError, setApiError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  async function onSubmit(data: LoginFormData) {
    setApiError("");
    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: redirectTo,
      });
      if (result.error) {
        setApiError(result.error.message || "Invalid email or password");
        return;
      }
      window.location.href = redirectTo;
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
            Welcome back
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mb-6">
            Sign in to manage your reminders
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {apiError && (
              <div className="p-3 rounded-lg bg-danger-50 dark:bg-danger-950/30 text-danger-700 dark:text-danger-300 text-sm">
                {apiError}
              </div>
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-surface-500 dark:text-surface-400">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="animate-pulse text-surface-500">Loading...</div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
