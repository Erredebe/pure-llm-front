import { beforeEach, describe, expect, it } from 'vitest';

import { LocalStorageSettingsRepository } from './local-storage-settings.repository';

describe('LocalStorageSettingsRepository', () => {
  const repository = new LocalStorageSettingsRepository();

  beforeEach(() => {
    localStorage.clear();
  });

  it('creates a default store when storage is empty', async () => {
    const store = await repository.loadStore();

    expect(store.profiles).toHaveLength(1);
    expect(store.activeProfileId).toBe(store.profiles[0].id);
  });

  it('migrates legacy knowledge base payloads into profile sources', async () => {
    localStorage.setItem(
      'pure-llm-front.settings',
      JSON.stringify({
        selectedModelId: 'model-1',
        temperature: 0.2,
        maxTokens: 64,
        systemPrompt: 'Be concise',
        knowledgeBase: {
          enabled: true,
          strictMode: false,
          sourceName: 'Legacy',
          format: 'markdown',
          content: '# Stored notes'
        }
      })
    );

    const store = await repository.loadStore();

    expect(store.profiles[0].selectedModelId).toBe('model-1');
    expect(store.profiles[0].knowledgeBaseStrictMode).toBe(false);
    expect(store.profiles[0].knowledgeSources[0]?.name).toBe('Legacy');
  });
});
