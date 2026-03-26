import Link from "next/link";

export function BlogFooter() {
  return (
    <footer className="border-t border-surface-200 dark:border-surface-800 mt-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-surface-900 dark:text-surface-50">
              Dialcues
            </span>
            <span className="text-surface-400 dark:text-surface-500 text-sm">
              &middot; Never miss a moment
            </span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-surface-500 dark:text-surface-400">
            <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Home
            </Link>
            <Link href="/blog" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Blog
            </Link>
            <Link href="/docs/api" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Docs
            </Link>
            <Link href="/signup" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Sign up
            </Link>
            <Link href="/rss.xml" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              RSS
            </Link>
          </nav>
        </div>
        <p className="mt-6 text-center text-xs text-surface-400 dark:text-surface-600">
          &copy; {new Date().getFullYear()} Dialcues. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
