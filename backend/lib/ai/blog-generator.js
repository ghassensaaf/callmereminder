import { getAiProvider } from "./provider.js";

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 280);
}

function estimateReadingTime(markdown) {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 230));
}

function countH2Sections(md) {
  return (md.match(/^#{2,3}\s+/gm) || []).length;
}

function hasRepetitiveContent(md) {
  const sentences = md
    .split(/[.!?]\s+/)
    .map((s) => s.trim().toLowerCase().slice(0, 80))
    .filter((s) => s.length > 20);
  const unique = new Set(sentences);
  return sentences.length > 6 && unique.size < sentences.length * 0.6;
}

const SYSTEM_PROMPT = `You are an expert SEO content writer for Dialcues, an AI-powered phone call reminder service.

Write a helpful, practical blog article. Follow these rules strictly:
- Target one main keyword provided by the user
- Keep tone practical, trustworthy, modern
- Avoid fluff, filler paragraphs, and fake statistics
- Do NOT make exaggerated claims
- Write a clear intro paragraph
- Use H2 and H3 headings to structure the article
- Include practical examples and actionable advice
- Mention Dialcues naturally where relevant as a possible solution (NOT in every section)
- End with a subtle call-to-action for Dialcues
- Article length: 1000–1500 words
- Do NOT use keyword stuffing

Return ONLY valid JSON (no markdown fences, no explanation) with this exact schema:
{
  "title": "string (compelling, SEO-friendly title, max 70 chars)",
  "slug": "string (url-safe slug, lowercase, hyphens)",
  "excerpt": "string (2-3 sentence summary, max 200 chars)",
  "metaTitle": "string (SEO title, max 60 chars)",
  "metaDescription": "string (SEO meta description, max 155 chars)",
  "tags": ["string array, 3-5 relevant tags"],
  "contentMd": "string (full markdown article body with H2/H3 headings)"
}`;

function buildUserPrompt(topic) {
  const parts = [`Target keyword: ${topic.keyword}`];
  if (topic.audience) parts.push(`Target audience: ${topic.audience}`);
  if (topic.searchIntent) parts.push(`Search intent: ${topic.searchIntent}`);
  parts.push(
    "Write the article now. Return ONLY the JSON object, nothing else."
  );
  return parts.join("\n");
}

function extractJson(text) {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

function validateDraft(data, targetKeyword) {
  const errors = [];

  if (!data.title || typeof data.title !== "string" || data.title.length < 10)
    errors.push("title is missing or too short");

  if (!data.slug || typeof data.slug !== "string")
    errors.push("slug is missing");

  if (!data.metaTitle || typeof data.metaTitle !== "string")
    errors.push("metaTitle is missing");

  if (!data.metaDescription || typeof data.metaDescription !== "string")
    errors.push("metaDescription is missing");

  if (!data.excerpt || typeof data.excerpt !== "string")
    errors.push("excerpt is missing");

  if (!Array.isArray(data.tags) || data.tags.length < 1)
    errors.push("tags array is missing or empty");

  if (!data.contentMd || typeof data.contentMd !== "string")
    errors.push("contentMd is missing");

  if (data.contentMd) {
    const wordCount = data.contentMd.split(/\s+/).length;
    if (wordCount < 400) errors.push(`content too short (${wordCount} words, need 400+)`);

    const sections = countH2Sections(data.contentMd);
    if (sections < 3) errors.push(`only ${sections} headings found, need at least 3`);

    if (hasRepetitiveContent(data.contentMd))
      errors.push("content appears repetitive");

    const kwLower = targetKeyword.toLowerCase();
    if (!data.contentMd.toLowerCase().includes(kwLower))
      errors.push(`target keyword "${targetKeyword}" not found in content`);
  }

  return errors;
}

/**
 * Generate a blog draft from a topic.
 * @param {{ keyword: string, audience?: string, searchIntent?: string }} topic
 * @returns {Promise<{ success: boolean, draft?: object, provider: string, model: string, error?: string }>}
 */
export async function generateBlogDraft(topic) {
  const provider = getAiProvider();

  try {
    const result = await provider.generate({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildUserPrompt(topic),
      temperature: 0.7,
      maxTokens: 4096,
    });

    let parsed;
    try {
      parsed = extractJson(result.text);
    } catch {
      return {
        success: false,
        provider: result.provider,
        model: result.model,
        error: `Failed to parse JSON from AI response: ${result.text.slice(0, 200)}`,
      };
    }

    const validationErrors = validateDraft(parsed, topic.keyword);
    if (validationErrors.length > 0) {
      return {
        success: false,
        provider: result.provider,
        model: result.model,
        error: `Validation failed: ${validationErrors.join("; ")}`,
      };
    }

    const slug = slugify(parsed.slug || parsed.title);

    return {
      success: true,
      provider: result.provider,
      model: result.model,
      draft: {
        title: parsed.title.slice(0, 300),
        slug,
        excerpt: parsed.excerpt.slice(0, 500),
        contentMd: parsed.contentMd,
        metaTitle: parsed.metaTitle.slice(0, 200),
        metaDescription: parsed.metaDescription.slice(0, 500),
        targetKeyword: topic.keyword,
        readingTime: estimateReadingTime(parsed.contentMd),
        tags: (parsed.tags || []).map((t) => String(t).trim()).filter(Boolean).slice(0, 10),
      },
    };
  } catch (err) {
    const msg = err?.response?.data?.error?.message || err.message || "Unknown generation error";
    return {
      success: false,
      provider: provider.name,
      model: process.env.AI_MODEL || "unknown",
      error: msg,
    };
  }
}
