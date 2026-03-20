"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Settings, LogOut, Menu, X } from "lucide-react";

import { Button, ThemeToggle } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "@/lib/auth-client";

export function Header() {
  const { data: session, isPending } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

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
            <Image
              src="/logo.png"
              alt="Dialcues"
              width={40}
              height={40}
              className="h-9 w-9 sm:h-10 sm:w-10 object-contain flex-shrink-0"
              priority
            />
            <span className="font-display font-bold text-base sm:text-lg text-surface-900 dark:text-surface-50 truncate">
              Dialcues
            </span>
          </Link>

          {/* Desktop Navigation & Actions */}
          <div className="hidden md:flex items-center gap-1">
            {session && (
              <>
                <NavLink href="/dashboard" active={pathname === "/dashboard"}>
                Dashboard
                </NavLink>
                <NavLink href="/history" active={pathname === "/history"}>
                  History
                </NavLink>
              </>
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
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium",
                  pathname === "/dashboard"
                    ? "text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/40"
                    : "text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800"
                )}
              >
                Dashboard
              </Link>
              <Link
                href="/history"
                onClick={closeMobileMenu}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium",
                  pathname === "/history"
                    ? "text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/40"
                    : "text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800"
                )}
              >
                History
              </Link>
              <Link
                href="/settings"
                onClick={closeMobileMenu}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium",
                  pathname === "/settings"
                    ? "text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/40"
                    : "text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800"
                )}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
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
  active: boolean;
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
