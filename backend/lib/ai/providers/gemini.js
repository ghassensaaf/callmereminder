import axios from "axios";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * @param {{ apiKey?: string, model?: string }} config
 * @returns {import('../types.js').AiProvider}
 */
export function createGeminiProvider(config = {}) {
  const apiKey = config.apiKey || process.env.AI_API_KEY;
  const model = config.model || process.env.AI_MODEL || "gemini-2.0-flash";

  if (!apiKey) throw new Error("Gemini provider requires AI_API_KEY");

  return {
    name: "gemini",
    async generate({ systemPrompt, userPrompt, temperature = 0.7, maxTokens = 4096 }) {
      const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;

      const body = {
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: "application/json",
        },
      };

      const res = await axios.post(url, body, {
        headers: { "Content-Type": "application/json" },
        timeout: 60_000,
      });

      const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!text) throw new Error("Empty response from Gemini");

      return { text, provider: "gemini", model };
    },
  };
}
