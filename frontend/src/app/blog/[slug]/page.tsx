import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { BlogBreadcrumbs } from "@/components/blog/BlogBreadcrumbs";
import { BlogPostContent } from "@/components/blog/BlogPostContent";
import { BlogTagBadge } from "@/components/blog/BlogTagBadge";
import { BlogCTA } from "@/components/blog/BlogCTA";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import type { BlogPost } from "@/types/blog";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://dialcues.com";

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${API}/api/blog/posts/slug/${slug}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getRelated(slug: string): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API}/api/blog/posts/slug/${slug}/related`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post Not Found" };

  const canonical = `${SITE}/blog/${post.slug}`;

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    alternates: { canonical },
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      url: canonical,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      tags: post.tags.map((t) => t.name),
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [post, related] = await Promise.all([getPost(slug), getRelated(slug)]);

  if (!post) notFound();

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: "Dialcues" },
    publisher: {
      "@type": "Organization",
      name: "Dialcues",
      url: SITE,
    },
    mainEntityOfPage: `${SITE}/blog/${post.slug}`,
    keywords: post.tags.map((t) => t.name).join(", "),
  };

  return (
    <>
      <BlogHeader />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <BlogBreadcrumbs
          items={[
            { label: "Blog", href: "/blog" },
            { label: post.title },
          ]}
        />

        <article>
          <header className="mb-10">
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <BlogTagBadge key={tag.id} name={tag.name} slug={tag.slug} />
              ))}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50 leading-tight">
              {post.title}
            </h1>
            <div className="mt-4 flex items-center gap-3 text-sm text-surface-500 dark:text-surface-400">
              {publishedDate && <time dateTime={post.publishedAt!}>{publishedDate}</time>}
              <span className="text-surface-300 dark:text-surface-700">&middot;</span>
              <span>{post.readingTime} min read</span>
            </div>
          </header>

          <BlogPostContent markdown={post.contentMd} />
          <BlogCTA />
        </article>

        <RelatedPosts posts={related} />
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
