import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  FieldValue,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

import { AuthService } from '../../core/firebase/auth.service';
import { FirebaseClientService } from '../../core/firebase/firebase-client.service';
import {
  EmotionId,
  emotionOptions,
  MoodId,
  moodOptions,
} from './emotional-session';

export interface EmotionalRecord {
  id: string;
  moodId: MoodId;
  emotionIds: EmotionId[];
  note: string;
  otherEmotion: string;
  date: string;
  dateTimestamp: number;
}

interface EmotionalRecordWrite {
  estadoEmocional: MoodId;
  emociones: EmotionId[];
  otraEmocion?: string;
  nota?: string;
  fechaRegistro: FieldValue;
  usuarioId: string;
}

interface EmotionalRecordData {
  estadoEmocional?: unknown;
  emociones?: unknown;
  otraEmocion?: unknown;
  nota?: unknown;
  fechaRegistro?: unknown;
  usuarioId?: unknown;
}

@Injectable({ providedIn: 'root' })
export class EmotionalRecordsService {
  private readonly firebase = inject(FirebaseClientService);
  private readonly auth = inject(AuthService);

  async save(record: {
    moodId: MoodId;
    emotionIds: readonly EmotionId[];
    note: string;
    otherEmotion: string;
  }): Promise<void> {
    const user = this.auth.user();
    if (!user) {
      throw new Error('Debes iniciar sesión para guardar un registro emocional.');
    }

    const recordCollection = collection(
      this.firebase.firestore,
      'usuarios',
      user.uid,
      'registros_emocionales',
    );
    const document: EmotionalRecordWrite = {
      estadoEmocional: record.moodId,
      emociones: [...record.emotionIds],
      usuarioId: user.uid,
      fechaRegistro: serverTimestamp(),
    };

    const note = record.note.trim();
    if (note) {
      document['nota'] = note;
    }

    const otherEmotion = record.otherEmotion.trim();
    if (record.emotionIds.includes('otra') && otherEmotion) {
      document['otraEmocion'] = otherEmotion;
    }

    await addDoc(recordCollection, document);
  }

  async listForCurrentUser(): Promise<EmotionalRecord[]> {
    const user = this.auth.user();
    if (!user) {
      throw new Error('Debes iniciar sesión para consultar tus registros.');
    }

    const recordCollection = collection(
      this.firebase.firestore,
      'usuarios',
      user.uid,
      'registros_emocionales',
    );
    const recordsQuery = query(
      recordCollection,
      orderBy('fechaRegistro', 'desc'),
    );
    const snapshot = await getDocs(recordsQuery);

    return snapshot.docs.map((document) =>
      this.toEmotionalRecord(document.id, document.data()),
    );
  }

  private toEmotionalRecord(
    id: string,
    document: EmotionalRecordData,
  ): EmotionalRecord {
    const allowedFields = new Set([
      'estadoEmocional',
      'emociones',
      'otraEmocion',
      'nota',
      'fechaRegistro',
      'usuarioId',
    ]);
    const mood =
      typeof document.estadoEmocional === 'string'
        ? moodOptions.find((option) => option.id === document.estadoEmocional)
        : undefined;
    const emotions = Array.isArray(document.emociones)
      ? document.emociones.filter(
          (emotion): emotion is EmotionId =>
            typeof emotion === 'string' &&
            emotionOptions.some((option) => option.id === emotion),
        )
      : [];
    const hasOnlyAllowedFields = Object.keys(document).every((key) =>
      allowedFields.has(key),
    );
    const note = document.nota === undefined ? '' : document.nota;
    const otherEmotion =
      document.otraEmocion === undefined ? '' : document.otraEmocion;

    if (
      !mood ||
      !hasOnlyAllowedFields ||
      !Array.isArray(document.emociones) ||
      !emotions.length ||
      emotions.length !== document.emociones.length ||
      document.usuarioId !== this.auth.user()?.uid
    ) {
      throw new Error('Firestore devolvió un registro emocional con datos inválidos.');
    }

    if (
      !(document.fechaRegistro instanceof Timestamp) ||
      typeof note !== 'string' ||
      note.length > 500 ||
      typeof otherEmotion !== 'string' ||
      otherEmotion.length > 500 ||
      (otherEmotion && !emotions.includes('otra'))
    ) {
      throw new Error('Firestore devolvió un registro emocional con datos inválidos.');
    }

    return {
      id,
      moodId: mood.id,
      emotionIds: emotions,
      note,
      otherEmotion,
      date: document.fechaRegistro.toDate().toLocaleString('es-CL', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      dateTimestamp: document.fechaRegistro.toMillis(),
    };
  }
}
