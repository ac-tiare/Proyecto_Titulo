import { prisma } from '../config/prisma.js';

export const personalDataRepository = {
  exportAccount(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        createdAt: true,
        emotions: {
          select: {
            id: true,
            mood: true,
            note: true,
            otherEmotion: true,
            recordedAt: true,
            createdAt: true,
            emotions: { select: { emotion: true } },
          },
          orderBy: { recordedAt: 'desc' },
        },
        safetyPlan: {
          select: {
            createdAt: true,
            updatedAt: true,
            items: {
              select: {
                type: true,
                content: true,
                position: true,
              },
              orderBy: [{ type: 'asc' }, { position: 'asc' }],
            },
          },
        },
        contacts: {
          select: {
            id: true,
            name: true,
            phone: true,
            relationship: true,
            details: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  deleteAccount(userId: string) {
    return prisma.$transaction(async (transaction) => {
      await transaction.trustedContact.deleteMany({ where: { userId } });
      await transaction.emotionalRecord.deleteMany({ where: { userId } });
      await transaction.safetyPlan.deleteMany({ where: { userId } });
      await transaction.session.deleteMany({ where: { userId } });
      return transaction.user.delete({
        where: { id: userId },
        select: { id: true },
      });
    });
  },
};
