import { prisma } from '../src/config/prisma.js';

export const assertIsolatedTestDatabase = (): void => {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? '');
  const safeHost =
    ['localhost', '127.0.0.1', '::1'].includes(databaseUrl.hostname) ||
    (databaseUrl.hostname === 'database' &&
      process.env.ALLOW_DOCKER_TEST_DATABASE === 'true');
  if (
    databaseUrl.protocol !== 'postgresql:' ||
    databaseUrl.pathname !== '/contigo_test' ||
    !safeHost
  ) {
    throw new Error(
      'Database integration tests require a local PostgreSQL database named contigo_test.',
    );
  }
};

export const cleanTestUsers = async (userIds: readonly string[]): Promise<void> => {
  if (!userIds.length) return;
  const plans = await prisma.safetyPlan.findMany({
    where: { userId: { in: [...userIds] } },
    select: { id: true },
  });
  const planIds = plans.map((plan) => plan.id);

  await prisma.trustedContact.deleteMany({
    where: { userId: { in: [...userIds] } },
  });
  await prisma.emotionalRecord.deleteMany({
    where: { userId: { in: [...userIds] } },
  });
  if (planIds.length) {
    await prisma.safetyPlanItem.deleteMany({
      where: { planId: { in: planIds } },
    });
  }
  await prisma.safetyPlan.deleteMany({ where: { userId: { in: [...userIds] } } });
  await prisma.session.deleteMany({ where: { userId: { in: [...userIds] } } });
  await prisma.user.deleteMany({ where: { id: { in: [...userIds] } } });
};
