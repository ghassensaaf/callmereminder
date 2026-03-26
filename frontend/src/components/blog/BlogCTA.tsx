import Link from "next/link";

export function BlogCTA() {
  return (
    <aside className="my-14 relative overflow-hidden rounded-2xl border border-primary-200 dark:border-primary-900 bg-gradient-to-br from-primary-50 via-white to-primary-50/50 dark:from-primary-950/40 dark:via-surface-900 dark:to-primary-950/20 p-8 sm:p-10">
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary-200/30 dark:bg-primary-800/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary-100/40 dark:bg-primary-900/10 rounded-full blur-2xl" />
      <div className="relative text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 mb-4">
          <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
          </svg>
        </div>
        <h3 className="font-display text-xl font-bold text-surface-900 dark:text-surface-50">
          Never miss an important moment again
        </h3>
        <p className="mt-2 text-sm text-surface-600 dark:text-surface-400 max-w-md mx-auto leading-relaxed">
          Dialcues sends AI-powered voice phone calls to remind you of what matters.
          No more ignored notifications — get called when it counts.
        </p>
        <Link
          href="/signup"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/25 transition-all hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/30 hover:gap-3"
        >
          Try Dialcues free
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </aside>
  );
}
