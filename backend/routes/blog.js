import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requirePlatformAdmin } from "../middleware/platform-admin.js";
import { generateBlogDraft } from "../lib/ai/blog-generator.js";

const router = Router();

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 280);
}

// ─── Public endpoints ────────────────────────────────────────────────────────

router.get("/posts", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.page_size) || 12));
    const skip = (page - 1) * pageSize;

    const where = { status: "PUBLISHED" };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip,
        take: pageSize,
        include: { tags: { include: { tag: true } } },
      }),
      prisma.blogPost.count({ where }),
    ]);

    res.json({
      posts: posts.map(formatPost),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error("GET /blog/posts error:", err);
    res.status(500).json({ detail: err.message });
  }
});

router.get("/posts/slug/:slug", async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: req.params.slug },
      include: { tags: { include: { tag: true } } },
    });

    if (!post || post.status !== "PUBLISHED") {
      return res.status(404).json({ detail: "Post not found" });
    }

    res.json(formatPost(post));
  } catch (err) {
    console.error("GET /blog/posts/slug error:", err);
    res.status(500).json({ detail: err.message });
  }
});

router.get("/posts/slug/:slug/related", async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: req.params.slug },
      include: { tags: { include: { tag: true } } },
    });

    if (!post || post.status !== "PUBLISHED") {
      return res.status(404).json({ detail: "Post not found" });
    }

    const tagIds = post.tags.map((pt) => pt.tagId);

    const related = await prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        id: { not: post.id },
        tags: tagIds.length > 0 ? { some: { tagId: { in: tagIds } } } : undefined,
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
      include: { tags: { include: { tag: true } } },
    });

    res.json(related.map(formatPost));
  } catch (err) {
    console.error("GET /blog/posts/related error:", err);
    res.status(500).json({ detail: err.message });
  }
});

router.get("/tags", async (_req, res) => {
  try {
    const tags = await prisma.blogTag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { posts: true } } },
    });
    res.json(tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug, postCount: t._count.posts })));
  } catch (err) {
    console.error("GET /blog/tags error:", err);
    res.status(500).json({ detail: err.message });
  }
});

router.get("/tags/:slug/posts", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.page_size) || 12));
    const skip = (page - 1) * pageSize;

    const tag = await prisma.blogTag.findUnique({ where: { slug: req.params.slug } });
    if (!tag) return res.status(404).json({ detail: "Tag not found" });

    const where = { status: "PUBLISHED", tags: { some: { tagId: tag.id } } };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip,
        take: pageSize,
        include: { tags: { include: { tag: true } } },
      }),
      prisma.blogPost.count({ where }),
    ]);

    res.json({
      tag: { id: tag.id, name: tag.name, slug: tag.slug },
      posts: posts.map(formatPost),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error("GET /blog/tags/:slug/posts error:", err);
    res.status(500).json({ detail: err.message });
  }
});

// ─── Admin endpoints ─────────────────────────────────────────────────────────

router.get("/admin/posts", requireAuth, requirePlatformAdmin, async (req, res) => {
  try {
    const status = req.query.status; // DRAFT | PUBLISHED | undefined (all)
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.page_size) || 20));
    const skip = (page - 1) * pageSize;

    const where = status ? { status } : {};

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: { tags: { include: { tag: true } }, topic: true },
      }),
      prisma.blogPost.count({ where }),
    ]);

    res.json({
      posts: posts.map(formatPost),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error("GET /blog/admin/posts error:", err);
    res.status(500).json({ detail: err.message });
  }
});

router.get("/admin/posts/:id", requireAuth, requirePlatformAdmin, async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: req.params.id },
      include: { tags: { include: { tag: true } }, topic: true },
    });
    if (!post) return res.status(404).json({ detail: "Post not found" });
    res.json(formatPost(post));
  } catch (err) {
    console.error("GET /blog/admin/posts/:id error:", err);
    res.status(500).json({ detail: err.message });
  }
});

