import { safetyPlanService } from '../services/safety-plan.service.js';
import { AppError } from '../utils/app-error.js';
import { savePlanSchema } from '../validators/safety.validators.js';
const userId = (request) => {
    if (!request.auth)
        throw new AppError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar.');
    return request.auth.user.id;
};
export const getSafetyPlan = async (request, response) => {
    response.json({ data: await safetyPlanService.get(userId(request)) });
};
export const saveSafetyPlan = async (request, response) => {
    const input = savePlanSchema.parse(request.body);
    response.json({ data: await safetyPlanService.save(userId(request), input) });
};
