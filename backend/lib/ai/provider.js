import { createGeminiProvider } from "./providers/gemini.js";
import { createOpenRouterProvider } from "./providers/openrouter.js";

/** @type {Map<string, () => import('./types.js').AiProvider>} */
const registry = new Map([
  ["gemini", () => createGeminiProvider()],
  ["openrouter", () => createOpenRouterProvider()],
]);

/** @returns {import('./types.js').AiProvider} */
export function getAiProvider() {
  const name = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  const factory = registry.get(name);
  if (!factory) {
    throw new Error(`Unknown AI_PROVIDER "${name}". Available: ${[...registry.keys()].join(", ")}`);
  }
  return factory();
}