router.put("/admin/posts/:id", requireAuth, requirePlatformAdmin, async (req, res) => {
  try {
    const { title, slug, excerpt, contentMd, metaTitle, metaDescription, targetKeyword, tags } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slugify(slug);
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (contentMd !== undefined) {
      updateData.contentMd = contentMd;
      updateData.readingTime = Math.max(1, Math.ceil(contentMd.split(/\s+/).length / 230));
    }
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (targetKeyword !== undefined) updateData.targetKeyword = targetKeyword;

    const post = await prisma.blogPost.update({
      where: { id: req.params.id },
      data: updateData,
      include: { tags: { include: { tag: true } } },
    });

    if (Array.isArray(tags)) {
      await syncTags(post.id, tags);
    }

    const updated = await prisma.blogPost.findUnique({
      where: { id: post.id },
      include: { tags: { include: { tag: true } }, topic: true },
    });
    res.json(formatPost(updated));
  } catch (err) {
    console.error("PUT /blog/admin/posts/:id error:", err);
    res.status(500).json({ detail: err.message });
  }
});

router.post("/admin/posts/:id/publish", requireAuth, requirePlatformAdmin, async (req, res) => {
  try {
    const post = await prisma.blogPost.update({
      where: { id: req.params.id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
      include: { tags: { include: { tag: true } } },
    });
    res.json(formatPost(post));
  } catch (err) {
    console.error("POST /blog/admin/posts/:id/publish error:", err);
    res.status(500).json({ detail: err.message });
  }
});

router.post("/admin/posts/:id/unpublish", requireAuth, requirePlatformAdmin, async (req, res) => {
  try {
    const post = await prisma.blogPost.update({
      where: { id: req.params.id },
      data: { status: "DRAFT", publishedAt: null },
      include: { tags: { include: { tag: true } } },
    });
    res.json(formatPost(post));
  } catch (err) {
    console.error("POST /blog/admin/posts/:id/unpublish error:", err);
    res.status(500).json({ detail: err.message });
  }
});

router.delete("/admin/posts/:id", requireAuth, requirePlatformAdmin, async (req, res) => {
  try {
    await prisma.blogPost.delete({ where: { id: req.params.id } });
    res.json({ detail: "Post deleted" });
  } catch (err) {
    console.error("DELETE /blog/admin/posts/:id error:", err);
    res.status(500).json({ detail: err.message });
  }
});

// ─── Topics ──────────────────────────────────────────────────────────────────

router.get("/admin/topics", requireAuth, requirePlatformAdmin, async (req, res) => {
  try {
    const status = req.query.status;
    const where = status ? { status } : {};
    const topics = await prisma.blogTopic.findMany({
      where,
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { posts: true, logs: true } } },
    });
    res.json(topics);
  } catch (err) {
    console.error("GET /blog/admin/topics error:", err);
    res.status(500).json({ detail: err.message });
  }
});

router.post("/admin/topics", requireAuth, requirePlatformAdmin, async (req, res) => {
  try {
    const { keyword, audience, searchIntent, priority } = req.body;
    if (!keyword) return res.status(400).json({ detail: "keyword is required" });

    const topic = await prisma.blogTopic.create({
      data: { keyword, audience, searchIntent, priority: priority || 5 },
    });
    res.status(201).json(topic);
  } catch (err) {
    console.error("POST /blog/admin/topics error:", err);
    res.status(500).json({ detail: err.message });
  }
});

// ─── Generation ──────────────────────────────────────────────────────────────

router.post("/admin/generate/:topicId", requireAuth, requirePlatformAdmin, async (req, res) => {
  try {
    const topic = await prisma.blogTopic.findUnique({ where: { id: req.params.topicId } });
    if (!topic) return res.status(404).json({ detail: "Topic not found" });

    const result = await generateAndSave(topic);
    res.json(result);
  } catch (err) {
    console.error("POST /blog/admin/generate error:", err);
    res.status(500).json({ detail: err.message });
  }
});

