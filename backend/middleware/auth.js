import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";
import prisma from "../lib/prisma.js";

export async function requireAuth(req, res, next) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session?.user) {
    return res.status(401).json({ detail: "Unauthorized" });
  }
  req.session = session;
  req.user = session.user;
  next();
}

export function requireOrg(req, res, next) {
  const orgId = req.session?.session?.activeOrganizationId;
  if (!orgId) {
    return res.status(400).json({ detail: "No active organization. Complete onboarding first." });
  }
  req.activeOrganizationId = orgId;
  next();
}

export function requireOrgRole(...allowedRoles) {
  return async (req, res, next) => {
    const orgId = req.activeOrganizationId;
    if (!orgId) {
      return res.status(400).json({ detail: "No active organization." });
    }
    const membership = await prisma.member.findFirst({
      where: { userId: req.user.id, organizationId: orgId },
    });
    if (!membership) {
      return res.status(403).json({ detail: "You are not a member of this organization." });
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
      return res.status(403).json({ detail: "You do not have permission for this action." });
    }
    req.orgMembership = membership;
    next();
  };
}
