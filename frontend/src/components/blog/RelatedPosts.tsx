import type { BlogPost } from "@/types/blog";
import { BlogCard } from "./BlogCard";

interface RelatedPostsProps {
  posts: BlogPost[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50 mb-6">
        Related articles
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