router.post("/admin/posts/:id/regenerate-meta", requireAuth, requirePlatformAdmin, async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ detail: "Post not found" });

    const provider = (await import("../lib/ai/provider.js")).getAiProvider();
    const result = await provider.generate({
      systemPrompt: `You are an SEO expert. Given a blog article, generate optimized metadata. Return ONLY valid JSON: { "metaTitle": "string (max 60 chars)", "metaDescription": "string (max 155 chars)", "excerpt": "string (max 200 chars)" }`,
      userPrompt: `Article title: ${post.title}\nTarget keyword: ${post.targetKeyword}\n\nArticle content (first 500 words):\n${post.contentMd.slice(0, 2500)}`,
      temperature: 0.4,
      maxTokens: 500,
    });

    const cleaned = result.text.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
    const meta = JSON.parse(cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1));

    const updated = await prisma.blogPost.update({
      where: { id: post.id },
      data: {
        metaTitle: meta.metaTitle?.slice(0, 200) || post.metaTitle,
        metaDescription: meta.metaDescription?.slice(0, 500) || post.metaDescription,
        excerpt: meta.excerpt?.slice(0, 500) || post.excerpt,
      },
      include: { tags: { include: { tag: true } } },
    });

    res.json(formatPost(updated));
  } catch (err) {
    console.error("POST /blog/admin/posts/:id/regenerate-meta error:", err);
    res.status(500).json({ detail: err.message });
  }
});

// ─── Cron endpoint ───────────────────────────────────────────────────────────

router.post("/cron/generate-daily", async (req, res) => {
  try {
    const secret = process.env.BLOG_CRON_SECRET;
    const provided = req.headers["x-cron-secret"] || req.query.secret;
    if (!secret || provided !== secret) {
      return res.status(401).json({ detail: "Invalid cron secret" });
    }

    if (process.env.BLOG_AUTO_GENERATION_ENABLED !== "true") {
      return res.json({ detail: "Auto-generation is disabled", generated: false });
    }

    const topic = await prisma.blogTopic.findFirst({
      where: { status: "PENDING" },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    });

    if (!topic) {
      return res.json({ detail: "No pending topics", generated: false });
    }

    const result = await generateAndSave(topic);
    res.json(result);
  } catch (err) {
    console.error("POST /blog/cron/generate-daily error:", err);
    res.status(500).json({ detail: err.message });
  }
});

// ─── Generation logs ─────────────────────────────────────────────────────────

router.get("/admin/logs", requireAuth, requirePlatformAdmin, async (req, res) => {
  try {
    const logs = await prisma.blogGenerationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { topic: { select: { keyword: true } } },
    });
    res.json(logs);
  } catch (err) {
    console.error("GET /blog/admin/logs error:", err);
    res.status(500).json({ detail: err.message });
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function generateAndSave(topic) {
  const result = await generateBlogDraft(topic);

  await prisma.blogGenerationLog.create({
    data: {
      topicId: topic.id,
      provider: result.provider,
      model: result.model,
      success: result.success,
      error: result.error || null,
    },
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const draft = result.draft;

  let slug = draft.slug;
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const post = await prisma.blogPost.create({
    data: {
      title: draft.title,
      slug,
      excerpt: draft.excerpt,
      contentMd: draft.contentMd,
      metaTitle: draft.metaTitle,
      metaDescription: draft.metaDescription,
      targetKeyword: draft.targetKeyword,
      readingTime: draft.readingTime,
      status: process.env.BLOG_AUTO_PUBLISH === "true" ? "PUBLISHED" : "DRAFT",
      publishedAt: process.env.BLOG_AUTO_PUBLISH === "true" ? new Date() : null,
      topicId: topic.id,
    },
  });

  await syncTags(post.id, draft.tags);

  await prisma.blogTopic.update({
    where: { id: topic.id },
    data: { status: "GENERATED", lastGeneratedAt: new Date() },
  });

  const final = await prisma.blogPost.findUnique({
    where: { id: post.id },
    include: { tags: { include: { tag: true } } },
  });

  return { success: true, post: formatPost(final) };
}

async function syncTags(postId, tagNames) {
  await prisma.blogPostTag.deleteMany({ where: { postId } });

  for (const name of tagNames) {
    const tagSlug = slugify(name);
    if (!tagSlug) continue;

    const tag = await prisma.blogTag.upsert({
      where: { slug: tagSlug },
      create: { name, slug: tagSlug },
      update: {},
    });

    await prisma.blogPostTag.create({
      data: { postId, tagId: tag.id },
    }).catch(() => {});
  }
}

function formatPost(post) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    contentMd: post.contentMd,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    targetKeyword: post.targetKeyword,
    status: post.status,
    readingTime: post.readingTime,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    topicId: post.topicId ?? null,
    topic: post.topic ?? null,
    tags: post.tags?.map((pt) => ({ id: pt.tag.id, name: pt.tag.name, slug: pt.tag.slug })) ?? [],
  };
}

export default router;
