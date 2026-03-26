import type { MetadataRoute } from "next";
import { seoLandingPages } from "@/lib/seo-landing-pages";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dialcues.com";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface BlogSitemapPost {
  slug: string;
  updatedAt: string;
  tags: { slug: string }[];
}

async function getPublishedPosts(): Promise<BlogSitemapPost[]> {
  try {
    const res = await fetch(`${API}/api/blog/posts?page=1&page_size=200`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.posts || [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();

  const tagSlugs = [...new Set(posts.flatMap((p: BlogSitemapPost) => p.tags.map((t) => t.slug)))];

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/docs/vapi`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const seoPages: MetadataRoute.Sitemap = seoLandingPages.map((page) => ({
    url: `${siteUrl}/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const blogPosts: MetadataRoute.Sitemap = posts.map((post: BlogSitemapPost) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const blogTags: MetadataRoute.Sitemap = tagSlugs.map((slug) => ({
    url: `${siteUrl}/blog/tag/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...seoPages, ...blogPosts, ...blogTags];
}
