export type KnowledgeBaseFormat = 'text' | 'markdown' | 'json';
export type KnowledgeSourceOrigin = 'manual' | 'file';

export interface KnowledgeSource {
  id: string;
  name: string;
  enabled: boolean;
  format: KnowledgeBaseFormat;
  content: string;
  origin: KnowledgeSourceOrigin;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsProfile {
  id: string;
  name: string;
  selectedModelId: string | null;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  knowledgeBaseStrictMode: boolean;
  knowledgeSources: KnowledgeSource[];
}

export interface SettingsStore {
  activeProfileId: string;
  profiles: SettingsProfile[];
}

export interface SettingsRepository {
  loadStore(): Promise<SettingsStore>;
  saveStore(store: SettingsStore): Promise<void>;
}
