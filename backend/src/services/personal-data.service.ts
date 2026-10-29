import { personalDataRepository } from '../repositories/personal-data.repository.js';
import { AppError } from '../utils/app-error.js';

export const personalDataService = {
  async exportAccount(userId: string) {
    const account = await personalDataRepository.exportAccount(userId);
    if (!account) {
      throw new AppError(404, 'NOT_FOUND', 'No se encontró la cuenta.');
    }

    return {
      exportedAt: new Date().toISOString(),
      profile: {
        id: account.id,
        name: account.name,
        surname: account.surname,
        email: account.email,
        createdAt: account.createdAt.toISOString(),
      },
      emotionalRecords: account.emotions.map((record) => ({
        id: record.id,
        mood: record.mood,
        emotions: record.emotions.map(({ emotion }) => emotion),
        note: record.note,
        otherEmotion: record.otherEmotion,
        recordedAt: record.recordedAt.toISOString(),
        createdAt: record.createdAt.toISOString(),
      })),
      safetyPlan: account.safetyPlan
        ? {
            createdAt: account.safetyPlan.createdAt.toISOString(),
            updatedAt: account.safetyPlan.updatedAt.toISOString(),
            items: account.safetyPlan.items.map((item) => ({
              type: item.type,
              content: item.content,
              position: item.position,
            })),
          }
        : null,
      trustedContacts: account.contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        relationship: contact.relationship,
        details: contact.details,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString(),
      })),
    };
  },

  async deleteAccount(userId: string): Promise<void> {
    try {
      await personalDataRepository.deleteAccount(userId);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new AppError(404, 'NOT_FOUND', 'No se encontró la cuenta.');
      }
      throw error;
    }
  },
};
