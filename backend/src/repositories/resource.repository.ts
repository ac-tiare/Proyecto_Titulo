import { prisma } from '../config/prisma.js';
import type { ResourceCategory } from '@prisma/client';

export const resourceRepository = {
  list(category?: ResourceCategory) {
    return prisma.resource.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        title: true,
        summary: true,
        category: true,
        imageUrl: true,
        createdAt: true,
      },
    });
  },

  findById(id: string) {
    return prisma.resource.findUnique({ where: { id } });
  },
};
