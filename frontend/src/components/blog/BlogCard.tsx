import Link from "next/link";
import type { BlogPost } from "@/types/blog";
import { BlogTagBadge } from "./BlogTagBadge";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <article className="group relative flex flex-col rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900/50 p-6 transition-all hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg hover:shadow-primary-500/5">
      <div className="flex flex-wrap gap-2 mb-3">
        {post.tags.slice(0, 3).map((tag) => (
          <BlogTagBadge key={tag.id} name={tag.name} slug={tag.slug} />
        ))}
      </div>

      <Link href={`/blog/${post.slug}`} className="block">
        <h2 className="font-display text-lg font-semibold text-surface-900 dark:text-surface-50 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
          {post.title}
        </h2>
      </Link>

      <p className="mt-2 text-sm text-surface-600 dark:text-surface-400 leading-relaxed line-clamp-3 flex-1">
        {post.excerpt}
      </p>

      <div className="mt-4 flex items-center justify-between text-xs text-surface-500 dark:text-surface-500">
        {date && <time dateTime={post.publishedAt!}>{date}</time>}
        <span>{post.readingTime} min read</span>
      </div>
    </article>
  );
}
