import { emotionRepository } from '../repositories/emotion.repository.js';
import { AppError } from '../utils/app-error.js';
const moodToDb = {
    'muy-bien': 'VERY_GOOD',
    bien: 'GOOD',
    'mas-o-menos': 'NEUTRAL',
    mal: 'BAD',
    'muy-mal': 'VERY_BAD',
};
const emotionToDb = {
    tristeza: 'SADNESS',
    ansiedad: 'ANXIETY',
    miedo: 'FEAR',
    enojo: 'ANGER',
    soledad: 'LONELINESS',
    calma: 'CALM',
    esperanza: 'HOPE',
    otra: 'OTHER',
};
const moodFromDb = {
    VERY_GOOD: 'muy-bien',
    GOOD: 'bien',
    NEUTRAL: 'mas-o-menos',
    BAD: 'mal',
    VERY_BAD: 'muy-mal',
};
const emotionFromDb = {
    SADNESS: 'tristeza',
    ANXIETY: 'ansiedad',
    FEAR: 'miedo',
    ANGER: 'enojo',
    LONELINESS: 'soledad',
    CALM: 'calma',
    HOPE: 'esperanza',
    OTHER: 'otra',
};
const toView = (record) => ({
    id: record.id,
    moodId: moodFromDb[record.mood],
    emotionIds: record.emotions.map((item) => emotionFromDb[item.emotion]),
    note: record.note ?? '',
    otherEmotion: record.otherEmotion ?? '',
    date: record.recordedAt.toLocaleString('es-CL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }),
    dateTimestamp: record.recordedAt.getTime(),
});
const toDatabaseInput = (input) => ({
    mood: moodToDb[input.moodId],
    emotions: input.emotionIds.map((emotion) => emotionToDb[emotion]),
    note: input.note,
    otherEmotion: input.otherEmotion,
});
const periodStart = (period) => {
    if (!period)
        return undefined;
    const start = new Date();
    if (period === 'week') {
        start.setDate(start.getDate() - 7);
    }
    else if (period === 'month') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
    }
    else {
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
    }
    return start;
};
const moodValues = Object.keys(moodFromDb);
const emotionValues = Object.keys(emotionFromDb);
const bucketStart = (date, period) => {
    if (period === 'year') {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    if (period === 'month') {
        const start = new Date(date);
        start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
        start.setHours(0, 0, 0, 0);
        return start.toISOString().slice(0, 10);
    }
    return date.toISOString().slice(0, 10);
};
export const emotionService = {
    async create(userId, input) {
        const record = await emotionRepository.create(userId, {
            ...toDatabaseInput(input),
            recordedAt: new Date(),
        });
        return toView(record);
    },
    async list(userId, input) {
        const { records, total } = await emotionRepository.list(userId, input.page, input.pageSize, periodStart(input.period));
        return {
            items: records.map(toView),
            pagination: {
                page: input.page,
                pageSize: input.pageSize,
                total,
                totalPages: Math.ceil(total / input.pageSize),
            },
        };
    },
    async patterns(userId, period) {
        const records = await emotionRepository.listPatternRecords(userId, periodStart(period));
        const moodCounts = Object.fromEntries(moodValues.map((mood) => [moodFromDb[mood], 0]));
        const emotionCounts = Object.fromEntries(emotionValues.map((emotion) => [emotionFromDb[emotion], 0]));
        const buckets = new Map();
        const recordedDays = new Set();
        for (const record of records) {
            const moodId = moodFromDb[record.mood];
            const day = record.recordedAt.toISOString().slice(0, 10);
            const key = bucketStart(record.recordedAt, period);
            const bucket = buckets.get(key) ?? {
                recordCount: 0,
                moodCounts: {},
                emotionCounts: {},
            };
            moodCounts[moodId] += 1;
            bucket.moodCounts[moodId] = (bucket.moodCounts[moodId] ?? 0) + 1;
            bucket.recordCount += 1;
            recordedDays.add(day);
            for (const item of record.emotions) {
                const emotionId = emotionFromDb[item.emotion];
                emotionCounts[emotionId] += 1;
                bucket.emotionCounts[emotionId] =
                    (bucket.emotionCounts[emotionId] ?? 0) + 1;
            }
            buckets.set(key, bucket);
        }
        return {
            period,
            recordCount: records.length,
            moodCounts,
            emotionCounts,
            buckets: [...buckets.entries()].map(([startDate, counts]) => ({
                startDate,
                ...counts,
            })),
            hasTemporalComparison: recordedDays.size > 1,
        };
    },
    async get(userId, id) {
        const record = await emotionRepository.findById(userId, id);
        if (!record)
            throw new AppError(404, 'NOT_FOUND', 'No se encontró el registro.');
        return toView(record);
    },
    async update(userId, id, input) {
        const record = await emotionRepository.update(userId, id, toDatabaseInput(input));
        if (!record)
            throw new AppError(404, 'NOT_FOUND', 'No se encontró el registro.');
        return toView(record);
    },
    async delete(userId, id) {
        if (!(await emotionRepository.delete(userId, id))) {
            throw new AppError(404, 'NOT_FOUND', 'No se encontró el registro.');
        }
    },
};
