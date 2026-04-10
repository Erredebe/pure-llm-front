import { Injectable } from '@angular/core';

import {
  SettingsProfile,
  SettingsRepository,
  SettingsStore
} from '../../domain/contracts/settings-repository';

const STORAGE_KEY = 'pure-llm-front.settings';

const createDefaultProfile = (): SettingsProfile => ({
  id: crypto.randomUUID(),
  name: 'Default',
  selectedModelId: null,
  temperature: 0.7,
  maxTokens: 256,
  systemPrompt: '',
  knowledgeBaseStrictMode: true,
  knowledgeSources: []
});

const createDefaultStore = (): SettingsStore => {
  const profile = createDefaultProfile();

  return {
    activeProfileId: profile.id,
    profiles: [profile]
  };
};

@Injectable()
export class LocalStorageSettingsRepository implements SettingsRepository {
  async loadStore(): Promise<SettingsStore> {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return createDefaultStore();
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      return this.normalizeStore(parsed);
    } catch {
      return createDefaultStore();
    }
  }

  async saveStore(store: SettingsStore): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  private normalizeStore(raw: unknown): SettingsStore {
    if (!raw || typeof raw !== 'object') {
      return createDefaultStore();
    }

    const candidate = raw as Partial<SettingsStore> & {
      knowledgeBase?: {
        enabled?: boolean;
        strictMode?: boolean;
        sourceName?: string;
        format?: 'text' | 'markdown' | 'json';
        content?: string;
      };
      selectedModelId?: string | null;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    };

    if (Array.isArray(candidate.profiles)) {
      const profiles = candidate.profiles
        .map((profile, index) => this.normalizeProfile(profile, `Profile ${index + 1}`))
        .filter((profile): profile is SettingsProfile => Boolean(profile));

      if (profiles.length === 0) {
        return createDefaultStore();
      }

      const activeProfileId = profiles.some((profile) => profile.id === candidate.activeProfileId)
        ? (candidate.activeProfileId as string)
        : profiles[0].id;

      return {
        activeProfileId,
        profiles
      };
    }

    return this.migrateLegacySettings(candidate);
  }

  private migrateLegacySettings(legacy: Partial<SettingsStore> & {
    knowledgeBase?: {
      enabled?: boolean;
      strictMode?: boolean;
      sourceName?: string;
      format?: 'text' | 'markdown' | 'json';
      content?: string;
    };
    selectedModelId?: string | null;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }): SettingsStore {
    const profile = createDefaultProfile();
    const knowledgeBaseContent = legacy.knowledgeBase?.content?.trim() ?? '';

    profile.selectedModelId = legacy.selectedModelId ?? null;
    profile.temperature = typeof legacy.temperature === 'number' ? legacy.temperature : profile.temperature;
    profile.maxTokens = typeof legacy.maxTokens === 'number' ? legacy.maxTokens : profile.maxTokens;
    profile.systemPrompt = legacy.systemPrompt ?? '';
    profile.knowledgeBaseStrictMode = legacy.knowledgeBase?.strictMode ?? true;
    profile.knowledgeSources = knowledgeBaseContent
      ? [
          {
            id: crypto.randomUUID(),
            name: legacy.knowledgeBase?.sourceName?.trim() || 'Migrated source',
            enabled: legacy.knowledgeBase?.enabled ?? true,
            format: legacy.knowledgeBase?.format ?? 'text',
            content: knowledgeBaseContent,
            origin: 'manual',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      : [];

    return {
      activeProfileId: profile.id,
      profiles: [profile]
    };
  }

  private normalizeProfile(raw: unknown, fallbackName: string): SettingsProfile | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const candidate = raw as Partial<SettingsProfile> & {
      knowledgeBase?: {
        enabled?: boolean;
        strictMode?: boolean;
        sourceName?: string;
        format?: 'text' | 'markdown' | 'json';
        content?: string;
      };
    };
    const base = createDefaultProfile();
    const now = new Date().toISOString();
    const sources = Array.isArray(candidate.knowledgeSources)
      ? candidate.knowledgeSources
          .map((source) => this.normalizeSource(source, now))
          .filter((source): source is SettingsProfile['knowledgeSources'][number] => Boolean(source))
      : this.migrateLegacyProfileKnowledgeBase(candidate, now);

    return {
      id: typeof candidate.id === 'string' && candidate.id ? candidate.id : crypto.randomUUID(),
      name: typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name.trim() : fallbackName || base.name,
      selectedModelId: typeof candidate.selectedModelId === 'string' || candidate.selectedModelId === null ? candidate.selectedModelId ?? null : null,
      temperature: typeof candidate.temperature === 'number' ? candidate.temperature : base.temperature,
      maxTokens: typeof candidate.maxTokens === 'number' ? candidate.maxTokens : base.maxTokens,
      systemPrompt: typeof candidate.systemPrompt === 'string' ? candidate.systemPrompt : '',
      knowledgeBaseStrictMode:
        typeof candidate.knowledgeBaseStrictMode === 'boolean'
          ? candidate.knowledgeBaseStrictMode
          : candidate.knowledgeBase?.strictMode ?? true,
      knowledgeSources: sources
    };
  }

  private migrateLegacyProfileKnowledgeBase(
    profile: Partial<SettingsProfile> & {
      knowledgeBase?: {
        enabled?: boolean;
        sourceName?: string;
        format?: 'text' | 'markdown' | 'json';
        content?: string;
      };
    },
    now: string
  ): SettingsProfile['knowledgeSources'] {
    const content = profile.knowledgeBase?.content?.trim() ?? '';

    if (!content) {
      return [];
    }

    return [
      {
        id: crypto.randomUUID(),
        name: profile.knowledgeBase?.sourceName?.trim() || 'Migrated source',
        enabled: profile.knowledgeBase?.enabled ?? true,
        format: profile.knowledgeBase?.format ?? 'text',
        content,
        origin: 'manual',
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  private normalizeSource(raw: unknown, now: string): SettingsProfile['knowledgeSources'][number] | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const candidate = raw as Partial<SettingsProfile['knowledgeSources'][number]>;
    const content = typeof candidate.content === 'string' ? candidate.content : '';

    return {
      id: typeof candidate.id === 'string' && candidate.id ? candidate.id : crypto.randomUUID(),
      name: typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name.trim() : 'Untitled source',
      enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : true,
      format: candidate.format === 'json' || candidate.format === 'markdown' ? candidate.format : 'text',
      content,
      origin: candidate.origin === 'file' ? 'file' : 'manual',
      createdAt: typeof candidate.createdAt === 'string' && candidate.createdAt ? candidate.createdAt : now,
      updatedAt: typeof candidate.updatedAt === 'string' && candidate.updatedAt ? candidate.updatedAt : now
    };
  }
}
