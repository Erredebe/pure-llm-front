import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatSession, ChatSessionRepository } from '../../domain/contracts/chat-session-repository';
import { LlmMessage, LlmProvider, ModelDescriptor } from '../../domain/contracts/llm-provider';
import { ChatState } from './chat.state';
import { ChatFacade } from './chat.facade';

class MemoryChatSessionRepository implements ChatSessionRepository {
  session: ChatSession | null = null;

  async loadActiveSession(): Promise<ChatSession | null> {
    return this.session;
  }

  async saveActiveSession(session: ChatSession): Promise<void> {
    this.session = session;
  }

  async clearActiveSession(): Promise<void> {
    this.session = null;
  }
}

class MockLlmProvider implements LlmProvider {
  readonly name = 'mock';
  readonly loadModel = vi.fn(async (_model: ModelDescriptor) => {});
  readonly unloadModel = vi.fn(async () => {});
  readonly isSupported = vi.fn(async () => true);
  readonly generate = vi.fn(async (_messages: LlmMessage[], options?: { onToken?: (token: string) => void; signal?: AbortSignal }) => {
    options?.onToken?.('Hello from the local model.');
    return 'Hello from the local model.';
  });
}

const MODEL: ModelDescriptor = {
  id: 'qwen-mobile',
  label: 'Qwen mobile',
  provider: 'webllm',
  family: 'qwen',
  sizeGb: 1.7,
  supportsWebGpu: true,
  recommended: true
};

describe('ChatFacade', () => {
  let repository: MemoryChatSessionRepository;
  let provider: MockLlmProvider;
  let state: ChatState;
  let facade: ChatFacade;

  beforeEach(() => {
    repository = new MemoryChatSessionRepository();
    provider = new MockLlmProvider();
    state = new ChatState();
    facade = new ChatFacade(provider, repository, state);
  });

  it('restores a saved session when bootstrapping the same model', async () => {
    repository.session = {
      id: 'session-1',
      title: 'Stored thread',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:01.000Z',
      profileId: 'profile-1',
      modelId: MODEL.id,
      messages: [
        {
          id: 'user-1',
          role: 'user',
          content: 'Hola',
          createdAt: '2026-01-01T00:00:00.000Z'
        }
      ]
    };

    await facade.init(MODEL);

    expect(state.messages()).toHaveLength(1);
    expect(state.sessionId()).toBe('session-1');
    expect(state.isModelReady()).toBe(true);
  });

  it('persists a generated answer and can regenerate the last turn', async () => {
    await facade.init(MODEL);

    await facade.sendUserMessage('Explain WebGPU briefly', {
      id: 'profile-1',
      selectedModelId: MODEL.id,
      temperature: 0.7,
      maxTokens: 128,
      systemPrompt: '',
      knowledgeBaseStrictMode: true,
      knowledgeSources: [
        {
          id: 'source-1',
          name: 'WebGPU notes',
          enabled: true,
          format: 'markdown',
          content: 'WebGPU is a browser API for GPU compute and rendering workloads.',
          origin: 'manual',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z'
        }
      ]
    });

    expect(state.messages()).toHaveLength(2);
    expect(repository.session?.messages).toHaveLength(2);
    expect(state.messages().at(-1)?.citations?.[0]?.sourceName).toBe('WebGPU notes');

    provider.generate.mockImplementationOnce(async (_messages, options) => {
      options?.onToken?.('A regenerated answer.');
      return 'A regenerated answer.';
    });

    await facade.regenerateLastResponse({
      id: 'profile-1',
      selectedModelId: MODEL.id,
      temperature: 0.7,
      maxTokens: 128,
      systemPrompt: '',
      knowledgeBaseStrictMode: true,
      knowledgeSources: [
        {
          id: 'source-1',
          name: 'WebGPU notes',
          enabled: true,
          format: 'markdown',
          content: 'WebGPU is a browser API for GPU compute and rendering workloads.',
          origin: 'manual',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z'
        }
      ]
    });

    expect(state.messages()).toHaveLength(2);
    expect(state.messages().at(-1)?.content).toBe('A regenerated answer.');
    expect(state.messages().at(-1)?.citations?.[0]?.sourceName).toBe('WebGPU notes');
  });

  it('clears the active conversation state and storage', async () => {
    await facade.init(MODEL);
    await facade.sendUserMessage('Hola', {
      id: 'profile-1',
      selectedModelId: MODEL.id,
      temperature: 0.7,
      maxTokens: 128,
      systemPrompt: '',
      knowledgeBaseStrictMode: true,
      knowledgeSources: []
    });

    await facade.clearConversation();

    expect(state.messages()).toEqual([]);
    expect(state.sessionId()).toBeNull();
    expect(repository.session).toBeNull();
  });
});
