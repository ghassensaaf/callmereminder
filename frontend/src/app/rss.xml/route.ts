const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://dialcues.com";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  let posts: Array<{
    title: string;
    slug: string;
    excerpt: string;
    publishedAt: string;
  }> = [];

  try {
    const res = await fetch(`${API}/api/blog/posts?page=1&page_size=50`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      posts = data.posts || [];
    }
  } catch {}

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${post.slug}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Dialcues Blog</title>
    <link>${SITE}/blog</link>
    <description>Tips, guides, and insights on AI-powered phone call reminders from Dialcues.</description>
    <language>en-us</language>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
}
