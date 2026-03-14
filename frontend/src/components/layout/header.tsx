"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Phone, Settings, LogOut, Menu, X } from "lucide-react";

import { Button, ThemeToggle } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "@/lib/auth-client";

interface HeaderProps {
  onCreateClick?: () => void;
}

export function Header({ onCreateClick }: HeaderProps) {
  const { data: session, isPending } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleCreateClick = () => {
    closeMobileMenu();
    onCreateClick?.();
  };

  const handleSignOut = () => {
    signOut({
      fetchOptions: {
        onSuccess: () => window.location.assign("/login"),
      },
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-200/50 dark:border-surface-800/50" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link
            href={session ? "/dashboard" : "/"}
            className="flex items-center gap-2 sm:gap-3 group min-w-0"
            onClick={closeMobileMenu}
          >
            <div className="relative flex-shrink-0">
              <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-primary-500" />
              </span>
            </div>
            <div className="min-w-0">
              <span className="font-display font-bold text-base sm:text-lg text-surface-900 dark:text-surface-50 truncate">
                CallMe
              </span>
              <span className="hidden sm:inline text-surface-500 dark:text-surface-400 font-medium ml-1">
                Reminder
              </span>
            </div>
          </Link>

          {/* Desktop Navigation & Actions */}
          <div className="hidden md:flex items-center gap-1">
            {session && (
              <NavLink href="/dashboard" active>
                Dashboard
              </NavLink>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {!isPending && (
              <>
                {/* Desktop actions */}
                <div className="hidden md:flex items-center gap-1">
                  {session ? (
                    <>
                      <Link href="/settings">
                        <Button variant="ghost" size="sm" leftIcon={<Settings className="h-4 w-4" />}>
                          Settings
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<LogOut className="h-4 w-4" />}
                        onClick={handleSignOut}
                      >
                        Sign out
                      </Button>
                      {onCreateClick && (
                        <Button onClick={onCreateClick} leftIcon={<Plus className="h-4 w-4" />}>
                          New Reminder
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Link href="/login">
                        <Button variant="ghost" size="sm">Sign in</Button>
                      </Link>
                      <Link href="/signup">
                        <Button size="sm">Sign up</Button>
                      </Link>
                    </>
                  )}
                </div>

                {/* Mobile menu button */}
                <button
                  type="button"
                  className="md:hidden p-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100 transition-colors"
                  aria-label="Toggle menu"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden fixed inset-0 top-14 sm:top-16 z-30 bg-white dark:bg-surface-950 transition-opacity duration-200",
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <nav className="flex flex-col p-4 gap-1 border-t border-surface-200 dark:border-surface-800 overflow-y-auto">
          {session ? (
            <>
              <Link
                href="/dashboard"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/settings"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 font-medium"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              {onCreateClick && (
                <button
                  onClick={handleCreateClick}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-left text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 font-medium w-full"
                >
                  <Plus className="h-4 w-4" />
                  New Reminder
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/30 font-medium w-full"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={closeMobileMenu}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={closeMobileMenu}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium hover:from-primary-700 hover:to-primary-600"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
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
