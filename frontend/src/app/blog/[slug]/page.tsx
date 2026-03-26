import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { BlogFooter } from "@/components/blog/BlogFooter";
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

  const articleUrl = `${SITE}/blog/${post.slug}`;

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
    mainEntityOfPage: articleUrl,
    keywords: post.tags.map((t) => t.name).join(", "),
  };

  return (
    <>
      <BlogHeader />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-8 pb-4">
        <BlogBreadcrumbs
          items={[
            { label: "Blog", href: "/blog" },
            { label: post.title },
          ]}
        />

        <article>
          {/* Article header */}
          <header className="mb-10 pb-8 border-b border-surface-200/60 dark:border-surface-800/60">
            <div className="flex flex-wrap gap-2 mb-5">
              {post.tags.map((tag) => (
                <BlogTagBadge key={tag.id} name={tag.name} slug={tag.slug} />
              ))}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50 leading-tight">
              {post.title}
            </h1>
            <p className="mt-4 text-lg text-surface-500 dark:text-surface-400 leading-relaxed">
              {post.excerpt}
            </p>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-950/50">
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400">D</span>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-surface-900 dark:text-surface-100">Dialcues</p>
                  <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
                    {publishedDate && <time dateTime={post.publishedAt!}>{publishedDate}</time>}
                    <span className="text-surface-300 dark:text-surface-700">&middot;</span>
                    <span>{post.readingTime} min read</span>
                  </div>
                </div>
              </div>
              {/* Share links */}
              <div className="flex items-center gap-1">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(articleUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  aria-label="Share on Twitter"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  aria-label="Share on LinkedIn"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>
          </header>

          {/* Article body */}
          <BlogPostContent markdown={post.contentMd} />

          {/* Bottom tags */}
          {post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-surface-200/60 dark:border-surface-800/60 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <BlogTagBadge key={tag.id} name={tag.name} slug={tag.slug} />
              ))}
            </div>
          )}

          <BlogCTA />
        </article>

        <RelatedPosts posts={related} />
      </main>
      <BlogFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
