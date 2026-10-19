import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

import { AuthService } from '../../core/firebase/auth.service';
import { FirebaseClientService } from '../../core/firebase/firebase-client.service';

export type SafetySupportType = 'person' | 'place';

export interface SafetySupportEntry {
  id: string;
  type: SafetySupportType;
  name: string;
  details: string;
  phone: string;
  createdAt: number;
  updatedAt: number;
}

interface SafetySupportDocument {
  tipo: unknown;
  nombre: unknown;
  detalle: unknown;
  telefono?: unknown;
  usuarioId: unknown;
  createdAt: unknown;
  updatedAt: unknown;
}

@Injectable({ providedIn: 'root' })
export class SafetyPlanSupportService {
  private readonly firebase = inject(FirebaseClientService);
  private readonly auth = inject(AuthService);

  async list(): Promise<SafetySupportEntry[]> {
    const user = this.requireUser();
    const entries = collection(
      this.firebase.firestore,
      'usuarios',
      user.uid,
      'planes_seguridad',
      'principal',
      'personas_lugares',
    );
    const entriesQuery = query(entries, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(entriesQuery);

    return snapshot.docs.map((entry) =>
      this.toEntry(entry.id, entry.data() as SafetySupportDocument, user.uid),
    );
  }

  async create(input: {
    type: SafetySupportType;
    name: string;
    details: string;
    phone?: string;
  }): Promise<void> {
    const user = this.requireUser();
    const { name, details, phone } = this.validateInput(
      input.type,
      input.name,
      input.details,
      input.phone ?? '',
    );
    await this.ensurePlanDocument(user.uid);
    const entries = collection(
      this.firebase.firestore,
      'usuarios',
      user.uid,
      'planes_seguridad',
      'principal',
      'personas_lugares',
    );
    await addDoc(entries, {
      tipo: input.type,
      nombre: name,
      detalle: details,
      telefono: phone,
      usuarioId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async update(
    entryId: string,
    input: {
      type: SafetySupportType;
      name: string;
      details: string;
      phone?: string;
    },
  ): Promise<void> {
    const user = this.requireUser();
    const { name, details, phone } = this.validateInput(
      input.type,
      input.name,
      input.details,
      input.phone ?? '',
    );
    const entry = doc(
      this.firebase.firestore,
      'usuarios',
      user.uid,
      'planes_seguridad',
      'principal',
      'personas_lugares',
      entryId,
    );
    await updateDoc(entry, {
      tipo: input.type,
      nombre: name,
      detalle: details,
      telefono: phone,
      updatedAt: serverTimestamp(),
    });
  }

  async delete(entryId: string): Promise<void> {
    const user = this.requireUser();
    const entry = doc(
      this.firebase.firestore,
      'usuarios',
      user.uid,
      'planes_seguridad',
      'principal',
      'personas_lugares',
      entryId,
    );
    await deleteDoc(entry);
  }

  private requireUser() {
    const user = this.auth.user();
    if (!user) {
      throw new Error('Debes iniciar sesión para consultar tu plan de seguridad.');
    }
    return user;
  }

  private async ensurePlanDocument(userId: string): Promise<void> {
    const plan = doc(
      this.firebase.firestore,
      'usuarios',
      userId,
      'planes_seguridad',
      'principal',
    );
    await setDoc(plan, { usuarioId: userId }, { merge: true });
  }

  private validateInput(
    type: SafetySupportType,
    nameInput: string,
    detailsInput: string,
    phoneInput: string,
  ): {
    name: string;
    details: string;
    phone: string;
  } {
    const name = nameInput.trim();
    const details = detailsInput.trim();
    const phone = phoneInput.trim().replace(/[\s()-]/g, '');
    if (!name || name.length > 100) {
      throw new Error('El nombre debe tener entre 1 y 100 caracteres.');
    }
    if (details.length > 300) {
      throw new Error('Los detalles no pueden superar los 300 caracteres.');
    }
    if (
      phone &&
      (type !== 'person' || !/^\+?\d{7,15}$/.test(phone))
    ) {
      throw new Error(
        'Ingresa un teléfono válido con 7 a 15 dígitos, o déjalo en blanco.',
      );
    }
    return { name, details, phone };
  }

  private toEntry(
    id: string,
    data: SafetySupportDocument,
    userId: string,
  ): SafetySupportEntry {
    const allowedFields = new Set([
      'tipo',
      'nombre',
      'detalle',
      'telefono',
      'usuarioId',
      'createdAt',
      'updatedAt',
    ]);
    const hasOnlyAllowedFields = Object.keys(data).every((key) =>
      allowedFields.has(key),
    );
    if (
      !hasOnlyAllowedFields ||
      (data.tipo !== 'person' && data.tipo !== 'place') ||
      typeof data.nombre !== 'string' ||
      !data.nombre.trim() ||
      data.nombre.length > 100 ||
      typeof data.detalle !== 'string' ||
      data.detalle.length > 300 ||
      (data.telefono !== undefined &&
        (typeof data.telefono !== 'string' ||
          data.telefono.length > 16 ||
          (data.telefono !== '' && !/^\+?\d{7,15}$/.test(data.telefono)))) ||
      (data.tipo === 'place' &&
        data.telefono !== undefined &&
        data.telefono !== '') ||
      data.usuarioId !== userId ||
      !(data.createdAt instanceof Timestamp) ||
      !(data.updatedAt instanceof Timestamp)
    ) {
      throw new Error(
        'Firestore devolvió una persona o lugar de apoyo con datos inválidos.',
      );
    }

    return {
      id,
      type: data.tipo,
      name: data.nombre,
      details: data.detalle,
      phone: typeof data.telefono === 'string' ? data.telefono : '',
      createdAt: data.createdAt.toMillis(),
      updatedAt: data.updatedAt.toMillis(),
    };
  }
}
