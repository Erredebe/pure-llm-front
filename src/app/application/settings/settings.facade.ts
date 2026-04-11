import { Inject, Injectable } from '@angular/core';

import { SETTINGS_REPOSITORY } from '../../core/config/llm.tokens';
import { SettingsProfile, SettingsRepository, SettingsStore } from '../../domain/contracts/settings-repository';

@Injectable({ providedIn: 'root' })
export class SettingsFacade {
  constructor(@Inject(SETTINGS_REPOSITORY) private readonly settingsRepository: SettingsRepository) {}

  async loadStore(): Promise<SettingsStore> {
    return this.settingsRepository.loadStore();
  }

  async saveStore(store: SettingsStore): Promise<void> {
    await this.settingsRepository.saveStore(store);
  }

  async load(): Promise<SettingsProfile> {
    const store = await this.loadStore();
    return this.getActiveProfile(store);
  }

  async updateActiveProfile(patch: Partial<SettingsProfile>): Promise<SettingsProfile> {
    const store = await this.loadStore();
    const activeProfile = this.getActiveProfile(store);
    const nextProfile: SettingsProfile = {
      ...activeProfile,
      ...patch,
      id: activeProfile.id
    };

    await this.save(nextProfile);
    return nextProfile;
  }

  async save(profile: SettingsProfile): Promise<void> {
    const store = await this.loadStore();
    const profiles = store.profiles.map((candidate) => (candidate.id === profile.id ? profile : candidate));

    await this.saveStore({
      activeProfileId: profiles.some((candidate) => candidate.id === store.activeProfileId) ? store.activeProfileId : profile.id,
      profiles: profiles.some((candidate) => candidate.id === profile.id) ? profiles : [...profiles, profile]
    });
  }

  async createProfile(name?: string): Promise<SettingsProfile> {
    const store = await this.loadStore();
    const timestamp = new Date().toISOString();
    const profile: SettingsProfile = {
      id: crypto.randomUUID(),
      name: name?.trim() || `Profile ${store.profiles.length + 1}`,
      selectedModelId: null,
      temperature: 0.7,
      maxTokens: 256,
      systemPrompt: '',
      knowledgeBaseStrictMode: true,
      knowledgeSources: []
    };

    await this.saveStore({
      activeProfileId: profile.id,
      profiles: [...store.profiles, { ...profile, knowledgeSources: profile.knowledgeSources.map((source) => ({ ...source, createdAt: timestamp, updatedAt: timestamp })) }]
    });

    return profile;
  }

  async duplicateActiveProfile(): Promise<SettingsProfile> {
    const store = await this.loadStore();
    const active = this.getActiveProfile(store);
    const now = new Date().toISOString();
    const duplicate: SettingsProfile = {
      ...active,
      id: crypto.randomUUID(),
      name: `${active.name} copy`,
      knowledgeSources: active.knowledgeSources.map((source) => ({
        ...source,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      }))
    };

    await this.saveStore({
      activeProfileId: duplicate.id,
      profiles: [...store.profiles, duplicate]
    });

    return duplicate;
  }

  async selectProfile(profileId: string): Promise<SettingsProfile> {
    const store = await this.loadStore();
    const profile = store.profiles.find((candidate) => candidate.id === profileId) ?? this.getActiveProfile(store);

    await this.saveStore({
      activeProfileId: profile.id,
      profiles: store.profiles
    });

    return profile;
  }

  async deleteProfile(profileId: string): Promise<SettingsProfile> {
    const store = await this.loadStore();
    const remainingProfiles = store.profiles.filter((profile) => profile.id !== profileId);

    if (remainingProfiles.length === 0) {
      const profile = await this.createProfile('Default');
      return profile;
    }

    const nextActive = remainingProfiles.find((profile) => profile.id === store.activeProfileId) ?? remainingProfiles[0];

    await this.saveStore({
      activeProfileId: nextActive.id,
      profiles: remainingProfiles
    });

    return nextActive;
  }

  private getActiveProfile(store: SettingsStore): SettingsProfile {
    const activeProfile = store.profiles.find((profile) => profile.id === store.activeProfileId) ?? store.profiles[0];

    if (activeProfile) {
      return activeProfile;
    }

    const fallbackProfile: SettingsProfile = {
      id: crypto.randomUUID(),
      name: 'Default',
      selectedModelId: null,
      temperature: 0.7,
      maxTokens: 256,
      systemPrompt: '',
      knowledgeBaseStrictMode: true,
      knowledgeSources: []
    };

    return fallbackProfile;
  }
}
