import type { Metadata } from "next";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogTagBadge } from "@/components/blog/BlogTagBadge";
import type { BlogPostListResponse, BlogTag } from "@/types/blog";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Tips, guides, and insights on phone call reminders, AI voice assistants, and how Dialcues helps you never miss a moment.",
  openGraph: {
    title: "Dialcues Blog",
    description: "Tips and guides on AI-powered phone call reminders.",
  },
};

async function getPosts(): Promise<BlogPostListResponse> {
  try {
    const res = await fetch(`${API}/api/blog/posts?page=1&page_size=24`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return { posts: [], total: 0, page: 1, pageSize: 24, totalPages: 0 };
    return res.json();
  } catch {
    return { posts: [], total: 0, page: 1, pageSize: 24, totalPages: 0 };
  }
}

async function getTags(): Promise<(BlogTag & { postCount: number })[]> {
  try {
    const res = await fetch(`${API}/api/blog/tags`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function BlogIndexPage() {
  const [data, tags] = await Promise.all([getPosts(), getTags()]);

  return (
    <>
      <BlogHeader />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
        <section className="mb-12">
          <h1 className="font-display text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50 sm:text-5xl">
            Blog
          </h1>
          <p className="mt-3 text-lg text-surface-600 dark:text-surface-400 max-w-xl leading-relaxed">
            Practical advice on reminders, productivity, and how AI-powered phone calls
            help you stay on track.
          </p>
        </section>

        {tags.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-2">
            {tags
              .filter((t) => t.postCount > 0)
              .map((tag) => (
                <BlogTagBadge key={tag.id} name={tag.name} slug={tag.slug} />
              ))}
          </div>
        )}

        {data.posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-300 dark:border-surface-700 py-20 text-center">
            <p className="text-surface-500 dark:text-surface-400">
              No articles yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {data.posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
