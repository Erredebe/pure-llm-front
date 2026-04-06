import { Inject, Injectable } from '@angular/core';

import { LLM_PROVIDER } from '../../core/config/llm.tokens';
import { LlmMessage, LlmProvider, ModelDescriptor } from '../../domain/contracts/llm-provider';
import { ChatState } from './chat.state';

@Injectable({ providedIn: 'root' })
export class ChatFacade {
  constructor(
    @Inject(LLM_PROVIDER) private readonly llmProvider: LlmProvider,
    readonly state: ChatState
  ) {}

  async init(model: ModelDescriptor): Promise<void> {
    this.state.isModelReady.set(false);
    this.state.status.set('loading-model');
    this.state.error.set(null);

    try {
      const isSupported = await this.llmProvider.isSupported();

      if (!isSupported) {
        this.state.isModelReady.set(false);
        this.state.status.set('error');
        this.state.error.set(
          'This browser does not support WebGPU yet. On Android, try Chrome 121+ or a device/browser with WebGPU enabled, or open Diagnostics to verify support.'
        );
        return;
      }

      await this.llmProvider.loadModel(model);
      this.state.isModelReady.set(true);
      this.state.status.set('idle');
    } catch (error) {
      this.state.isModelReady.set(false);
      this.state.status.set('error');
      this.state.error.set(this.toErrorMessage(error));
    }
  }

  async sendUserMessage(content: string, options: { temperature: number; maxTokens: number }): Promise<void> {
    if (!this.state.isModelReady()) {
      this.state.status.set('error');
      this.state.error.set('The model is still loading or failed to initialize');
      return;
    }

    const userMessage = this.createMessage('user', content);
    const assistantMessage = this.createMessage('assistant', '');

    this.state.messages.update((messages) => [...messages, userMessage, assistantMessage]);
    this.state.status.set('generating');

    try {
      const prompt = this.toLlmMessages(this.state.messages().slice(0, -1));

      await this.llmProvider.generate(prompt, {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        onToken: (token) => {
          this.state.messages.update((messages) => {
            const nextMessages = [...messages];
            const lastMessage = nextMessages.at(-1);

            if (!lastMessage) {
              return messages;
            }

            nextMessages[nextMessages.length - 1] = {
              ...lastMessage,
              content: lastMessage.content + token
            };

            return nextMessages;
          });
        }
      });

      this.state.status.set('idle');
    } catch (error) {
      this.state.status.set('error');
      this.state.error.set(this.toErrorMessage(error));
    }
  }

  private createMessage(role: 'user' | 'assistant', content: string) {
    return {
      id: crypto.randomUUID(),
      role,
      content,
      createdAt: new Date().toISOString()
    };
  }

  private toLlmMessages(messages: ReturnType<typeof this.state.messages>): LlmMessage[] {
    return messages.map((message) => ({
      role: message.role,
      content: message.content
    }));
  }

  private toErrorMessage(error: unknown): string {
    if (!(error instanceof Error)) {
      return 'Unexpected LLM error';
    }

    if (/CreateComputePipelines|VK_ERROR_UNKNOWN|vulkan|dawn/i.test(error.message)) {
      return 'This device exposes WebGPU, but its Android GPU driver fails while preparing local inference. Try another browser/device, or open Diagnostics for more details.';
    }

    if (/out of memory|allocation|insufficient/i.test(error.message)) {
      return 'The selected model is too heavy for this device. Try a smaller mobile model from the Models page.';
    }

    return error.message;
  }
}
