import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WebLlmProvider } from './webllm.provider';
import { WebGpuRuntimeService } from '../../../core/platform/webgpu-runtime.service';

class MockWebGpuRuntimeService {
  markLoading = vi.fn();
  updateProgress = vi.fn();
  markReady = vi.fn();
  markError = vi.fn();
  reset = vi.fn();
}

const createMockEngine = (response?: string): unknown => ({
  chat: {
    completions: {
      create: vi.fn(async () => ({
        choices: [{ message: { content: response ?? '' } }]
      }))
    }
  },
  unload: vi.fn(async () => {})
});

let mockCreateMLCEngine: ReturnType<typeof vi.fn>;

vi.mock('../../../core/utils/async-dispose', () => ({
  safeAsyncDispose: vi.fn(async (obj: unknown) => {
    if (obj && typeof obj === 'object' && 'unload' in obj) {
      await (obj as { unload: () => Promise<void> }).unload();
    }
  })
}));

vi.mock('https://esm.run/@mlc-ai/web-llm', () => {
  mockCreateMLCEngine = vi.fn();
  return { CreateMLCEngine: mockCreateMLCEngine };
});

describe('WebLlmProvider', () => {
  let provider: WebLlmProvider;
  let runtime: MockWebGpuRuntimeService;

  beforeEach(() => {
    runtime = new MockWebGpuRuntimeService();
    provider = new WebLlmProvider(runtime as unknown as WebGpuRuntimeService);
    vi.clearAllMocks();
  });

  describe('isSupported', () => {
    it('returns false when navigator.gpu is undefined', async () => {
      const originalGpu = (navigator as { gpu?: unknown }).gpu;
      delete (navigator as { gpu?: unknown }).gpu;

      const result = await provider.isSupported();

      expect(result).toBe(false);
      (navigator as { gpu?: unknown }).gpu = originalGpu;
    });

    it('returns true when navigator.gpu is available', async () => {
      (navigator as { gpu?: unknown }).gpu = {};

      const result = await provider.isSupported();

      expect(result).toBe(true);
      delete (navigator as { gpu?: unknown }).gpu;
    });
  });

  describe('loadModel', () => {
    it('tracks loading state via runtime service', async () => {
      mockCreateMLCEngine.mockResolvedValue(createMockEngine());

      await provider.loadModel({ id: 'model-1', label: 'Model 1', provider: 'webllm' } as any);

      expect(runtime.markLoading).toHaveBeenCalled();
      expect(runtime.markReady).toHaveBeenCalledWith('model-1');
    });

    it('resets and reloads when model changes', async () => {
      mockCreateMLCEngine
        .mockResolvedValueOnce(createMockEngine())
        .mockResolvedValueOnce(createMockEngine());

      await provider.loadModel({ id: 'model-1', label: 'Model 1', provider: 'webllm' } as any);
      await provider.loadModel({ id: 'model-2', label: 'Model 2', provider: 'webllm' } as any);

      expect(runtime.reset).toHaveBeenCalled();
    });

    it('updates error state on load failure', async () => {
      mockCreateMLCEngine.mockRejectedValue(new Error('Init failed'));

      const model = { id: 'model-1', label: 'Model 1', provider: 'webllm' } as any;
      await expect(provider.loadModel(model)).rejects.toThrow('Init failed');

      expect(runtime.markError).toHaveBeenCalledWith('Init failed');
    });

    it('reuses same model without reloading', async () => {
      const createSpy = mockCreateMLCEngine.mockResolvedValue(createMockEngine());

      await provider.loadModel({ id: 'model-1', label: 'Model 1', provider: 'webllm' } as any);
      await provider.loadModel({ id: 'model-1', label: 'Model 1', provider: 'webllm' } as any);

      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(runtime.markReady).toHaveBeenCalledTimes(2);
    });
  });

  describe('unloadModel', () => {
    it('clears engine and resets runtime', async () => {
      mockCreateMLCEngine.mockResolvedValue(createMockEngine());

      await provider.loadModel({ id: 'model-1', label: 'Model 1', provider: 'webllm' } as any);
      await provider.unloadModel();

      expect(runtime.reset).toHaveBeenCalled();
    });
  });

  describe('generate', () => {
    it('throws error when no model is loaded', async () => {
      await expect(provider.generate([])).rejects.toThrow('No model is loaded');
    });

    it('returns full response when not streaming', async () => {
      mockCreateMLCEngine.mockResolvedValue(createMockEngine('Full response'));

      await provider.loadModel({ id: 'model-1', label: 'Model 1', provider: 'webllm' } as any);
      const result = await provider.generate([{ role: 'user', content: 'Hello' }]);

      expect(result).toBe('Full response');
    });

    it('strips thinking blocks when preserveThinking is false', async () => {
      mockCreateMLCEngine.mockResolvedValue(createMockEngine('<think>ThinkingFinal answer'));

      await provider.loadModel({ id: 'model-1', label: 'Model 1', provider: 'webllm' } as any);
      const result = await provider.generate([{ role: 'user', content: 'Hi' }]);

      expect(result).not.toContain('<think>');
      expect(result).toBe('Final answer');
    });

    it('preserves thinking blocks when preserveThinking is true', async () => {
      mockCreateMLCEngine.mockResolvedValue(createMockEngine('<think>ThinkingFinal answer'));

      await provider.loadModel({ id: 'model-1', label: 'Model 1', provider: 'webllm' } as any);
      const result = await provider.generate([{ role: 'user', content: 'Hi' }], { preserveThinking: true });

      expect(result).toContain('<think>');
      expect(result).toBe('<think>ThinkingFinal answer');
    });

    it('strips forbidden XML tags from output', async () => {
      mockCreateMLCEngine.mockResolvedValue(createMockEngine('<system-reminder>internal</system-reminder><role>assistant</role>Actual response'));

      await provider.loadModel({ id: 'model-1', label: 'Model 1', provider: 'webllm' } as any);
      const result = await provider.generate([{ role: 'user', content: 'Hi' }]);

      expect(result).not.toContain('<system-reminder>');
      expect(result).not.toContain('<role>');
      expect(result).toContain('Actual response');
    });

    it('handles incomplete system reminder tags', async () => {
      mockCreateMLCEngine.mockResolvedValue(createMockEngine('<system-reminder>partialActual response'));

      await provider.loadModel({ id: 'model-1', label: 'Model 1', provider: 'webllm' } as any);
      const result = await provider.generate([{ role: 'user', content: 'Hi' }]);

      expect(result).not.toContain('<system-reminder>');
      expect(result).toBe('Actual response');
    });

    it('calls onToken callback for each chunk when streaming', async () => {
      const mockEngine = {
        chat: {
          completions: {
            create: vi.fn(async function* () {
              yield { choices: [{ delta: { content: 'Hello ' } }] };
              yield { choices: [{ delta: { content: 'world!' } }] };
            })
          }
        }
      };
      mockCreateMLCEngine.mockResolvedValue(mockEngine);

      await provider.loadModel({ id: 'model-1', label: 'Model 1', provider: 'webllm' } as any);

      const tokens: string[] = [];
      const result = await provider.generate(
        [{ role: 'user', content: 'Hi' }],
        { onToken: (token) => tokens.push(token) }
      );

      expect(tokens).toEqual(['Hello ', 'world!']);
      expect(result).toBe('Hello world!');
    });

    it('aborts streaming when signal is aborted', async () => {
      const mockEngine = {
        chat: {
          completions: {
            create: vi.fn(async function* () {
              yield { choices: [{ delta: { content: 'first' } }] };
              yield { choices: [{ delta: { content: 'second' } }] };
              yield { choices: [{ delta: { content: 'third' } }] };
            })
          }
        }
      };
      mockCreateMLCEngine.mockResolvedValue(mockEngine);

      await provider.loadModel({ id: 'model-1', label: 'Model 1', provider: 'webllm' } as any);

      const controller = new AbortController();
      const tokens: string[] = [];

      const result = await provider.generate(
        [{ role: 'user', content: 'Hi' }],
        {
          onToken: (token) => tokens.push(token),
          signal: controller.signal
        }
      );

      expect(tokens).toEqual([]);
      expect(result).toBe('');
    });
  });
});