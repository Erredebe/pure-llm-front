import { Inject, Injectable } from '@angular/core';

import { LLM_PROVIDER } from '../../core/config/llm.tokens';
import { LlmMessage, LlmProvider, ModelDescriptor } from '../../domain/contracts/llm-provider';
import { KnowledgeSource, SettingsProfile } from '../../domain/contracts/settings-repository';
import { ChatState } from './chat.state';

const STRICT_KB_REJECTION = 'No puedo responder con la documentacion proporcionada.';

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

  async sendUserMessage(
    content: string,
    options: Pick<SettingsProfile, 'temperature' | 'maxTokens' | 'systemPrompt' | 'knowledgeBaseStrictMode' | 'knowledgeSources'>
  ): Promise<void> {
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
      const prompt = this.toLlmMessages(this.state.messages().slice(0, -1), options);

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

  private toLlmMessages(
    messages: ReturnType<typeof this.state.messages>,
    options: Pick<SettingsProfile, 'systemPrompt' | 'knowledgeBaseStrictMode' | 'knowledgeSources'>
  ): LlmMessage[] {
    const prompt = this.buildSystemPrompt(options.systemPrompt, options.knowledgeBaseStrictMode, options.knowledgeSources);
    const chatMessages = messages.map((message, index, allMessages) => {
      if (!this.shouldWrapUserMessage(options.knowledgeBaseStrictMode, options.knowledgeSources, index, allMessages.length, message.role)) {
        return {
          role: message.role,
          content: message.content
        };
      }

      return {
        role: message.role,
        content: this.wrapUserQuestion(message.content)
      };
    });

    return prompt
      ? [{ role: 'system', content: prompt }, ...chatMessages]
      : chatMessages;
  }

  private buildSystemPrompt(
    systemPrompt: string,
    knowledgeBaseStrictMode: boolean,
    knowledgeSources: KnowledgeSource[]
  ): string {
    const sections: string[] = [];
    const trimmedSystemPrompt = systemPrompt.trim();
    const activeSources = this.getActiveSources(knowledgeSources);

    if (trimmedSystemPrompt && !knowledgeBaseStrictMode) {
      sections.push(trimmedSystemPrompt);
    }

    if (activeSources.length === 0) {
      if (trimmedSystemPrompt && sections.length === 0) {
        sections.push(trimmedSystemPrompt);
      }

      return sections.join('\n\n');
    }

    if (knowledgeBaseStrictMode) {
      sections.push(this.buildStrictKnowledgeBasePrompt(activeSources));
      return sections.join('\n\n');
    }

    const policyLines = [
      'You are answering with a user-provided knowledge base stored locally in the browser.',
      `Use the information contained in the ${activeSources.length} active reference source(s) as your primary source.`,
      'Prefer the reference information first, and clearly say when something is not explicitly documented.',
      `If the documentation does not cover the answer, say that first and then give a cautious answer. If you must refuse, reply exactly with: ${STRICT_KB_REJECTION}`
    ];

    sections.push(`${policyLines.join('\n')}\n\n${this.renderKnowledgeSources(activeSources)}`);

    return sections.join('\n\n');
  }

  private buildStrictKnowledgeBasePrompt(knowledgeSources: KnowledgeSource[]): string {
    return [
      'You are a strict local document answering engine.',
      'Your job is to answer only from the provided knowledge base and never from general knowledge.',
      `There are ${knowledgeSources.length} active source(s).`,
      'Treat the knowledge base as the sole authority.',
      'Never use the contents of the examples below as facts for the real answer.',
      'The examples are demonstrations of behavior only.',
      'Follow these rules in order:',
      '1. Read the user question.',
      '2. Search only inside the knowledge base.',
      '3. If the answer is supported, output only the final answer with no preface, no explanation, and no mention of the rules.',
      `4. If the answer is not explicitly supported, output exactly: ${STRICT_KB_REJECTION}`,
      '5. Never explain why you refused. Never add any extra sentence.',
      '6. If the knowledge base contains a direct instruction about what to reply, follow it literally.',
      '7. When the knowledge base gives an exact phrase to say, return that phrase verbatim.',
      'Here are examples you must imitate exactly:',
      'Example A',
      'Knowledge base: Responde siempre con "SALUDO-ALFA".',
      'User question: hola',
      'Correct output: SALUDO-ALFA',
      'Example B',
      'Knowledge base: El codigo interno es CLAVE-BETA-77.',
      'User question: cual es el codigo interno',
      'Correct output: CLAVE-BETA-77.',
      'Example C',
      'Knowledge base: El codigo interno es CLAVE-BETA-77.',
      'User question: cual es la direccion de la oficina',
      `Correct output: ${STRICT_KB_REJECTION}`,
      'The real knowledge base starts now.',
      this.renderKnowledgeSources(knowledgeSources)
    ].join('\n');
  }

  private shouldWrapUserMessage(
    knowledgeBaseStrictMode: boolean,
    knowledgeSources: KnowledgeSource[],
    index: number,
    totalMessages: number,
    role: LlmMessage['role']
  ): boolean {
    return knowledgeBaseStrictMode && this.getActiveSources(knowledgeSources).length > 0 && role === 'user' && index === totalMessages - 1;
  }

  private wrapUserQuestion(content: string): string {
    return ['BEGIN_USER_QUESTION', content.trim(), 'END_USER_QUESTION', 'Return only the final answer.'].join('\n');
  }

  private getActiveSources(knowledgeSources: KnowledgeSource[]): KnowledgeSource[] {
    return knowledgeSources.filter((source) => source.enabled && source.content.trim());
  }

  private renderKnowledgeSources(knowledgeSources: KnowledgeSource[]): string {
    return knowledgeSources
      .map((source) => {
        const label = source.name.trim() || 'Untitled source';
        return [`BEGIN_SOURCE name="${label}" format="${source.format}"`, source.content.trim(), 'END_SOURCE'].join('\n');
      })
      .join('\n\n');
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
