import Link from "next/link";

interface BlogTagBadgeProps {
  name: string;
  slug: string;
  interactive?: boolean;
}

export function BlogTagBadge({ name, slug, interactive = true }: BlogTagBadgeProps) {
  const classes =
    "inline-block rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 px-3 py-1 text-xs font-medium tracking-wide transition-colors hover:bg-primary-100 dark:hover:bg-primary-900/50";

  if (!interactive) {
    return <span className={classes}>{name}</span>;
  }

  return (
    <Link href={`/blog/tag/${slug}`} className={classes}>
      {name}
    </Link>
  );
}
