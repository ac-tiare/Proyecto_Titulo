import { contactRepository } from '../repositories/contact.repository.js';
import { AppError } from '../utils/app-error.js';

export const contactService = {
  async list(userId: string, page: number, pageSize: number) {
    const { contacts, total } = await contactRepository.list(userId, page, pageSize);
    return {
      items: contacts,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },
  create(userId: string, input: {
    name: string;
    phone: string;
    relationship?: string | null;
    details?: string | null;
  }) {
    return contactRepository.create(userId, input);
  },
  async update(userId: string, id: string, input: {
    name: string;
    phone: string;
    relationship?: string | null;
    details?: string | null;
  }) {
    const result = await contactRepository.update(userId, id, input);
    if (!result.count) throw new AppError(404, 'NOT_FOUND', 'No se encontró el contacto.');
  },
  async delete(userId: string, id: string) {
    const result = await contactRepository.delete(userId, id);
    if (!result.count) throw new AppError(404, 'NOT_FOUND', 'No se encontró el contacto.');
  },
};
