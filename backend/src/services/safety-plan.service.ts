import { safetyPlanRepository } from '../repositories/safety-plan.repository.js';
import type { SafetyPlanInput } from '../repositories/safety-plan.repository.js';

const toView = (plan: Awaited<ReturnType<typeof safetyPlanRepository.getOrCreate>>) => ({
  id: plan.id,
  warningSigns: plan.items
    .filter((item) => item.type === 'WARNING_SIGN')
    .map((item) => item.content),
  copingActions: plan.items
    .filter((item) => item.type === 'COPING_ACTION')
    .map((item) => item.content),
  safePlaces: plan.items
    .filter((item) => item.type === 'SAFE_PLACE')
    .map((item) => item.content),
  updatedAt: plan.updatedAt.toISOString(),
});

export const safetyPlanService = {
  async get(userId: string) {
    return toView(await safetyPlanRepository.getOrCreate(userId));
  },
  async save(userId: string, input: SafetyPlanInput) {
    return toView(await safetyPlanRepository.save(userId, input));
  },
};
