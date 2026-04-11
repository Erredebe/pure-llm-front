import { Injectable } from '@angular/core';

import { ChatSession, ChatSessionRepository } from '../../domain/contracts/chat-session-repository';
import { ChatMessage } from '../../domain/chat/entities/chat-message';
import { KnowledgeCitation } from '../../domain/chat/entities/knowledge-citation';

type StoredValue<T> = {
  key: string;
  value: T;
};

const ACTIVE_SESSION_KEY = 'active-session';
const FALLBACK_STORAGE_KEY = 'pure-llm-front.chat-session';
const DATABASE_NAME = 'pure-llm-front';
const DATABASE_VERSION = 1;
const STORE_NAME = 'chat';

@Injectable()
export class IndexedDbChatSessionRepository implements ChatSessionRepository {
  async loadActiveSession(): Promise<ChatSession | null> {
    try {
      const stored = await this.readIndexedDb<ChatSession>(ACTIVE_SESSION_KEY);
      return this.normalizeSession(stored);
    } catch {
      return this.readFallbackSession();
    }
  }

  async saveActiveSession(session: ChatSession): Promise<void> {
    const normalized = this.normalizeSession(session);
    if (!normalized) {
      return;
    }

    try {
      await this.writeIndexedDb(ACTIVE_SESSION_KEY, normalized);
      localStorage.removeItem(FALLBACK_STORAGE_KEY);
    } catch {
      localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(normalized));
    }
  }

  async clearActiveSession(): Promise<void> {
    try {
      await this.deleteIndexedDb(ACTIVE_SESSION_KEY);
    } catch {
      // Ignore IndexedDB cleanup failures and still clear the fallback copy.
    }

    localStorage.removeItem(FALLBACK_STORAGE_KEY);
  }

  private readFallbackSession(): ChatSession | null {
    const raw = localStorage.getItem(FALLBACK_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return this.normalizeSession(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  private normalizeSession(raw: unknown): ChatSession | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const candidate = raw as Partial<ChatSession>;
    const createdAt = typeof candidate.createdAt === 'string' && candidate.createdAt ? candidate.createdAt : new Date().toISOString();
    const updatedAt = typeof candidate.updatedAt === 'string' && candidate.updatedAt ? candidate.updatedAt : createdAt;
    const messages = Array.isArray(candidate.messages)
      ? candidate.messages
          .map((message) => this.normalizeMessage(message))
          .filter((message): message is ChatMessage => Boolean(message))
      : [];

    return {
      id: typeof candidate.id === 'string' && candidate.id ? candidate.id : crypto.randomUUID(),
      title: typeof candidate.title === 'string' && candidate.title.trim() ? candidate.title.trim() : 'New session',
      createdAt,
      updatedAt,
      profileId: typeof candidate.profileId === 'string' || candidate.profileId === null ? candidate.profileId ?? null : null,
      modelId: typeof candidate.modelId === 'string' || candidate.modelId === null ? candidate.modelId ?? null : null,
      messages
    };
  }

  private normalizeMessage(raw: unknown): ChatMessage | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const candidate = raw as Partial<ChatMessage>;
    if (candidate.role !== 'system' && candidate.role !== 'user' && candidate.role !== 'assistant') {
      return null;
    }

    return {
      id: typeof candidate.id === 'string' && candidate.id ? candidate.id : crypto.randomUUID(),
      role: candidate.role,
      content: typeof candidate.content === 'string' ? candidate.content : '',
      createdAt: typeof candidate.createdAt === 'string' && candidate.createdAt ? candidate.createdAt : new Date().toISOString(),
      citations: Array.isArray(candidate.citations)
        ? candidate.citations
            .map((citation) => this.normalizeCitation(citation))
            .filter((citation): citation is KnowledgeCitation => Boolean(citation))
        : undefined
    };
  }

  private normalizeCitation(raw: unknown): KnowledgeCitation | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const candidate = raw as Partial<KnowledgeCitation>;
    if (
      typeof candidate.sourceId !== 'string'
      || typeof candidate.sourceName !== 'string'
      || typeof candidate.chunkId !== 'string'
      || typeof candidate.excerpt !== 'string'
    ) {
      return null;
    }

    return {
      sourceId: candidate.sourceId,
      sourceName: candidate.sourceName,
      chunkId: candidate.chunkId,
      excerpt: candidate.excerpt,
      score: typeof candidate.score === 'number' ? candidate.score : 0
    };
  }

  private async readIndexedDb<T>(key: string): Promise<T | null> {
    const database = await this.openDatabase();

    return new Promise<T | null>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(key);

      request.onsuccess = () => resolve((request.result as StoredValue<T> | undefined)?.value ?? null);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed'));
    });
  }

  private async writeIndexedDb<T>(key: string, value: T): Promise<void> {
    const database = await this.openDatabase();

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put({ key, value } satisfies StoredValue<T>);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB write failed'));
    });
  }

  private async deleteIndexedDb(key: string): Promise<void> {
    const database = await this.openDatabase();

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB delete failed'));
    });
  }

  private async openDatabase(): Promise<IDBDatabase> {
    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not available in this browser');
    }

    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
    });
  }
}
