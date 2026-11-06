import { contactRepository } from '../repositories/contact.repository.js';
import { AppError } from '../utils/app-error.js';
export const contactService = {
    async list(userId, page, pageSize) {
        const { contacts, total } = await contactRepository.list(userId, page, pageSize);
        return {
            items: contacts,
            pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        };
    },
    create(userId, input) {
        return contactRepository.create(userId, input);
    },
    async update(userId, id, input) {
        const result = await contactRepository.update(userId, id, input);
        if (!result.count)
            throw new AppError(404, 'NOT_FOUND', 'No se encontró el contacto.');
    },
    async delete(userId, id) {
        const result = await contactRepository.delete(userId, id);
        if (!result.count)
            throw new AppError(404, 'NOT_FOUND', 'No se encontró el contacto.');
    },
};
