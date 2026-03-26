import Link from "next/link";

interface Crumb {
  label: string;
  href?: string;
}

interface BlogBreadcrumbsProps {
  items: Crumb[];
}

export function BlogBreadcrumbs({ items }: BlogBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400">
        <li>
          <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            Home
          </Link>
        </li>
        {items.map((crumb, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className="text-surface-300 dark:text-surface-600">/</span>
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-surface-700 dark:text-surface-300 font-medium">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
