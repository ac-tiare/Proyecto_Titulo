import { Router } from 'express';

import {
  createContact,
  deleteContact,
  listContacts,
  updateContact,
} from '../controllers/contact.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const contactRoutes = Router();

contactRoutes.use(requireAuth);
contactRoutes.get('/', listContacts);
contactRoutes.post('/', createContact);
contactRoutes.put('/:id', updateContact);
contactRoutes.delete('/:id', deleteContact);
