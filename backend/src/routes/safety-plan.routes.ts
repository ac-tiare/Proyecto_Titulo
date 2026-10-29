import { Router } from 'express';

import { getSafetyPlan, saveSafetyPlan } from '../controllers/safety-plan.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const safetyPlanRoutes = Router();

safetyPlanRoutes.use(requireAuth);
safetyPlanRoutes.get('/', getSafetyPlan);
safetyPlanRoutes.put('/', saveSafetyPlan);
