import Link from "next/link";
import type { BlogPost } from "@/types/blog";
import { BlogTagBadge } from "./BlogTagBadge";

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  if (featured) {
    return (
      <article className="group relative rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900/50 overflow-hidden transition-all hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-xl hover:shadow-primary-500/5">
        <Link href={`/blog/${post.slug}`} className="block p-8 sm:p-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <BlogTagBadge key={tag.id} name={tag.name} slug={tag.slug} interactive={false} />
            ))}
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-50 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {post.title}
          </h2>
          <p className="mt-3 text-base text-surface-600 dark:text-surface-400 leading-relaxed line-clamp-3 max-w-2xl">
            {post.excerpt}
          </p>
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-surface-500 dark:text-surface-400">
              {date && <time dateTime={post.publishedAt!}>{date}</time>}
              <span className="text-surface-300 dark:text-surface-700">&middot;</span>
              <span>{post.readingTime} min read</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 group-hover:gap-2.5 transition-all">
              Read article
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group relative flex flex-col rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900/50 overflow-hidden transition-all hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg hover:shadow-primary-500/5">
      <Link href={`/blog/${post.slug}`} className="flex flex-col h-full p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.slice(0, 2).map((tag) => (
            <BlogTagBadge key={tag.id} name={tag.name} slug={tag.slug} interactive={false} />
          ))}
        </div>

        <h2 className="font-display text-lg font-semibold text-surface-900 dark:text-surface-50 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
          {post.title}
        </h2>

        <p className="mt-2 text-sm text-surface-600 dark:text-surface-400 leading-relaxed line-clamp-2 flex-1">
          {post.excerpt}
        </p>

        <div className="mt-5 flex items-center justify-between pt-4 border-t border-surface-100 dark:border-surface-800/60">
          <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-500">
            {date && <time dateTime={post.publishedAt!}>{date}</time>}
            <span className="text-surface-300 dark:text-surface-700">&middot;</span>
            <span>{post.readingTime} min</span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Read
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </Link>
    </article>
  );
}
