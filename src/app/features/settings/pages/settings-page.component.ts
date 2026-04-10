import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SettingsFacade } from '../../../application/settings/settings.facade';
import {
  KnowledgeBaseFormat,
  KnowledgeSource,
  SettingsProfile,
  SettingsStore
} from '../../../domain/contracts/settings-repository';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="panel">
      <p class="eyebrow">Settings</p>
      <h2>Profiles and local knowledge</h2>

      <form class="form" (ngSubmit)="save()">
        <section class="group">
          <div class="section-head">
            <div>
              <h3>Profiles</h3>
              <p>Create, load, and edit multiple local configurations.</p>
            </div>
            <div class="actions inline-actions">
              <button type="button" class="ghost" (click)="createProfile()">New profile</button>
              <button type="button" class="ghost" (click)="duplicateProfile()" [disabled]="profiles.length === 0">Duplicate</button>
              <button type="button" class="ghost" (click)="exportActiveProfile()" [disabled]="profiles.length === 0">Export profile</button>
              <button type="button" class="ghost" (click)="exportAllProfiles()" [disabled]="profiles.length === 0">Export all</button>
              <label class="file-button import-button">
                <input type="file" accept="application/json,.json" (change)="onSettingsImport($event)">
                <span>Import JSON</span>
              </label>
              <button type="button" class="ghost danger" (click)="deleteProfile()" [disabled]="profiles.length <= 1">Delete</button>
            </div>
          </div>

          @if (importMessage) {
            <p class="import-message">{{ importMessage }}</p>
          }

          <div class="profile-list">
            @for (profile of profiles; track profile.id) {
              <button
                type="button"
                class="profile-chip"
                [class.active]="profile.id === activeProfileId"
                (click)="selectProfile(profile.id)">
                {{ profile.name }}
              </button>
            }
          </div>

          <label>
            <span>Profile name</span>
            <input type="text" [(ngModel)]="profileName" name="profileName" placeholder="Support docs, FAQ, Sales...">
          </label>
        </section>

        <section class="group">
          <h3>Generation</h3>

          <label>
            <span>Temperature</span>
            <input type="number" step="0.1" min="0" max="2" [(ngModel)]="temperature" name="temperature">
          </label>

          <label>
            <span>Max tokens</span>
            <input type="number" min="32" max="2048" [(ngModel)]="maxTokens" name="maxTokens">
          </label>

          <label>
            <span>System prompt</span>
            <textarea
              rows="6"
              [(ngModel)]="systemPrompt"
              name="systemPrompt"
              placeholder="Optional instructions applied before every chat response"></textarea>
          </label>
        </section>

        <section class="group">
          <div class="section-head">
            <div>
              <h3>Knowledge sources</h3>
              <p>Attach multiple text, markdown, or JSON sources and keep them inside this profile.</p>
            </div>
            <label class="toggle">
              <input type="checkbox" [(ngModel)]="knowledgeBaseStrictMode" name="knowledgeBaseStrictMode">
              <span>Literal mode</span>
            </label>
          </div>

          <div class="actions inline-actions">
            <label class="file-button">
              <input
                type="file"
                multiple
                accept=".txt,.md,.markdown,.json,text/plain,text/markdown,application/json"
                (change)="onFilesSelected($event)">
              <span>Import files</span>
            </label>

            <button type="button" class="ghost" (click)="addManualSource()">Add text source</button>
          </div>

          @if (knowledgeSources.length === 0) {
            <p class="empty-state">No sources added yet. Import files or create a manual source.</p>
          }

          <div class="source-list">
            @for (source of knowledgeSources; track source.id; let index = $index) {
              <article class="source-card">
                <div class="source-head">
                  <label class="toggle compact-toggle">
                    <input
                      type="checkbox"
                      [ngModel]="source.enabled"
                      (ngModelChange)="updateSource(source.id, 'enabled', $event)"
                      [name]="'source-enabled-' + source.id">
                    <span>Use source</span>
                  </label>

                  <button type="button" class="ghost danger" (click)="removeSource(source.id)">Remove</button>
                </div>

                <div class="inline-fields source-meta">
                  <label>
                    <span>Name</span>
                    <input
                      type="text"
                      [ngModel]="source.name"
                      (ngModelChange)="updateSource(source.id, 'name', $event)"
                      [name]="'source-name-' + source.id"
                      placeholder="Source name">
                  </label>

                  <label>
                    <span>Format</span>
                    <select
                      [ngModel]="source.format"
                      (ngModelChange)="updateSource(source.id, 'format', $event)"
                      [name]="'source-format-' + source.id">
                      <option value="text">Text</option>
                      <option value="markdown">Markdown</option>
                      <option value="json">JSON</option>
                    </select>
                  </label>
                </div>

                <label>
                  <span>Content</span>
                  <textarea
                    rows="10"
                    [ngModel]="source.content"
                    (ngModelChange)="updateSource(source.id, 'content', $event)"
                    [name]="'source-content-' + source.id"
                    placeholder="Paste or edit the source content"></textarea>
                </label>

                <dl class="summary">
                  <div>
                    <dt>Index</dt>
                    <dd>{{ index + 1 }}</dd>
                  </div>
                  <div>
                    <dt>Origin</dt>
                    <dd>{{ source.origin }}</dd>
                  </div>
                  <div>
                    <dt>Stored chars</dt>
                    <dd>{{ source.content.trim().length }}</dd>
                  </div>
                </dl>
              </article>
            }
          </div>
        </section>

        <button type="submit">Save profile</button>
      </form>
    </section>
  `,
  styles: [
    `
      .panel {
        width: 100%;
        padding: 24px;
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        background: var(--surface);
        box-shadow: var(--shadow);
        box-sizing: border-box;
      }

      .eyebrow {
        margin: 0 0 8px;
        color: var(--accent);
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 0.72rem;
        font-weight: 700;
      }

      h2 {
        margin: 0 0 24px;
      }

      .form,
      .source-list {
        display: grid;
        gap: 18px;
      }

      .group,
      .source-card {
        display: grid;
        gap: 16px;
        padding: 20px;
        border: 1px solid var(--border);
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.55);
      }

      .section-head,
      .source-head {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: start;
      }

      .section-head h3,
      .section-head p {
        margin: 0;
      }

      .section-head p,
      .empty-state {
        color: var(--text-muted);
        line-height: 1.5;
      }

      .empty-state {
        margin: 0;
      }

      .import-message {
        margin: 0;
        color: var(--text-muted);
      }

      label {
        display: grid;
        gap: 8px;
      }

      input,
      select,
      textarea,
      button {
        font: inherit;
      }

      input,
      select,
      textarea {
        padding: 12px 14px;
        border: 1px solid var(--border);
        border-radius: 12px;
      }

      textarea {
        min-height: 132px;
        resize: vertical;
      }

      .actions,
      .inline-fields,
      .profile-list {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .inline-fields {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .toggle {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
      }

      .toggle input {
        width: 18px;
        height: 18px;
        margin: 0;
        padding: 0;
      }

      .compact-toggle {
        font-weight: 500;
      }

      .file-button,
      .ghost,
      .profile-chip,
      button[type='submit'] {
        width: fit-content;
        padding: 12px 18px;
        border-radius: 999px;
        font-weight: 700;
      }

      .file-button {
        position: relative;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.8);
        cursor: pointer;
      }

      .import-button {
        color: var(--text);
      }

      .file-button input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
      }

      .ghost,
      .profile-chip {
        border: 1px solid var(--border);
        background: transparent;
        color: var(--text);
      }

      .profile-chip.active {
        background: rgba(243, 179, 122, 0.26);
        border-color: rgba(199, 93, 44, 0.5);
      }

      .danger {
        color: var(--danger);
      }

      button[type='submit'] {
        border: 0;
        background: var(--accent);
        color: white;
      }

      .summary {
        display: grid;
        gap: 10px;
        margin: 0;
        padding: 16px;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.65);
      }

      .summary div {
        display: flex;
        justify-content: space-between;
        gap: 16px;
      }

      dt {
        color: var(--text-muted);
      }

      dd {
        margin: 0;
        font-weight: 700;
        text-align: right;
      }

      @media (max-width: 720px) {
        .section-head,
        .source-head,
        .inline-fields {
          display: grid;
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsPageComponent implements OnInit {
  private readonly settingsFacade = inject(SettingsFacade);

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

    this.downloadJson(
      {
        version: 1,
        type: 'settings-profile',
        exportedAt: new Date().toISOString(),
        profile
      },
      `${this.slugify(profile.name)}.profile.json`
    );
  }

  async exportAllProfiles(): Promise<void> {
    await this.save();
    const store = await this.settingsFacade.loadStore();

    this.downloadJson(
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
      const importedProfiles = this.extractImportedProfiles(raw);

      if (importedProfiles.length === 0) {
        this.importMessage = 'No valid profiles were found in that JSON file.';
        input.value = '';
        return;
      }

      const mergedProfiles = [...store.profiles];
      for (const profile of importedProfiles) {
        mergedProfiles.push(this.cloneImportedProfile(profile, mergedProfiles));
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
    const now = new Date().toISOString();

    this.knowledgeSources = [
      ...this.knowledgeSources,
      {
        id: crypto.randomUUID(),
        name: `Manual source ${this.knowledgeSources.length + 1}`,
        enabled: true,
        format: 'text',
        content: '',
        origin: 'manual',
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (files.length === 0) {
      return;
    }

    const importedSources = await Promise.all(
      files.map(async (file) => {
        const raw = await file.text();
        const format = this.detectFormat(file.name);
        const now = new Date().toISOString();

        return {
          id: crypto.randomUUID(),
          name: file.name,
          enabled: true,
          format,
          content: this.normalizeContent(raw, format),
          origin: 'file' as const,
          createdAt: now,
          updatedAt: now
        };
      })
    );

    this.knowledgeSources = [...this.knowledgeSources, ...importedSources];
    input.value = '';
  }

  removeSource(sourceId: string): void {
    this.knowledgeSources = this.knowledgeSources.filter((source) => source.id !== sourceId);
  }

  updateSource(sourceId: string, field: 'enabled' | 'name' | 'format' | 'content', value: boolean | string): void {
    this.knowledgeSources = this.knowledgeSources.map((source) => {
      if (source.id !== sourceId) {
        return source;
      }

      return {
        ...source,
        [field]: value,
        updatedAt: new Date().toISOString()
      } as KnowledgeSource;
    });
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

  private extractImportedProfiles(raw: unknown): SettingsProfile[] {
    if (!raw || typeof raw !== 'object') {
      return [];
    }

    const candidate = raw as {
      type?: string;
      profile?: unknown;
      store?: unknown;
      profiles?: unknown;
    };

    if (candidate.type === 'settings-profile') {
      const profile = this.toImportedProfile(candidate.profile);
      return profile ? [profile] : [];
    }

    if (candidate.type === 'settings-store') {
      return this.toImportedStore(candidate.store).profiles;
    }

    const directProfile = this.toImportedProfile(raw);
    if (directProfile) {
      return [directProfile];
    }

    return this.toImportedStore(raw).profiles;
  }

  private toImportedStore(raw: unknown): SettingsStore {
    if (!raw || typeof raw !== 'object') {
      return { activeProfileId: '', profiles: [] };
    }

    const candidate = raw as { profiles?: unknown };
    if (!Array.isArray(candidate.profiles)) {
      return { activeProfileId: '', profiles: [] };
    }

    return {
      activeProfileId: '',
      profiles: candidate.profiles.map((profile) => this.toImportedProfile(profile)).filter((profile): profile is SettingsProfile => Boolean(profile))
    };
  }

  private toImportedProfile(raw: unknown): SettingsProfile | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const candidate = raw as Partial<SettingsProfile>;
    if (typeof candidate.name !== 'string') {
      return null;
    }

    return {
      id: typeof candidate.id === 'string' ? candidate.id : crypto.randomUUID(),
      name: candidate.name.trim() || 'Imported profile',
      selectedModelId: typeof candidate.selectedModelId === 'string' || candidate.selectedModelId === null ? candidate.selectedModelId ?? null : null,
      temperature: typeof candidate.temperature === 'number' ? candidate.temperature : 0.7,
      maxTokens: typeof candidate.maxTokens === 'number' ? candidate.maxTokens : 256,
      systemPrompt: typeof candidate.systemPrompt === 'string' ? candidate.systemPrompt : '',
      knowledgeBaseStrictMode: typeof candidate.knowledgeBaseStrictMode === 'boolean' ? candidate.knowledgeBaseStrictMode : true,
      knowledgeSources: Array.isArray(candidate.knowledgeSources)
        ? candidate.knowledgeSources.map((source) => this.toImportedSource(source)).filter((source): source is KnowledgeSource => Boolean(source))
        : []
    };
  }

  private toImportedSource(raw: unknown): KnowledgeSource | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const candidate = raw as Partial<KnowledgeSource>;
    return {
      id: typeof candidate.id === 'string' ? candidate.id : crypto.randomUUID(),
      name: typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name.trim() : 'Imported source',
      enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : true,
      format: candidate.format === 'json' || candidate.format === 'markdown' ? candidate.format : 'text',
      content: typeof candidate.content === 'string' ? candidate.content : '',
      origin: candidate.origin === 'file' ? 'file' : 'manual',
      createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString(),
      updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date().toISOString()
    };
  }

  private cloneImportedProfile(profile: SettingsProfile, existingProfiles: SettingsProfile[]): SettingsProfile {
    const now = new Date().toISOString();
    const existingNames = new Set(existingProfiles.map((candidate) => candidate.name.toLowerCase()));
    const name = this.createUniqueProfileName(profile.name, existingNames);

    return {
      ...profile,
      id: crypto.randomUUID(),
      name,
      knowledgeSources: profile.knowledgeSources.map((source) => ({
        ...source,
        id: crypto.randomUUID(),
        createdAt: source.createdAt || now,
        updatedAt: now
      }))
    };
  }

  private createUniqueProfileName(baseName: string, existingNames: Set<string>): string {
    const normalizedBase = baseName.trim() || 'Imported profile';
    if (!existingNames.has(normalizedBase.toLowerCase())) {
      return normalizedBase;
    }

    let index = 2;
    let candidate = `${normalizedBase} ${index}`;

    while (existingNames.has(candidate.toLowerCase())) {
      index += 1;
      candidate = `${normalizedBase} ${index}`;
    }

    return candidate;
  }

  private downloadJson(payload: unknown, fileName: string): void {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = fileName;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  private slugify(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'profile';
  }

  private detectFormat(fileName: string): KnowledgeBaseFormat {
    const normalized = fileName.toLowerCase();

    if (normalized.endsWith('.json')) {
      return 'json';
    }

    if (normalized.endsWith('.md') || normalized.endsWith('.markdown')) {
      return 'markdown';
    }

    return 'text';
  }

  private normalizeContent(raw: string, format: KnowledgeBaseFormat): string {
    if (format !== 'json') {
      return raw;
    }

    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }
}
