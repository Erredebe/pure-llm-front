import { Injectable } from '@angular/core';

import { AppSettings, SettingsRepository } from '../../domain/contracts/settings-repository';

const STORAGE_KEY = 'pure-llm-front.settings';

const DEFAULT_SETTINGS: AppSettings = {
  selectedModelId: null,
  temperature: 0.7,
  maxTokens: 256
};

@Injectable()
export class LocalStorageSettingsRepository implements SettingsRepository {
  async load(): Promise<AppSettings> {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    try {
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async save(settings: AppSettings): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
}
