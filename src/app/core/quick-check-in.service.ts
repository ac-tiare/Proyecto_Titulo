import { Injectable, computed, signal } from '@angular/core';

import type {
  EmotionalRecord,
  MoodId,
} from './api/api.models';

export interface SessionCheckIn extends EmotionalRecord {
  serverId: string | null;
  synchronized: boolean;
  revision: number;
}

@Injectable({ providedIn: 'root' })
export class QuickCheckInService {
  private readonly currentRecords = signal<readonly SessionCheckIn[]>([]);
  private nextId = 1;

  readonly records = this.currentRecords.asReadonly();
  readonly hasPendingRecords = computed(() =>
    this.currentRecords().some((record) => !record.synchronized),
  );

  addMood(
    moodId: MoodId,
    details: Pick<EmotionalRecord, 'emotionIds' | 'note' | 'otherEmotion'> = {
      emotionIds: [],
      note: '',
      otherEmotion: '',
    },
  ): SessionCheckIn {
    const now = new Date();
    const record: SessionCheckIn = {
      id: `session-${this.nextId++}`,
      serverId: null,
      synchronized: false,
      revision: 0,
      moodId,
      emotionIds: [...details.emotionIds],
      note: details.note,
      otherEmotion: details.otherEmotion,
      date: now.toLocaleString('es-CL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      dateTimestamp: now.getTime(),
    };
    this.currentRecords.update((records) => [record, ...records]);
    return record;
  }

  updateRecord(
    id: string,
    details: Pick<EmotionalRecord, 'emotionIds' | 'note' | 'otherEmotion'>,
  ): SessionCheckIn | null {
    let updated: SessionCheckIn | null = null;
    this.currentRecords.update((records) =>
      records.map((record) => {
        if (record.id !== id) return record;
        updated = {
          ...record,
          ...details,
          synchronized: false,
          revision: record.revision + 1,
        };
        return updated;
      }),
    );
    return updated;
  }

  markSynchronized(
    id: string,
    remoteRecord: EmotionalRecord,
    syncedRevision: number,
  ): void {
    this.currentRecords.update((records) =>
      records.map((record) =>
        record.id === id
          ? {
              ...(record.revision === syncedRevision ? remoteRecord : record),
              id: record.id,
              serverId: remoteRecord.id,
              synchronized: record.revision === syncedRevision,
              revision: record.revision,
            }
          : record,
      ),
    );
  }

  pendingRecords(): readonly SessionCheckIn[] {
    return this.currentRecords().filter((record) => !record.synchronized);
  }
}
