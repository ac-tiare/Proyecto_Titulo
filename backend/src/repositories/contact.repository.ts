import { prisma } from '../config/prisma.js';

export const contactRepository = {
  async list(userId: string, page: number, pageSize: number) {
    const where = { userId };
    const [contacts, total] = await prisma.$transaction([
      prisma.trustedContact.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.trustedContact.count({ where }),
    ]);
    return { contacts, total };
  },
  create(userId: string, input: {
    name: string;
    phone: string;
    relationship?: string | null;
    details?: string | null;
  }) {
    return prisma.trustedContact.create({
      data: { ...input, userId },
    });
  },
  update(userId: string, id: string, input: {
    name: string;
    phone: string;
    relationship?: string | null;
    details?: string | null;
  }) {
    return prisma.trustedContact.updateMany({
      where: { id, userId },
      data: input,
    });
  },
  delete(userId: string, id: string) {
    return prisma.trustedContact.deleteMany({ where: { id, userId } });
  },
};
