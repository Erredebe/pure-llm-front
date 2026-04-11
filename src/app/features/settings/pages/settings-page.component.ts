import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SettingsFacade } from '../../../application/settings/settings.facade';
import { KnowledgeSource, SettingsProfile } from '../../../domain/contracts/settings-repository';
import {
  cloneImportedProfile,
  createImportedSources,
  createManualSource,
  downloadJson,
  extractImportedProfiles,
  slugify,
  SourceField,
  updateKnowledgeSource
} from './settings-page.helpers';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsPageComponent implements OnInit {
  private readonly settingsFacade = inject(SettingsFacade);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  profiles: SettingsProfile[] = [];
  activeProfileId = '';
  selectedModelId: string | null = null;
  profileName = '';
  temperature = 0.7;
  maxTokens = 256;
  systemPrompt = '';
  knowledgeBaseStrictMode = true;
  knowledgeSources: KnowledgeSource[] = [];
  importMessage = '';

  async ngOnInit(): Promise<void> {
    await this.refreshFromStore();
  }

  async save(): Promise<void> {
    const profile = this.buildDraftProfile();
    if (!profile) {
      return;
    }

    await this.settingsFacade.save(profile);
    await this.refreshFromStore(profile.id);
  }

  async createProfile(): Promise<void> {
    const profile = await this.settingsFacade.createProfile();
    await this.refreshFromStore(profile.id);
  }

  async duplicateProfile(): Promise<void> {
    const profile = await this.settingsFacade.duplicateActiveProfile();
    await this.refreshFromStore(profile.id);
  }

  async deleteProfile(): Promise<void> {
    const profile = await this.settingsFacade.deleteProfile(this.activeProfileId);
    await this.refreshFromStore(profile.id);
  }

  async selectProfile(profileId: string): Promise<void> {
    await this.save();
    const profile = await this.settingsFacade.selectProfile(profileId);
    await this.refreshFromStore(profile.id);
  }

  async exportActiveProfile(): Promise<void> {
    const profile = this.buildDraftProfile();
    if (!profile) {
      return;
    }

    downloadJson(
      {
        version: 1,
        type: 'settings-profile',
        exportedAt: new Date().toISOString(),
        profile
      },
      `${slugify(profile.name)}.profile.json`
    );
  }

  async exportAllProfiles(): Promise<void> {
    await this.save();
    const store = await this.settingsFacade.loadStore();

    downloadJson(
      {
        version: 1,
        type: 'settings-store',
        exportedAt: new Date().toISOString(),
        store
      },
      'pure-llm-front.settings.json'
    );
  }

  async onSettingsImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    await this.save();

    try {
      const raw = JSON.parse(await file.text()) as unknown;
      const store = await this.settingsFacade.loadStore();
      const importedProfiles = extractImportedProfiles(raw);

      if (importedProfiles.length === 0) {
        this.importMessage = 'No valid profiles were found in that JSON file.';
        input.value = '';
        return;
      }

      const mergedProfiles = [...store.profiles];
      for (const profile of importedProfiles) {
        mergedProfiles.push(cloneImportedProfile(profile, mergedProfiles));
      }

      const activeProfile = mergedProfiles.at(-1) ?? mergedProfiles[0];
      await this.settingsFacade.saveStore({
        activeProfileId: activeProfile.id,
        profiles: mergedProfiles
      });
      this.importMessage = `${importedProfiles.length} profile(s) imported successfully.`;
      await this.refreshFromStore(activeProfile.id);
    } catch {
      this.importMessage = 'The selected file is not a valid settings JSON export.';
    }

    input.value = '';
  }

  addManualSource(): void {
    this.knowledgeSources = [...this.knowledgeSources, createManualSource(this.knowledgeSources.length)];
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (files.length === 0) {
      return;
    }

    const importedSources = await createImportedSources(files);
    this.knowledgeSources = [...this.knowledgeSources, ...importedSources];
    input.value = '';
  }

  removeSource(sourceId: string): void {
    this.knowledgeSources = this.knowledgeSources.filter((source) => source.id !== sourceId);
  }

  updateSource(sourceId: string, field: SourceField, value: boolean | string): void {
    this.knowledgeSources = updateKnowledgeSource(this.knowledgeSources, sourceId, field, value);
  }

  private async refreshFromStore(preferredProfileId?: string): Promise<void> {
    const store = await this.settingsFacade.loadStore();
    this.profiles = store.profiles;

    const profile = store.profiles.find((candidate) => candidate.id === preferredProfileId)
      ?? store.profiles.find((candidate) => candidate.id === store.activeProfileId)
      ?? store.profiles[0];

    if (!profile) {
      return;
    }

    this.applyProfile(profile);
    this.changeDetectorRef.markForCheck();
  }

  private buildDraftProfile(): SettingsProfile | null {
    const existingProfile = this.profiles.find((profile) => profile.id === this.activeProfileId);
    if (!existingProfile) {
      return null;
    }

    return {
      ...existingProfile,
      name: this.profileName.trim() || existingProfile.name,
      selectedModelId: this.selectedModelId,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      systemPrompt: this.systemPrompt,
      knowledgeBaseStrictMode: this.knowledgeBaseStrictMode,
      knowledgeSources: this.knowledgeSources.map((source) => ({
        ...source,
        name: source.name.trim() || 'Untitled source',
        content: source.content,
        updatedAt: new Date().toISOString()
      }))
    };
  }

  private applyProfile(profile: SettingsProfile): void {
    this.activeProfileId = profile.id;
    this.selectedModelId = profile.selectedModelId;
    this.profileName = profile.name;
    this.temperature = profile.temperature;
    this.maxTokens = profile.maxTokens;
    this.systemPrompt = profile.systemPrompt;
    this.knowledgeBaseStrictMode = profile.knowledgeBaseStrictMode;
    this.knowledgeSources = profile.knowledgeSources.map((source) => ({ ...source }));
  }
}
