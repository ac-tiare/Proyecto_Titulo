import { prisma } from '../config/prisma.js';
export const resourceRepository = {
    list(category) {
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
    findById(id) {
        return prisma.resource.findUnique({ where: { id } });
    },
};
