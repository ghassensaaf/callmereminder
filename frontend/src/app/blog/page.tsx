import type { Metadata } from "next";
import Link from "next/link";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { BlogFooter } from "@/components/blog/BlogFooter";
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

  const featuredPost = data.posts[0] ?? null;
  const restPosts = data.posts.slice(1);
  const activeTags = tags.filter((t) => t.postCount > 0);

  return (
    <>
      <BlogHeader />
      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Hero section */}
        <section className="pt-12 pb-10 sm:pt-16 sm:pb-12 border-b border-surface-200/60 dark:border-surface-800/60 mb-10">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50 sm:text-5xl">
              Blog
            </h1>
            <p className="mt-4 text-lg text-surface-500 dark:text-surface-400 leading-relaxed">
              Practical advice on reminders, productivity, and how AI-powered phone
              calls help you stay on track.
            </p>
          </div>

          {activeTags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/blog"
                className="inline-block rounded-full bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 px-3.5 py-1 text-xs font-medium tracking-wide"
              >
                All
              </Link>
              {activeTags.map((tag) => (
                <BlogTagBadge key={tag.id} name={tag.name} slug={tag.slug} />
              ))}
            </div>
          )}
        </section>

        {data.posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-300 dark:border-surface-700 py-24 text-center mb-20">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 mb-4">
              <svg className="h-6 w-6 text-surface-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="text-surface-500 dark:text-surface-400 font-medium">
              No articles yet
            </p>
            <p className="mt-1 text-sm text-surface-400 dark:text-surface-500">
              We&apos;re working on great content. Check back soon!
            </p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featuredPost && (
              <section className="mb-10">
                <BlogCard post={featuredPost} featured />
              </section>
            )}

            {/* Grid of remaining posts */}
            {restPosts.length > 0 && (
              <section className="mb-16">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {restPosts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <BlogFooter />
    </>
  );
}
