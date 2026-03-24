import prisma from "../lib/prisma.js";

function normalizePath(pathname) {
  return pathname
    .replace(/\/\d+\b/g, "/:id")
    .replace(/\/[a-z0-9]{20,}\b/gi, "/:id")
    .slice(0, 180);
}

export function capturePublicApiUsage(req, res, next) {
  const startedAt = Date.now();

  res.on("finish", () => {
    const apiKey = req.publicApiKey;
    const user = req.user;
    if (!apiKey || !user) return;

    const durationMs = Math.max(0, Date.now() - startedAt);
    const statusCode = res.statusCode || 0;
    const fullPath = req.originalUrl?.split("?")[0] || req.path || "/";
    const path = normalizePath(fullPath.replace(/^\/api\/public\/v1/, "") || "/");

    prisma.publicApiRequest.create({
      data: {
        publicApiKeyId: apiKey.id,
        organizationId: apiKey.organizationId,
        userId: user.id,
        method: req.method,
        path,
        statusCode,
        durationMs,
        errorCode: res.locals.publicApiErrorCode ?? null,
      },
    }).catch((err) => {
      console.error("public api usage log failed:", err?.message || err);
    });
  });

  next();
}
