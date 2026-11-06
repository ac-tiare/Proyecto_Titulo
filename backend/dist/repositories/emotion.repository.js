import { prisma } from '../config/prisma.js';
export const emotionRepository = {
    create(userId, input) {
        return prisma.emotionalRecord.create({
            data: {
                userId,
                mood: input.mood,
                note: input.note || null,
                otherEmotion: input.otherEmotion || null,
                recordedAt: input.recordedAt,
                emotions: {
                    create: input.emotions.map((emotion) => ({ emotion })),
                },
            },
            include: { emotions: true },
        });
    },
    async list(userId, page, pageSize, from) {
        const where = {
            userId,
            ...(from ? { recordedAt: { gte: from } } : {}),
        };
        const [records, total] = await prisma.$transaction([
            prisma.emotionalRecord.findMany({
                where,
                include: { emotions: true },
                orderBy: { recordedAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.emotionalRecord.count({ where }),
        ]);
        return { records, total };
    },
    listPatternRecords(userId, from) {
        return prisma.emotionalRecord.findMany({
            where: { userId, recordedAt: { gte: from } },
            select: {
                mood: true,
                recordedAt: true,
                emotions: { select: { emotion: true } },
            },
            orderBy: { recordedAt: 'asc' },
        });
    },
    findById(userId, id) {
        return prisma.emotionalRecord.findFirst({
            where: { id, userId },
            include: { emotions: true },
        });
    },
    update(userId, id, input) {
        return prisma.$transaction(async (transaction) => {
            const existing = await transaction.emotionalRecord.findFirst({
                where: { id, userId },
                select: { id: true },
            });
            if (!existing)
                return null;
            return transaction.emotionalRecord.update({
                where: { id },
                data: {
                    mood: input.mood,
                    note: input.note || null,
                    otherEmotion: input.otherEmotion || null,
                    emotions: {
                        deleteMany: {},
                        create: input.emotions.map((emotion) => ({ emotion })),
                    },
                },
                include: { emotions: true },
            });
        });
    },
    async delete(userId, id) {
        const result = await prisma.emotionalRecord.deleteMany({
            where: { id, userId },
        });
        return result.count > 0;
    },
};
