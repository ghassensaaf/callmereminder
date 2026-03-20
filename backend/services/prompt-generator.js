import axios from "axios";

function fallbackPrompt({ businessName, industry, tone, notes }) {
  const org = businessName?.trim() || "the business";
  const vertical = industry?.trim() || "general services";
  const style = tone?.trim() || "professional and warm";
  const extra = notes?.trim();

  return [
    `You are the outbound reminder assistant for ${org}.`,
    `Industry context: ${vertical}.`,
    `Communication style: ${style}.`,
    "Goal: deliver reminders clearly, politely, and quickly.",
    "Always confirm the reminder in plain language, avoid jargon, and keep responses concise.",
    "If the user asks to repeat, repeat the reminder verbatim once.",
    "If the user asks to snooze or dismiss, follow the provided tool instructions exactly.",
    "Never invent facts or business policies.",
    extra ? `Additional business instructions: ${extra}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateBusinessPrompt({ businessName, industry, tone, notes }) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return fallbackPrompt({ businessName, industry, tone, notes });
  }

  const model = process.env.OPENROUTER_PROMPT_MODEL?.trim() || "meta-llama/llama-3.1-8b-instruct:free";
  const appUrl = process.env.OPENROUTER_APP_URL?.trim() || process.env.API_PUBLIC_URL?.trim() || "http://localhost:8000";
  const appTitle = process.env.OPENROUTER_APP_NAME?.trim() || "DialCues";

  const system = [
    "You are an expert prompt engineer for a business reminder calling assistant.",
    "Return ONLY the final system prompt text, no markdown, no explanation.",
    "The prompt must be practical and concise (8-14 lines).",
    "Include tone, compliance-safe wording, and short call behavior instructions.",
    "Do not include placeholders like <insert business>; use provided business details directly.",
  ].join(" ");

  const user = [
    `Business name: ${businessName?.trim() || "Unknown"}`,
    `Industry: ${industry?.trim() || "General"}`,
    `Desired tone: ${tone?.trim() || "Professional"}`,
    `Additional notes: ${notes?.trim() || "None"}`,
    "Context: this prompt will be merged with technical tool instructions for snooze/dismiss voice actions.",
  ].join("\n");

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.4,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": appUrl,
          "X-Title": appTitle,
        },
        timeout: 20000,
      }
    );

    const prompt = response.data?.choices?.[0]?.message?.content?.trim();
    if (!prompt) {
      return fallbackPrompt({ businessName, industry, tone, notes });
    }
    return prompt.slice(0, 4000);
  } catch (err) {
    const msg = err?.response?.data?.error?.message || err.message;
    console.error("generateBusinessPrompt error:", msg);
    return fallbackPrompt({ businessName, industry, tone, notes });
  }
}
