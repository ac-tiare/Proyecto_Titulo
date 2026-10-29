import { prisma } from '../config/prisma.js';
const asItems = (type, values) => values.map((content, position) => ({ type, content, position }));
export const safetyPlanRepository = {
    async getOrCreate(userId) {
        return prisma.safetyPlan.upsert({
            where: { userId },
            create: { userId },
            update: {},
            include: { items: { orderBy: [{ type: 'asc' }, { position: 'asc' }] } },
        });
    },
    save(userId, input) {
        const items = [
            ...asItems('WARNING_SIGN', input.warningSigns),
            ...asItems('COPING_ACTION', input.copingActions),
            ...asItems('SAFE_PLACE', input.safePlaces),
        ];
        return prisma.$transaction(async (transaction) => {
            const plan = await transaction.safetyPlan.upsert({
                where: { userId },
                create: { userId },
                update: {},
                select: { id: true },
            });
            await transaction.safetyPlanItem.deleteMany({ where: { planId: plan.id } });
            if (items.length) {
                await transaction.safetyPlanItem.createMany({
                    data: items.map((item) => ({ ...item, planId: plan.id })),
                });
            }
            return transaction.safetyPlan.findUniqueOrThrow({
                where: { id: plan.id },
                include: { items: { orderBy: [{ type: 'asc' }, { position: 'asc' }] } },
            });
        });
    },
};
