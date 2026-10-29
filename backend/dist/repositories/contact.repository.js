import { prisma } from '../config/prisma.js';
export const contactRepository = {
    async list(userId, page, pageSize) {
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
    create(userId, input) {
        return prisma.trustedContact.create({
            data: { ...input, userId },
        });
    },
    update(userId, id, input) {
        return prisma.trustedContact.updateMany({
            where: { id, userId },
            data: input,
        });
    },
    delete(userId, id) {
        return prisma.trustedContact.deleteMany({ where: { id, userId } });
    },
};
