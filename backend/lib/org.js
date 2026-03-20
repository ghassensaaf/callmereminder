import prisma from "./prisma.js";

/**
 * Single-org model: at most one membership per user.
 * @param {string} userId
 */
export async function getMembershipForUser(userId) {
  return prisma.member.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { organization: true },
  });
}
