"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, CheckCircle, AlertCircle, Bell, Timer } from "lucide-react";
import { motion } from "framer-motion";

import { remindersApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  delay?: number;
}

function StatCard({ label, value, icon, color, bgColor, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-5",
        "bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800",
        "shadow-sm hover:shadow-md dark:shadow-black/20 transition-shadow duration-300"
      )}
    >
      {/* Background decoration */}
      <div
        className={cn(
          "absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-60 dark:opacity-30",
          bgColor
        )}
      />

      <div className="relative flex items-center gap-4">
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl",
            bgColor
          )}
        >
          <div className={color}>{icon}</div>
        </div>
        <div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{value}</p>
          <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl p-5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => remindersApi.stats(),
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total"
        value={stats.total}
        icon={<Bell className="h-5 w-5" />}
        color="text-surface-600 dark:text-surface-300"
        bgColor="bg-surface-100 dark:bg-surface-800"
        delay={0}
      />
      <StatCard
        label="Scheduled"
        value={stats.scheduled}
        icon={<Clock className="h-5 w-5" />}
        color="text-primary-600 dark:text-primary-400"
        bgColor="bg-primary-50 dark:bg-primary-950/50"
        delay={0.1}
      />
      <StatCard
        label="Completed"
        value={stats.completed}
        icon={<CheckCircle className="h-5 w-5" />}
        color="text-success-600 dark:text-success-500"
        bgColor="bg-success-50 dark:bg-success-500/10"
        delay={0.2}
      />
      <StatCard
        label="Failed"
        value={stats.failed}
        icon={<AlertCircle className="h-5 w-5" />}
        color="text-danger-600 dark:text-danger-500"
        bgColor="bg-danger-50 dark:bg-danger-500/10"
        delay={0.3}
      />
    </div>
  );
}
