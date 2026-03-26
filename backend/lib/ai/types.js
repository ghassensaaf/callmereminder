/**
 * @typedef {Object} AiGenerateOptions
 * @property {string} systemPrompt
 * @property {string} userPrompt
 * @property {number} [temperature]
 * @property {number} [maxTokens]
 */

/**
 * @typedef {Object} AiGenerateResult
 * @property {string} text - Raw text response from the model
 * @property {string} provider - Provider name (e.g. "gemini", "openrouter")
 * @property {string} model - Model identifier used
 */

/**
 * @typedef {Object} AiProvider
 * @property {string} name
 * @property {(options: AiGenerateOptions) => Promise<AiGenerateResult>} generate
 */

export {};
