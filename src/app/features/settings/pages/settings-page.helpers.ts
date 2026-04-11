import { KnowledgeBaseFormat, KnowledgeSource, SettingsProfile, SettingsStore } from '../../../domain/contracts/settings-repository';

export type SourceField = 'enabled' | 'name' | 'format' | 'content';

export function createManualSource(index: number): KnowledgeSource {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name: `Manual source ${index + 1}`,
    enabled: true,
    format: 'text',
    content: '',
    origin: 'manual',
    createdAt: now,
    updatedAt: now
  };
}

export async function createImportedSources(files: File[]): Promise<KnowledgeSource[]> {
  return Promise.all(
    files.map(async (file) => {
      const raw = await file.text();
      const format = detectFormat(file.name);
      const now = new Date().toISOString();

      return {
        id: crypto.randomUUID(),
        name: file.name,
        enabled: true,
        format,
        content: normalizeContent(raw, format),
        origin: 'file' as const,
        createdAt: now,
        updatedAt: now
      };
    })
  );
}

export function updateKnowledgeSource(sources: KnowledgeSource[], sourceId: string, field: SourceField, value: boolean | string): KnowledgeSource[] {
  return sources.map((source) => {
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

export function extractImportedProfiles(raw: unknown): SettingsProfile[] {
  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const candidate = raw as {
    type?: string;
    profile?: unknown;
    store?: unknown;
  };

  if (candidate.type === 'settings-profile') {
    const profile = toImportedProfile(candidate.profile);
    return profile ? [profile] : [];
  }

  if (candidate.type === 'settings-store') {
    return toImportedStore(candidate.store).profiles;
  }

  const directProfile = toImportedProfile(raw);
  if (directProfile) {
    return [directProfile];
  }

  return toImportedStore(raw).profiles;
}

export function cloneImportedProfile(profile: SettingsProfile, existingProfiles: SettingsProfile[]): SettingsProfile {
  const now = new Date().toISOString();
  const existingNames = new Set(existingProfiles.map((candidate) => candidate.name.toLowerCase()));
  const name = createUniqueProfileName(profile.name, existingNames);

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

export function downloadJson(payload: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'profile';
}

function createUniqueProfileName(baseName: string, existingNames: Set<string>): string {
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

function toImportedStore(raw: unknown): SettingsStore {
  if (!raw || typeof raw !== 'object') {
    return { activeProfileId: '', profiles: [] };
  }

  const candidate = raw as { profiles?: unknown };
  if (!Array.isArray(candidate.profiles)) {
    return { activeProfileId: '', profiles: [] };
  }

  return {
    activeProfileId: '',
    profiles: candidate.profiles.map((profile) => toImportedProfile(profile)).filter((profile): profile is SettingsProfile => Boolean(profile))
  };
}

function toImportedProfile(raw: unknown): SettingsProfile | null {
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
      ? candidate.knowledgeSources.map((source) => toImportedSource(source)).filter((source): source is KnowledgeSource => Boolean(source))
      : []
  };
}

function toImportedSource(raw: unknown): KnowledgeSource | null {
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

function detectFormat(fileName: string): KnowledgeBaseFormat {
  const normalized = fileName.toLowerCase();

  if (normalized.endsWith('.json')) {
    return 'json';
  }

  if (normalized.endsWith('.md') || normalized.endsWith('.markdown')) {
    return 'markdown';
  }

  return 'text';
}

function normalizeContent(raw: string, format: KnowledgeBaseFormat): string {
  if (format !== 'json') {
    return raw;
  }

  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}
