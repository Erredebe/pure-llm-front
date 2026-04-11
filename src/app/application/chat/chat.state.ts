import { computed, Injectable, signal } from '@angular/core';

import { ChatMessage } from '../../domain/chat/entities/chat-message';

export type ChatStatus = 'idle' | 'loading-model' | 'generating' | 'stopping' | 'error';

@Injectable({ providedIn: 'root' })
export class ChatState {
  readonly messages = signal<ChatMessage[]>([]);
  readonly sessionId = signal<string | null>(null);
  readonly status = signal<ChatStatus>('idle');
  readonly error = signal<string | null>(null);
  readonly isModelReady = signal(false);
  readonly lastGenerationStopped = signal(false);
  readonly lastGeneratedAt = signal<string | null>(null);
  readonly hasMessages = computed(() => this.messages().length > 0);
  readonly canSend = computed(() => {
    return this.isModelReady() && this.status() !== 'generating' && this.status() !== 'loading-model';
  });
  readonly canStop = computed(() => this.status() === 'generating');

  reset(): void {
    this.messages.set([]);
    this.sessionId.set(null);
    this.status.set('idle');
    this.error.set(null);
    this.isModelReady.set(false);
    this.lastGenerationStopped.set(false);
    this.lastGeneratedAt.set(null);
  }
}
