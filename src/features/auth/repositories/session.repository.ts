import { prisma } from "@/lib/prisma";
import { hashRefreshToken } from "@/lib/jwt";
import type { RefreshToken, Session } from "@prisma/client";

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const sessionRepository = {
  createSession(userId: string, userAgent?: string | null, ipAddress?: string | null): Promise<Session> {
    return prisma.session.create({
      data: { userId, userAgent: userAgent ?? undefined, ipAddress: ipAddress ?? undefined },
    });
  },

  issueRefreshToken(sessionId: string, userId: string, tokenHash: string): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: {
        sessionId,
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });
  },

  findActiveByToken(token: string): Promise<RefreshToken | null> {
    const tokenHash = hashRefreshToken(token);
    return prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  },

  async rotate(oldTokenId: string, sessionId: string, userId: string, newTokenHash: string): Promise<RefreshToken> {
    const [, created] = await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: oldTokenId },
        data: { revokedAt: new Date(), replacedBy: newTokenHash },
      }),
      prisma.refreshToken.create({
        data: {
          sessionId,
          userId,
          tokenHash: newTokenHash,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
      }),
    ]);
    return created;
  },

  async revokeByToken(token: string): Promise<void> {
    const tokenHash = hashRefreshToken(token);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};
