import type { Request, Response } from 'express';

import { safetyPlanService } from '../services/safety-plan.service.js';
import { AppError } from '../utils/app-error.js';
import { savePlanSchema } from '../validators/safety.validators.js';

const userId = (request: Request): string => {
  if (!request.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar.');
  return request.auth.user.id;
};

export const getSafetyPlan = async (request: Request, response: Response): Promise<void> => {
  response.json({ data: await safetyPlanService.get(userId(request)) });
};

export const saveSafetyPlan = async (request: Request, response: Response): Promise<void> => {
  const input = savePlanSchema.parse(request.body);
  response.json({ data: await safetyPlanService.save(userId(request), input) });
};
