import type { Request, Response } from 'express';

import { emotionService } from '../services/emotion.service.js';
import { AppError } from '../utils/app-error.js';
import { idParamsSchema } from '../validators/id.validators.js';
import {
  createEmotionSchema,
  emotionPatternsSchema,
  listEmotionsSchema,
} from '../validators/emotion.validators.js';

const userId = (request: Request): string => {
  if (!request.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar.');
  return request.auth.user.id;
};

export const createEmotion = async (request: Request, response: Response): Promise<void> => {
  const input = createEmotionSchema.parse(request.body);
  const entry = await emotionService.create(userId(request), input);
  response.status(201).json({ data: entry });
};

export const listEmotions = async (request: Request, response: Response): Promise<void> => {
  const query = listEmotionsSchema.parse(request.query);
  response.json({ data: await emotionService.list(userId(request), query) });
};

export const getEmotionPatterns = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const { period } = emotionPatternsSchema.parse(request.query);
  response.json({
    data: await emotionService.patterns(userId(request), period),
  });
};

export const getEmotion = async (request: Request, response: Response): Promise<void> => {
  const { id } = idParamsSchema.parse(request.params);
  response.json({ data: await emotionService.get(userId(request), id) });
};

export const updateEmotion = async (request: Request, response: Response): Promise<void> => {
  const { id } = idParamsSchema.parse(request.params);
  const input = createEmotionSchema.parse(request.body);
  response.json({ data: await emotionService.update(userId(request), id, input) });
};

export const deleteEmotion = async (request: Request, response: Response): Promise<void> => {
  const { id } = idParamsSchema.parse(request.params);
  await emotionService.delete(userId(request), id);
  response.status(204).end();
};
