"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signUp } from "@/lib/auth-client";
import Image from "next/image";
import { Button, Input, Card } from "@/components/ui";

const signupSchema = z.object({
  name: z
    .string()
    .min(1, "Please enter your name")
    .max(100, "Name must be 100 characters or less"),
  email: z
    .string()
    .min(1, "Please enter your email address")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or less"),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [apiError, setApiError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
  });

  async function onSubmit(data: SignupFormData) {
    setApiError("");
    try {
      const result = await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        callbackURL: "/dashboard",
      });
      if (result.error) {
        setApiError(result.error.message || "Invalid input. Please check your details.");
        return;
      }
      window.location.href = "/dashboard";
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
            Create account
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mb-6">
            Get started with voice call reminders
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {apiError && (
              <div className="p-3 rounded-lg bg-danger-50 dark:bg-danger-950/30 text-danger-700 dark:text-danger-300 text-sm">
                {apiError}
              </div>
            )}
            <Input
              label="Name"
              type="text"
              placeholder="Your name"
              autoComplete="name"
              error={errors.name?.message}
              {...register("name")}
            />
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
              autoComplete="new-password"
              hint="At least 8 characters"
              error={errors.password?.message}
              {...register("password")}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-500 dark:text-surface-400">
            Already have an account?{" "}
            <Link href="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
