import Link from "next/link";

export function BlogCTA() {
  return (
    <aside className="my-12 rounded-2xl border border-primary-200 dark:border-primary-900 bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-950/40 dark:to-primary-900/20 p-8 text-center">
      <h3 className="font-display text-xl font-bold text-surface-900 dark:text-surface-50">
        Never miss an important moment again
      </h3>
      <p className="mt-2 text-sm text-surface-600 dark:text-surface-400 max-w-md mx-auto leading-relaxed">
        Dialcues sends AI-powered voice phone calls to remind you of what matters.
        No more ignored notifications.
      </p>
      <Link
        href="/signup"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md"
      >
        Try Dialcues free
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </aside>
  );
}
