import prisma from "../lib/prisma.js";
import { hashPublicApiKey } from "../lib/public-api-keys.js";
import { publicApiError } from "../lib/public-api-response.js";

export async function requirePublicApiKey(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return publicApiError(res, 401, "unauthorized", "Missing Bearer token.");
    }

    const rawKey = auth.slice("Bearer ".length).trim();
    if (!rawKey) {
      return publicApiError(res, 401, "unauthorized", "Missing Bearer token.");
    }

    const keyHash = hashPublicApiKey(rawKey);
    const apiKey = await prisma.publicApiKey.findUnique({
      where: { keyHash },
      include: {
        user: true,
        organization: true,
      },
    });

    if (!apiKey) {
      return publicApiError(res, 401, "invalid_api_key", "API key is invalid.");
    }
    if (apiKey.revokedAt) {
      return publicApiError(res, 401, "api_key_revoked", "API key has been revoked.");
    }
    if (apiKey.expiresAt && apiKey.expiresAt <= new Date()) {
      return publicApiError(res, 401, "api_key_expired", "API key has expired.");
    }

    await prisma.publicApiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    req.publicApiKey = apiKey;
    req.user = apiKey.user;
    req.organizationId = apiKey.organizationId;
    next();
  } catch (err) {
    next(err);
  }
}
