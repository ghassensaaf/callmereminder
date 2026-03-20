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

/**
 * Resolves the user's single organization from membership (not session "active org").
 * Sets req.organizationId, req.activeOrganizationId (alias), and req.orgMembership.
 */
export async function requireOrg(req, res, next) {
  try {
    const membership = await prisma.member.findUnique({
      where: { userId: req.user.id },
      include: { organization: true },
    });
    if (!membership) {
      return res.status(400).json({ detail: "No organization. Complete onboarding first." });
    }
    req.organizationId = membership.organizationId;
    req.activeOrganizationId = membership.organizationId;
    req.orgMembership = membership;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireOrgRole(...allowedRoles) {
  return async (req, res, next) => {
    try {
      let membership = req.orgMembership;
      if (!membership || membership.userId !== req.user.id) {
        membership = await prisma.member.findUnique({ where: { userId: req.user.id } });
      }
      if (!membership) {
        return res.status(403).json({ detail: "You are not a member of an organization." });
      }
      if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
        return res.status(403).json({ detail: "You do not have permission for this action." });
      }
      req.orgMembership = membership;
      if (!req.organizationId) req.organizationId = membership.organizationId;
      if (!req.activeOrganizationId) req.activeOrganizationId = membership.organizationId;
      next();
    } catch (err) {
      next(err);
    }
  };
}
