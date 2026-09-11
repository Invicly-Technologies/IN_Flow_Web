import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * Super-admin status isn't in the JWT payload (it can change after a token
 * is issued, and these are low-frequency admin calls), so it's checked
 * against the database on every call rather than trusted from the token.
 */
export async function requireSuperAdmin(request: NextRequest): Promise<string> {
  const { sub } = requireAuth(request);
  const user = await prisma.user.findUnique({ where: { id: sub }, select: { isSuperAdmin: true, deletedAt: true } });
  if (!user || user.deletedAt || !user.isSuperAdmin) {
    throw new ApiError("FORBIDDEN", "Super-admin access required");
  }
  return sub;
}
