import { prisma } from '../config/prisma.js';

export const emotionRepository = {
  create(
    userId: string,
    input: {
      mood: 'VERY_GOOD' | 'GOOD' | 'NEUTRAL' | 'BAD' | 'VERY_BAD';
      emotions: Array<
        | 'SADNESS'
        | 'ANXIETY'
        | 'FEAR'
        | 'ANGER'
        | 'LONELINESS'
        | 'CALM'
        | 'HOPE'
        | 'OTHER'
      >;
      note: string;
      otherEmotion: string;
      recordedAt: Date;
    },
  ) {
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
  async list(
    userId: string,
    page: number,
    pageSize: number,
    from?: Date,
  ) {
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
  listPatternRecords(userId: string, from: Date) {
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
  findById(userId: string, id: string) {
    return prisma.emotionalRecord.findFirst({
      where: { id, userId },
      include: { emotions: true },
    });
  },
  update(
    userId: string,
    id: string,
    input: {
      mood: 'VERY_GOOD' | 'GOOD' | 'NEUTRAL' | 'BAD' | 'VERY_BAD';
      emotions: Array<
        | 'SADNESS'
        | 'ANXIETY'
        | 'FEAR'
        | 'ANGER'
        | 'LONELINESS'
        | 'CALM'
        | 'HOPE'
        | 'OTHER'
      >;
      note: string;
      otherEmotion: string;
    },
  ) {
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.emotionalRecord.findFirst({
        where: { id, userId },
        select: { id: true },
      });
      if (!existing) return null;

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
  async delete(userId: string, id: string): Promise<boolean> {
    const result = await prisma.emotionalRecord.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  },
};
