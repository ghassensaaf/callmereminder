/**
 * Platform-level admin guard. Requires requireAuth to run first (sets req.user).
 * Checks user email/id against env allowlists.
 */
export function requirePlatformAdmin(req, res, next) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ detail: "Unauthorized" });
  }

  const allowedEmails = (process.env.BLOG_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const allowedIds = (process.env.BLOG_ADMIN_USER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const emailMatch = allowedEmails.includes(user.email?.toLowerCase());
  const idMatch = allowedIds.includes(user.id);

  if (!emailMatch && !idMatch) {
    return res.status(403).json({ detail: "Platform admin access required." });
  }

  next();
}
