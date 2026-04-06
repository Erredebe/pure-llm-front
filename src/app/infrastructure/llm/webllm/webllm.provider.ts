import { Injectable } from '@angular/core';

import { LlmProvider, GenerateOptions, LlmMessage, ModelDescriptor } from '../../../domain/contracts/llm-provider';
import { safeAsyncDispose } from '../../../core/utils/async-dispose';

type StreamingChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
    };
    message?: {
      content?: string;
    };
  }>;
};

type WebLlmEngine = {
  unload?: () => Promise<void>;
  chat: {
    completions: {
      create: (payload: Record<string, unknown>) => Promise<StreamingChunk> | AsyncIterable<StreamingChunk>;
    };
  };
};

type WebLlmModule = {
  CreateMLCEngine: (modelId: string, options?: Record<string, unknown>) => Promise<WebLlmEngine>;
};

const WEBLLM_IMPORT_URL = 'https://esm.run/@mlc-ai/web-llm';
const importWebLlmModule = new Function('modulePath', 'return import(modulePath)') as (modulePath: string) => Promise<unknown>;

@Injectable()
export class WebLlmProvider implements LlmProvider {
  readonly name = 'webllm';

  private engine: WebLlmEngine | null = null;
  private currentModelId: string | null = null;

  async isSupported(): Promise<boolean> {
    return typeof navigator !== 'undefined' && 'gpu' in (navigator as Navigator & { gpu?: unknown });
  }

  async loadModel(model: ModelDescriptor): Promise<void> {
    if (this.currentModelId === model.id && this.engine) {
      return;
    }

    await this.unloadModel();

    const webllm = await importWebLlmModule(WEBLLM_IMPORT_URL) as WebLlmModule;

    this.engine = await webllm.CreateMLCEngine(model.id, {
      initProgressCallback: (progress: { text?: string }) => {
        console.info('WebLLM init', progress.text ?? 'loading');
      }
    });
    this.currentModelId = model.id;
  }

  async unloadModel(): Promise<void> {
    await safeAsyncDispose(this.engine);
    this.engine = null;
    this.currentModelId = null;
  }

  async generate(messages: LlmMessage[], options?: GenerateOptions): Promise<string> {
    if (!this.engine) {
      throw new Error('No model is loaded');
    }

    const request = {
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 256,
      top_p: options?.topP ?? 1,
      stream: Boolean(options?.onToken)
    };

    if (!options?.onToken) {
      const response = await this.engine.chat.completions.create(request) as StreamingChunk;
      return response.choices?.[0]?.message?.content ?? '';
    }

    const stream = await this.engine.chat.completions.create(request) as AsyncIterable<StreamingChunk>;
    let completeText = '';

    for await (const chunk of stream) {
      if (options.signal?.aborted) {
        break;
      }

      const token = chunk.choices?.[0]?.delta?.content ?? '';

      if (token) {
        completeText += token;
        options.onToken(token);
      }
    }

    return completeText;
  }
}
