import type { Request, Response } from 'express';

import { resourceService } from '../services/resource.service.js';
import {
  listResourcesSchema,
  resourceIdParamsSchema,
} from '../validators/resource.validators.js';

export const listResources = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const { category } = listResourcesSchema.parse(request.query);
  response.json({ data: await resourceService.list(category) });
};

export const getResource = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const { id } = resourceIdParamsSchema.parse(request.params);
  response.json({ data: await resourceService.get(id) });
};
