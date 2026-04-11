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
const STRIP_BLOCK_PATTERN = /<system-reminder>[\s\S]*?<\/system-reminder>/gi;
const FORBIDDEN_TAG_NAMES = ['system-reminder', 'output_contract', 'role', 'policy', 'conflict_policy', 'procedure', 'knowledge_base', 'user_question', 'task', 'source'];
const FORBIDDEN_TAG_PATTERN = new RegExp(`</?(?:${FORBIDDEN_TAG_NAMES.join('|')})(?:\s[^>]*)?>`, 'gi');
const TRAILING_INTERNAL_FRAGMENT_PATTERN = new RegExp(
  `<(?:/?(?:${FORBIDDEN_TAG_NAMES.filter((tag) => tag !== 'system-reminder').join('|')})[^>]*)?$`,
  'i'
);

@Injectable()
export class WebLlmProvider implements LlmProvider {
  readonly name = 'webllm';

  private engine: WebLlmEngine | null = null;
  private currentModelId: string | null = null;
  private currentModel: ModelDescriptor | null = null;

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
    this.currentModel = model;
  }

  async unloadModel(): Promise<void> {
    await safeAsyncDispose(this.engine);
    this.engine = null;
    this.currentModelId = null;
    this.currentModel = null;
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
      stream: Boolean(options?.onToken),
      extra_body: this.currentModel?.supportsThinkingBlocks ? undefined : { enable_thinking: false }
    };

    if (!options?.onToken) {
      const response = await this.engine.chat.completions.create(request) as StreamingChunk;
      return this.sanitizeVisibleContent(response.choices?.[0]?.message?.content ?? '', options?.preserveThinking ?? false);
    }

    const stream = await this.engine.chat.completions.create(request) as AsyncIterable<StreamingChunk>;
    let rawText = '';
    let emittedText = '';

    for await (const chunk of stream) {
      if (options.signal?.aborted) {
        break;
      }

      const token = chunk.choices?.[0]?.delta?.content ?? '';

      if (token) {
        rawText += token;

        const sanitizedText = this.sanitizeVisibleContent(rawText, options.preserveThinking ?? false);
        const nextDelta = sanitizedText.slice(emittedText.length);

        if (nextDelta) {
          emittedText = sanitizedText;
          options.onToken(nextDelta);
        }
      }
    }

    return emittedText;
  }

  private sanitizeVisibleContent(content: string, preserveThinking: boolean): string {
    let sanitized = content.replace(STRIP_BLOCK_PATTERN, '');

    sanitized = this.stripIncompleteSystemReminder(sanitized);
    sanitized = sanitized.replace(FORBIDDEN_TAG_PATTERN, '');
    sanitized = sanitized.replace(/Plan Mode - System Reminder:?/gi, '');

    if (!preserveThinking) {
      sanitized = sanitized.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<think>[\s\S]*$/i, '');
    }

    sanitized = this.stripTrailingInternalFragment(sanitized, preserveThinking);
    sanitized = sanitized.replace(/\n{3,}/g, '\n\n').trim();

    return sanitized;
  }

  private stripIncompleteSystemReminder(content: string): string {
    const reminderIndex = content.toLowerCase().indexOf('<system-reminder>');

    if (reminderIndex === -1) {
      return content;
    }

    const trailing = content.slice(reminderIndex).toLowerCase();
    if (trailing.includes('</system-reminder>')) {
      return content;
    }

    return content.slice(0, reminderIndex);
  }

  private stripTrailingInternalFragment(content: string, preserveThinking: boolean): string {
    const lastOpenBracket = content.lastIndexOf('<');

    if (lastOpenBracket === -1) {
      return content;
    }

    const trailingFragment = content.slice(lastOpenBracket);
    if (trailingFragment.includes('>')) {
      return content;
    }

    if (preserveThinking && /^<\/??think[^>]*$/i.test(trailingFragment)) {
      return content;
    }

    return TRAILING_INTERNAL_FRAGMENT_PATTERN.test(trailingFragment) ? content.slice(0, lastOpenBracket) : content;
  }
}
