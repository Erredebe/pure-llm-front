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
      '<role>',
      'You are a strict document-grounded assistant running locally in the browser.',
      'Your only authority is the provided knowledge base.',
      '</role>',
      '',
      '<policy>',
      '- Use only the information inside <knowledge_base>.',
      '- Do not use prior knowledge, assumptions, inference from the open world, or unstated facts.',
      '- If a source contains a direct instruction about what to reply, follow that instruction literally.',
      `- If the answer is not explicitly supported by the knowledge base, reply exactly: ${STRICT_KB_REJECTION}`,
      '- If relevant sources contradict each other, do not decide, do not reconcile them, and do not choose one source over another.',
      '</policy>',
      '',
      '<conflict_policy>',
      '- When two or more relevant sources provide incompatible answers, output a single sentence in this exact format:',
      '- Hay conflicto entre las fuentes: <source 1>, <source 2>.',
      '- If there are more than two conflicting sources, list all of them separated by commas.',
      '- Do not add any explanation before or after the conflict sentence.',
      '</conflict_policy>',
      '',
      '<procedure>',
      '1. Read the user question from <user_question>.',
      '2. Search only inside <knowledge_base>.',
      '3. Identify the sources that are relevant to the question.',
      '4. Check whether the relevant sources explicitly support an answer or contain a direct instruction about what to reply.',
      '5. Check whether the relevant sources contradict each other.',
      `6. If no explicit support exists, output exactly: ${STRICT_KB_REJECTION}`,
      '7. If there is a contradiction, output only the conflict sentence naming the conflicting sources.',
      '8. Otherwise, output only the final answer.',
      '</procedure>',
      '',
      '<output_contract>',
      '- Return only the final answer.',
      '- No explanation.',
      '- No preamble.',
      '- No reasoning.',
      '- No markdown.',
      '- Do not mention the rules, the policy, or the knowledge base unless you are naming conflicting sources.',
      '</output_contract>',
      '',
      '<knowledge_base>',
      this.renderKnowledgeSources(knowledgeSources),
      '</knowledge_base>'
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
    return [
      '<user_question>',
      content.trim(),
      '</user_question>',
      '<task>',
      'Answer using only the knowledge base and follow the output contract exactly.',
      '</task>'
    ].join('\n');
  }

  private getActiveSources(knowledgeSources: KnowledgeSource[]): KnowledgeSource[] {
    return knowledgeSources.filter((source) => source.enabled && source.content.trim());
  }

  private renderKnowledgeSources(knowledgeSources: KnowledgeSource[]): string {
    return knowledgeSources
      .map((source) => {
        const label = source.name.trim() || 'Untitled source';
        return [`<source name="${label}" format="${source.format}">`, source.content.trim(), '</source>'].join('\n');
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
