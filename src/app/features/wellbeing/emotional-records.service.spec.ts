import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/firebase/auth.service';
import { FirebaseClientService } from '../../core/firebase/firebase-client.service';
import { EmotionalRecordsService } from './emotional-records.service';

const firestoreSdk = vi.hoisted(() => {
  class Timestamp {
    constructor(private readonly date: Date) {}

    toDate(): Date {
      return this.date;
    }
  }

  return {
    addDoc: vi.fn(),
    collection: vi.fn(),
    getDocs: vi.fn(),
    orderBy: vi.fn(),
    query: vi.fn(),
    serverTimestamp: vi.fn(),
    Timestamp,
  };
});

vi.mock('firebase/firestore', () => firestoreSdk);

describe('EmotionalRecordsService', () => {
  const firestore = {};
  const user = { uid: 'user-1' };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        EmotionalRecordsService,
        { provide: FirebaseClientService, useValue: { firestore } },
        { provide: AuthService, useValue: { user: signal(user) } },
      ],
    });
  });

  it('writes the validated record under the authenticated UID with server time', async () => {
    const collectionRef = { collection: 'emotional-records' };
    const timestamp = { server: true };
    firestoreSdk.collection.mockReturnValue(collectionRef);
    firestoreSdk.serverTimestamp.mockReturnValue(timestamp);
    firestoreSdk.addDoc.mockResolvedValue({ id: 'record-1' });

    const service = TestBed.inject(EmotionalRecordsService);
    await service.save({
      moodId: 'mal',
      emotionIds: ['ansiedad', 'otra'],
      note: ' Nota personal ',
      otherEmotion: 'Alivio',
    });

    expect(firestoreSdk.collection).toHaveBeenCalledWith(
      firestore,
      'usuarios',
      'user-1',
      'registros_emocionales',
    );
    expect(firestoreSdk.addDoc).toHaveBeenCalledWith(collectionRef, {
      estadoEmocional: 'mal',
      emociones: ['ansiedad', 'otra'],
      usuarioId: 'user-1',
      fechaRegistro: timestamp,
      nota: 'Nota personal',
      otraEmocion: 'Alivio',
    });
  });

  it('omits empty optional fields and does not write another-emotion text unless Otra is selected', async () => {
    firestoreSdk.collection.mockReturnValue({});
    firestoreSdk.serverTimestamp.mockReturnValue('server-time');
    firestoreSdk.addDoc.mockResolvedValue({ id: 'record-2' });

    const service = TestBed.inject(EmotionalRecordsService);
    await service.save({
      moodId: 'bien',
      emotionIds: ['calma'],
      note: '',
      otherEmotion: 'ignored',
    });

    expect(firestoreSdk.addDoc).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        estadoEmocional: 'bien',
        emociones: ['calma'],
        usuarioId: 'user-1',
        fechaRegistro: 'server-time',
      }),
    );
    expect(firestoreSdk.addDoc.mock.calls[0][1]).not.toHaveProperty('nota');
    expect(firestoreSdk.addDoc.mock.calls[0][1]).not.toHaveProperty('otraEmocion');
  });

  it('refuses to read or write without an authenticated user', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        EmotionalRecordsService,
        { provide: FirebaseClientService, useValue: { firestore } },
        { provide: AuthService, useValue: { user: signal(null) } },
      ],
    });
    const service = TestBed.inject(EmotionalRecordsService);

    await expect(
      service.save({
        moodId: 'bien',
        emotionIds: ['calma'],
        note: '',
        otherEmotion: '',
      }),
    ).rejects.toThrow('Debes iniciar sesión');
    await expect(service.listForCurrentUser()).rejects.toThrow(
      'Debes iniciar sesión',
    );
    expect(firestoreSdk.collection).not.toHaveBeenCalled();
  });

  it('queries the current user history by descending server date and maps labels data', async () => {
    const collectionRef = { collection: 'own-records' };
    const queryRef = { query: 'own-history' };
    firestoreSdk.collection.mockReturnValue(collectionRef);
    firestoreSdk.orderBy.mockReturnValue('descending-date');
    firestoreSdk.query.mockReturnValue(queryRef);
    firestoreSdk.getDocs.mockResolvedValue({
      docs: [
        {
          id: 'record-3',
          data: () => ({
            estadoEmocional: 'mal',
            emociones: ['ansiedad', 'soledad'],
            nota: 'Nota',
            fechaRegistro: new firestoreSdk.Timestamp(
              new Date('2026-10-16T05:30:00.000Z'),
            ),
            usuarioId: 'user-1',
          }),
        },
      ],
    });

    const service = TestBed.inject(EmotionalRecordsService);
    const records = await service.listForCurrentUser();

    expect(firestoreSdk.collection).toHaveBeenCalledWith(
      firestore,
      'usuarios',
      'user-1',
      'registros_emocionales',
    );
    expect(firestoreSdk.orderBy).toHaveBeenCalledWith('fechaRegistro', 'desc');
    expect(firestoreSdk.query).toHaveBeenCalledWith(
      collectionRef,
      'descending-date',
    );
    expect(records).toMatchObject([
      {
        id: 'record-3',
        moodId: 'mal',
        emotionIds: ['ansiedad', 'soledad'],
        note: 'Nota',
        otherEmotion: '',
      },
    ]);
  });
});
