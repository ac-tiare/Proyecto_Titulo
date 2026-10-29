import { prisma } from '../config/prisma.js';

export const sessionRepository = {
  create(input: {
    userId: string;
    accessTokenHash: string;
    refreshTokenHash: string;
    client: 'WEB' | 'NATIVE';
    accessExpiresAt: Date;
    refreshExpiresAt: Date;
  }) {
    return prisma.session.create({ data: input, select: { id: true } });
  },
  findActiveByAccessTokenHash(accessTokenHash: string, now: Date) {
    return prisma.session.findFirst({
      where: {
        accessTokenHash,
        revokedAt: null,
        accessExpiresAt: { gt: now },
      },
      select: {
        id: true,
        userId: true,
        client: true,
        user: {
          select: { id: true, name: true, surname: true, email: true },
        },
      },
    });
  },
  async rotate(input: {
    currentRefreshTokenHash: string;
    nextAccessTokenHash: string;
    nextRefreshTokenHash: string;
    client: 'WEB' | 'NATIVE';
    now: Date;
    accessExpiresAt: Date;
    refreshExpiresAt: Date;
  }) {
    return prisma.$transaction(async (transaction) => {
      const updated = await transaction.session.updateMany({
        where: {
          refreshTokenHash: input.currentRefreshTokenHash,
          client: input.client,
          revokedAt: null,
          refreshExpiresAt: { gt: input.now },
        },
        data: {
          accessTokenHash: input.nextAccessTokenHash,
          refreshTokenHash: input.nextRefreshTokenHash,
          accessExpiresAt: input.accessExpiresAt,
          refreshExpiresAt: input.refreshExpiresAt,
          lastSeenAt: input.now,
        },
      });
      if (updated.count !== 1) {
        return null;
      }

      return transaction.session.findUnique({
        where: { refreshTokenHash: input.nextRefreshTokenHash },
        select: {
          id: true,
          userId: true,
          client: true,
          user: {
            select: { id: true, name: true, surname: true, email: true },
          },
        },
      });
    });
  },
  revoke(id: string, userId: string, now: Date) {
    return prisma.session.updateMany({
      where: { id, userId, revokedAt: null },
      data: { revokedAt: now },
    });
  },
};
