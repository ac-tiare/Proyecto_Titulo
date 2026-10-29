import type { Prisma, User } from '@prisma/client';

import { prisma } from '../config/prisma.js';

const publicUserSelect = {
  id: true,
  name: true,
  surname: true,
  email: true,
} satisfies Prisma.UserSelect;

export const userRepository = {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },
  findPublicById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  },
  create(data: Pick<User, 'name' | 'surname' | 'email' | 'passwordHash'>) {
    return prisma.user.create({ data, select: publicUserSelect });
  },
  createWithSession(
    data: Pick<User, 'name' | 'surname' | 'email' | 'passwordHash'>,
    session: {
      accessTokenHash: string;
      refreshTokenHash: string;
      client: 'WEB' | 'NATIVE';
      accessExpiresAt: Date;
      refreshExpiresAt: Date;
    },
  ) {
    return prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data,
        select: publicUserSelect,
      });
      const createdSession = await transaction.session.create({
        data: { ...session, userId: user.id },
        select: { id: true },
      });
      return { user, session: createdSession };
    });
  },
  updatePublic(
    id: string,
    data: Pick<User, 'name' | 'surname' | 'email'>,
  ) {
    return prisma.user.update({ where: { id }, data, select: publicUserSelect });
  },
};
