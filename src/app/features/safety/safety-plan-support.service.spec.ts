import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '../../core/firebase/auth.service';
import { FirebaseClientService } from '../../core/firebase/firebase-client.service';
import { SafetyPlanSupportService } from './safety-plan-support.service';

const firestoreSdk = vi.hoisted(() => {
  class Timestamp {
    constructor(private readonly date: Date) {}

    toMillis(): number {
      return this.date.getTime();
    }
  }

  return {
    addDoc: vi.fn(),
    collection: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn(),
    orderBy: vi.fn(),
    query: vi.fn(),
    serverTimestamp: vi.fn(),
    setDoc: vi.fn(),
    Timestamp,
    updateDoc: vi.fn(),
  };
});

vi.mock('firebase/firestore', () => firestoreSdk);

describe('SafetyPlanSupportService', () => {
  const firestore = {};
  const user = { uid: 'user-1' };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        SafetyPlanSupportService,
        { provide: FirebaseClientService, useValue: { firestore } },
        { provide: AuthService, useValue: { user: signal(user) } },
      ],
    });
  });

  it('creates a person or place under the authenticated user plan', async () => {
    const planRef = { path: 'user-plan' };
    const entriesRef = { path: 'support-entries' };
    const timestamp = { serverTime: true };
    firestoreSdk.doc.mockReturnValue(planRef);
    firestoreSdk.collection.mockReturnValue(entriesRef);
    firestoreSdk.serverTimestamp.mockReturnValue(timestamp);

    const service = TestBed.inject(SafetyPlanSupportService);
    await service.create({
      type: 'person',
      name: '  Alex  ',
      details: '  Puede acompañarme  ',
      phone: ' +56 9 1234-5678 ',
    });

    expect(firestoreSdk.doc).toHaveBeenCalledWith(
      firestore,
      'usuarios',
      'user-1',
      'planes_seguridad',
      'principal',
    );
    expect(firestoreSdk.setDoc).toHaveBeenCalledWith(
      planRef,
      { usuarioId: 'user-1' },
      { merge: true },
    );
    expect(firestoreSdk.collection).toHaveBeenCalledWith(
      firestore,
      'usuarios',
      'user-1',
      'planes_seguridad',
      'principal',
      'personas_lugares',
    );
    expect(firestoreSdk.addDoc).toHaveBeenCalledWith(entriesRef, {
      tipo: 'person',
      nombre: 'Alex',
      detalle: 'Puede acompañarme',
      telefono: '+56912345678',
      usuarioId: 'user-1',
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  it('lists the current user entries by newest creation time', async () => {
    const entriesRef = { path: 'support-entries' };
    const orderedQuery = { path: 'ordered-support-entries' };
    const createdAt = new firestoreSdk.Timestamp(
      new Date('2026-10-18T12:00:00.000Z'),
    );
    const updatedAt = new firestoreSdk.Timestamp(
      new Date('2026-10-18T13:00:00.000Z'),
    );
    firestoreSdk.collection.mockReturnValue(entriesRef);
    firestoreSdk.orderBy.mockReturnValue('newest-first');
    firestoreSdk.query.mockReturnValue(orderedQuery);
    firestoreSdk.getDocs.mockResolvedValue({
      docs: [
        {
          id: 'entry-1',
          data: () => ({
            tipo: 'place',
            nombre: 'Plaza tranquila',
            detalle: 'Cerca de casa',
            usuarioId: 'user-1',
            createdAt,
            updatedAt,
          }),
        },
      ],
    });

    const service = TestBed.inject(SafetyPlanSupportService);
    await expect(service.list()).resolves.toEqual([
      {
        id: 'entry-1',
        type: 'place',
        name: 'Plaza tranquila',
        details: 'Cerca de casa',
        phone: '',
        createdAt: createdAt.toMillis(),
        updatedAt: updatedAt.toMillis(),
      },
    ]);
    expect(firestoreSdk.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(firestoreSdk.getDocs).toHaveBeenCalledWith(orderedQuery);
  });

  it('updates and deletes only the selected entry path', async () => {
    const entryRef = { path: 'support-entry' };
    firestoreSdk.doc.mockReturnValue(entryRef);
    firestoreSdk.serverTimestamp.mockReturnValue('server-time');

    const service = TestBed.inject(SafetyPlanSupportService);
    await service.update('entry-1', {
      type: 'place',
      name: 'Biblioteca',
      details: '',
    });

    expect(firestoreSdk.updateDoc).toHaveBeenCalledWith(entryRef, {
      tipo: 'place',
      nombre: 'Biblioteca',
      detalle: '',
      telefono: '',
      updatedAt: 'server-time',
    });

    await service.delete('entry-1');
    expect(firestoreSdk.deleteDoc).toHaveBeenCalledWith(entryRef);
  });

  it('rejects unauthenticated access and invalid input before writing', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        SafetyPlanSupportService,
        { provide: FirebaseClientService, useValue: { firestore } },
        { provide: AuthService, useValue: { user: signal(null) } },
      ],
    });

    const service = TestBed.inject(SafetyPlanSupportService);
    await expect(
      service.create({ type: 'person', name: ' ', details: '' }),
    ).rejects.toThrow('Debes iniciar sesión');
    expect(firestoreSdk.addDoc).not.toHaveBeenCalled();
  });

  it('validates name length for an authenticated create', async () => {
    const service = TestBed.inject(SafetyPlanSupportService);
    await expect(
      service.create({
        type: 'person',
        name: 'x'.repeat(101),
        details: '',
      }),
    ).rejects.toThrow('entre 1 y 100 caracteres');
    expect(firestoreSdk.addDoc).not.toHaveBeenCalled();
  });

  it('rejects invalid phone numbers before writing', async () => {
    const service = TestBed.inject(SafetyPlanSupportService);
    await expect(
      service.create({
        type: 'person',
        name: 'Alex',
        details: '',
        phone: 'tel:+56 9 123',
      }),
    ).rejects.toThrow('Ingresa un teléfono válido');
    expect(firestoreSdk.addDoc).not.toHaveBeenCalled();
  });
});
