import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { BlogFooter } from "@/components/blog/BlogFooter";
import { BlogBreadcrumbs } from "@/components/blog/BlogBreadcrumbs";
import { BlogCard } from "@/components/blog/BlogCard";
import type { BlogTagPostsResponse } from "@/types/blog";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://dialcues.com";

async function getTagPosts(tagSlug: string): Promise<BlogTagPostsResponse | null> {
  try {
    const res = await fetch(`${API}/api/blog/tags/${tagSlug}/posts?page=1&page_size=24`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const data = await getTagPosts(tag);
  if (!data) return { title: "Tag Not Found" };

  return {
    title: `${data.tag.name} Articles`,
    description: `Browse Dialcues blog articles tagged with "${data.tag.name}".`,
    alternates: { canonical: `${SITE}/blog/tag/${data.tag.slug}` },
    openGraph: {
      title: `${data.tag.name} Articles | Dialcues Blog`,
      description: `Browse articles tagged with "${data.tag.name}".`,
    },
  };
}

export default async function BlogTagPage({ params }: Props) {
  const { tag: tagSlug } = await params;
  const data = await getTagPosts(tagSlug);

  if (!data) notFound();

  return (
    <>
      <BlogHeader />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        <BlogBreadcrumbs
          items={[
            { label: "Blog", href: "/blog" },
            { label: data.tag.name },
          ]}
        />

        <h1 className="font-display text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-50 mb-2">
          {data.tag.name}
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mb-10">
          {data.total} {data.total === 1 ? "article" : "articles"}
        </p>

        {data.posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-300 dark:border-surface-700 py-20 text-center">
            <p className="text-surface-500 dark:text-surface-400">No articles in this tag yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
      <BlogFooter />
    </>
  );
}
