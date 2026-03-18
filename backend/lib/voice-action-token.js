import crypto from "crypto";

const TOKEN_TTL_SECONDS = 300; // 5 minutes - call won't last longer

/**
 * Generate a signed token for voice actions (snooze, dismiss).
 * Vapi will call our API with this token - we verify it and perform the action.
 * @param {number} reminderId
 * @returns {string} Token string
 */
export function generateVoiceActionToken(reminderId) {
  const secret = process.env.VOICE_ACTION_SECRET;
  if (!secret) return null;

  const expiry = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = `${reminderId}:${expiry}`;
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${reminderId}.${expiry}.${signature}`;
}

/**
 * Verify and decode a voice action token.
 * @param {string} token
 * @returns {{ reminderId: number } | null}
 */
export function verifyVoiceActionToken(token) {
  const secret = process.env.VOICE_ACTION_SECRET;
  if (!secret || !token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [reminderIdStr, expiryStr, signature] = parts;
  const reminderId = parseInt(reminderIdStr, 10);
  const expiry = parseInt(expiryStr, 10);

  if (isNaN(reminderId) || isNaN(expiry) || reminderId <= 0) return null;
  if (expiry < Math.floor(Date.now() / 1000)) return null; // Expired

  const payload = `${reminderId}:${expiry}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  try {
    const a = Buffer.from(signature, "base64url");
    const b = Buffer.from(expected, "base64url");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return { reminderId };
}
