import crypto from "crypto";

const PUBLIC_API_KEY_PREFIX = "dc_live_";

export function generateRawPublicApiKey() {
  return `${PUBLIC_API_KEY_PREFIX}${crypto.randomBytes(24).toString("hex")}`;
}

export function getPublicApiKeyPrefix(rawKey) {
  return rawKey.slice(0, 12);
}

export function hashPublicApiKey(rawKey) {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}
