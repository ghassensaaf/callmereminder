import Link from "next/link";

export function BlogHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-surface-200/80 dark:border-surface-800/80 bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-surface-900 dark:text-surface-50">
          <span className="text-primary-600">Dialcues</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-surface-600 dark:text-surface-400">
          <Link href="/blog" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            Blog
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-primary-600 px-4 py-1.5 text-white text-sm font-semibold shadow-sm hover:bg-primary-700 transition-colors"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
