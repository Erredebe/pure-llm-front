export interface AppSettings {
  selectedModelId: string | null;
  temperature: number;
  maxTokens: number;
}

export interface SettingsRepository {
  load(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<void>;
}
