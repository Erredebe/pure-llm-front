import { ModelDescriptor } from '../../../domain/contracts/llm-provider';
import { KnowledgeSource, SettingsProfile } from '../../../domain/contracts/settings-repository';

export const INITIAL_CHAT_SETTINGS: SettingsProfile = {
  id: 'default',
  name: 'Default',
  temperature: 0.7,
  maxTokens: 256,
  systemPrompt: '',
  knowledgeBaseStrictMode: true,
  knowledgeSources: [],
  selectedModelId: null
};

export function resolveSelectedModelLabel(models: ModelDescriptor[], selectedModelId: string | null): string {
  return models.find((model) => model.id === selectedModelId)?.label ?? '';
}

export function getActiveKnowledgeSources(knowledgeSources: KnowledgeSource[]): KnowledgeSource[] {
  return knowledgeSources.filter((source) => source.enabled && source.content.trim());
}

export function getKnowledgeSourcesLabel(knowledgeSources: KnowledgeSource[]): string {
  const activeSources = getActiveKnowledgeSources(knowledgeSources);

  if (activeSources.length === 0) {
    return 'No active sources';
  }

  if (activeSources.length === 1) {
    return activeSources[0].name || 'Untitled source';
  }

  return `${activeSources.length} sources active`;
}
