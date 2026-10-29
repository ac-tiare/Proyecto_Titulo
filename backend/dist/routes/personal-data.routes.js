import { Router } from 'express';
import { deletePersonalData, exportPersonalData, } from '../controllers/personal-data.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
export const personalDataRoutes = Router();
personalDataRoutes.use(requireAuth);
personalDataRoutes.get('/export', exportPersonalData);
personalDataRoutes.delete('/account', deletePersonalData);
