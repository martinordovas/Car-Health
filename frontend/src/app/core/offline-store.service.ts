import { Injectable } from '@angular/core';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { QueuedMutation } from './models';

export interface CachedResponse {
  key: string;
  body: unknown;
  savedAt: number;
}

interface CarHealthDB extends DBSchema {
  responses: {
    key: string;
    value: CachedResponse;
  };
  mutations: {
    key: string;
    value: QueuedMutation;
    indexes: { 'by-user': number };
  };
}

@Injectable({ providedIn: 'root' })
export class OfflineStoreService {
  private readonly dbPromise: Promise<IDBPDatabase<CarHealthDB>>;

  constructor() {
    this.dbPromise = openDB<CarHealthDB>('carhealth-offline', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('responses')) {
          db.createObjectStore('responses', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('mutations')) {
          const store = db.createObjectStore('mutations', { keyPath: 'id' });
          store.createIndex('by-user', 'userId');
        }
      },
    });
  }

  async getResponse(key: string): Promise<CachedResponse | undefined> {
    try {
      const db = await this.dbPromise;
      return await db.get('responses', key);
    } catch {
      return undefined;
    }
  }

  async putResponse(key: string, body: unknown): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.put('responses', { key, body, savedAt: Date.now() });
    } catch {
      // La caché es best-effort.
    }
  }

  async clearResponses(): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.clear('responses');
    } catch {
      // Ignorar.
    }
  }

  async getMutations(): Promise<QueuedMutation[]> {
    try {
      const db = await this.dbPromise;
      return await db.getAll('mutations');
    } catch {
      return [];
    }
  }

  async addMutation(mutation: QueuedMutation): Promise<void> {
    const db = await this.dbPromise;
    await db.put('mutations', mutation);
  }

  async removeMutation(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('mutations', id);
  }

  async countMutationsForUser(userId: number): Promise<number> {
    try {
      const db = await this.dbPromise;
      return await db.countFromIndex('mutations', 'by-user', userId);
    } catch {
      return 0;
    }
  }
}
