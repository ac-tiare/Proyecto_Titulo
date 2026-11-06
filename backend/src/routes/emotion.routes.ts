import { Router } from 'express';

import {
  createEmotion,
  deleteEmotion,
  getEmotion,
  getEmotionPatterns,
  listEmotions,
  updateEmotion,
} from '../controllers/emotion.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const emotionRoutes = Router();

emotionRoutes.use(requireAuth);
emotionRoutes.get('/patrones', getEmotionPatterns);
emotionRoutes.get('/', listEmotions);
emotionRoutes.post('/', createEmotion);
emotionRoutes.get('/:id', getEmotion);
emotionRoutes.put('/:id', updateEmotion);
emotionRoutes.delete('/:id', deleteEmotion);
