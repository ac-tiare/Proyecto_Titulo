import { Injectable } from '@angular/core';

import type { SafetyPlanRequest } from './api/api.models';

export interface SafetyPlanContact {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
  details: string | null;
}

export interface GuestSafetyPlanData {
  plan: SafetyPlanRequest;
  contacts: SafetyPlanContact[];
}

const STORAGE_KEY = 'contigo.guest-safety-plan';

const emptyData = (): GuestSafetyPlanData => ({
  plan: { warningSigns: [], copingActions: [], safePlaces: [] },
  contacts: [],
});

@Injectable({ providedIn: 'root' })
export class GuestSafetyPlanService {
  load(): GuestSafetyPlanData {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return emptyData();

    let parsed: unknown;
    try {
      parsed = JSON.parse(stored);
    } catch {
      throw new Error('El plan guardado en este dispositivo no tiene un formato válido.');
    }

    if (!this.isGuestSafetyPlanData(parsed)) {
      throw new Error('El plan guardado en este dispositivo no tiene un formato válido.');
    }

    return {
      plan: {
        warningSigns: [...parsed.plan.warningSigns],
        copingActions: [...parsed.plan.copingActions],
        safePlaces: [...parsed.plan.safePlaces],
      },
      contacts: parsed.contacts.map((contact) => ({ ...contact })),
    };
  }

  save(data: GuestSafetyPlanData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      throw new Error(
        'No se pudo guardar en este dispositivo. Comprueba el espacio disponible y vuelve a intentarlo.',
      );
    }
  }

  private isGuestSafetyPlanData(value: unknown): value is GuestSafetyPlanData {
    if (typeof value !== 'object' || value === null) return false;
    const data = value as Record<string, unknown>;
    if (
      typeof data['plan'] !== 'object' ||
      data['plan'] === null ||
      !Array.isArray(data['contacts'])
    ) {
      return false;
    }

    const plan = data['plan'] as Record<string, unknown>;
    return (
      this.isStringArray(plan['warningSigns']) &&
      this.isStringArray(plan['copingActions']) &&
      this.isStringArray(plan['safePlaces']) &&
      data['contacts'].every((contact: unknown) => this.isSafetyPlanContact(contact))
    );
  }

  private isSafetyPlanContact(value: unknown): value is SafetyPlanContact {
    if (typeof value !== 'object' || value === null) return false;
    const contact = value as Record<string, unknown>;
    return (
      typeof contact['id'] === 'string' &&
      typeof contact['name'] === 'string' &&
      typeof contact['phone'] === 'string' &&
      (typeof contact['relationship'] === 'string' ||
        contact['relationship'] === null) &&
      (typeof contact['details'] === 'string' || contact['details'] === null)
    );
  }

  private isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
  }
}
