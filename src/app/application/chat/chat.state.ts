import { computed, Injectable, signal } from '@angular/core';

import { ChatMessage } from '../../domain/chat/entities/chat-message';

export type ChatStatus = 'idle' | 'loading-model' | 'generating' | 'error';

@Injectable({ providedIn: 'root' })
export class ChatState {
  readonly messages = signal<ChatMessage[]>([]);
  readonly status = signal<ChatStatus>('idle');
  readonly error = signal<string | null>(null);
  readonly isModelReady = signal(false);
  readonly canSend = computed(() => {
    return this.isModelReady() && this.status() !== 'generating' && this.status() !== 'loading-model';
  });

  reset(): void {
    this.messages.set([]);
    this.status.set('idle');
    this.error.set(null);
    this.isModelReady.set(false);
  }
}
