"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Phone } from "lucide-react";

import { Button, ThemeToggle } from "@/components/ui";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onCreateClick?: () => void;
}

export function Header({ onCreateClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-200/50 dark:border-surface-800/50" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow">
                <Phone className="h-5 w-5 text-white" />
              </div>
              {/* Pulse indicator */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500" />
              </span>
            </div>
            <div>
              <span className="font-display font-bold text-lg text-surface-900 dark:text-surface-50">
                CallMe
              </span>
              <span className="hidden sm:inline text-surface-500 dark:text-surface-400 font-medium ml-1">
                Reminder
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/" active>
              Dashboard
            </NavLink>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              onClick={onCreateClick}
              leftIcon={<Plus className="h-4 w-4" />}
              className="hidden sm:inline-flex"
            >
              New Reminder
            </Button>
            <Button
              onClick={onCreateClick}
              size="sm"
              className="sm:hidden"
              leftIcon={<Plus className="h-4 w-4" />}
            >
              New
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}

function NavLink({ href, children, active }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
        active
          ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50"
          : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800"
      )}
    >
      {children}
    </Link>
  );
}
