import Link from "next/link";
import Image from "next/image";

export function BlogHeader() {
  return (
    <header className="sticky top-0 z-50">
      <div className="absolute inset-0 bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-200/50 dark:border-surface-800/50" />
      <div className="relative mx-auto flex h-14 sm:h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <Image
            src="/logo.png"
            alt="Dialcues"
            width={36}
            height={36}
            className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
          />
          <span className="font-display font-bold text-base sm:text-lg text-surface-900 dark:text-surface-50">
            Dialcues
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 text-sm font-medium">
          <Link
            href="/blog"
            className="px-3 py-1.5 rounded-lg text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            Blog
          </Link>
          <Link
            href="/docs/api"
            className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            Docs
          </Link>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-lg text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="ml-1 rounded-xl bg-primary-600 px-4 py-1.5 text-white text-sm font-semibold shadow-sm shadow-primary-500/25 hover:bg-primary-700 hover:shadow-md hover:shadow-primary-500/30 transition-all"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
