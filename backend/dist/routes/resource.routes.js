import { Router } from 'express';
import { getResource, listResources, } from '../controllers/resource.controller.js';
export const resourceRoutes = Router();
resourceRoutes.get('/', listResources);
resourceRoutes.get('/:id', getResource);
