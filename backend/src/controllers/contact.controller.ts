import type { Request, Response } from 'express';

import { contactService } from '../services/contact.service.js';
import { AppError } from '../utils/app-error.js';
import { idParamsSchema } from '../validators/id.validators.js';
import { contactSchema, listContactsSchema } from '../validators/safety.validators.js';

const userId = (request: Request): string => {
  if (!request.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar.');
  return request.auth.user.id;
};

export const listContacts = async (request: Request, response: Response): Promise<void> => {
  const query = listContactsSchema.parse(request.query);
  response.json({ data: await contactService.list(userId(request), query.page, query.pageSize) });
};

export const createContact = async (request: Request, response: Response): Promise<void> => {
  const input = contactSchema.parse(request.body);
  response.status(201).json({ data: await contactService.create(userId(request), input) });
};

export const updateContact = async (request: Request, response: Response): Promise<void> => {
  const { id } = idParamsSchema.parse(request.params);
  const input = contactSchema.parse(request.body);
  await contactService.update(userId(request), id, input);
  response.status(204).end();
};

export const deleteContact = async (request: Request, response: Response): Promise<void> => {
  const { id } = idParamsSchema.parse(request.params);
  await contactService.delete(userId(request), id);
  response.status(204).end();
};
