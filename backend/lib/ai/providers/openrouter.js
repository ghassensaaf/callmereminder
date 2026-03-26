import axios from "axios";

/**
 * @param {{ apiKey?: string, model?: string }} config
 * @returns {import('../types.js').AiProvider}
 */
export function createOpenRouterProvider(config = {}) {
  const apiKey = config.apiKey || process.env.AI_API_KEY;
  const model = config.model || process.env.AI_MODEL || "meta-llama/llama-3.1-8b-instruct:free";

  if (!apiKey) throw new Error("OpenRouter provider requires AI_API_KEY");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.API_PUBLIC_URL || "https://dialcues.com";
  const appTitle = "Dialcues";

  return {
    name: "openrouter",
    async generate({ systemPrompt, userPrompt, temperature = 0.7, maxTokens = 4096 }) {
      const res = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": appUrl,
            "X-Title": appTitle,
          },
          timeout: 90_000,
        }
      );

      const text = res.data?.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error("Empty response from OpenRouter");

      return { text, provider: "openrouter", model };
    },
  };
}
