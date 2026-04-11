import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';

import { ChatMessage } from '../../../domain/chat/entities/chat-message';
import { getBlockTitle, MessagePart, parseMessageContent } from './chat-message-content.helper';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [NgClass],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatMessageComponent {
  readonly message = input.required<ChatMessage>();
  readonly isStreaming = input(false);

  readonly parts = computed(() => parseMessageContent(this.message().content || '...'));

  private readonly openBlocks = signal<Record<number, boolean>>({});
  private lastStreaming = false;

  constructor() {
    effect(() => {
      const streaming = this.isStreaming();
      const parts = this.parts();
      const nextOpenState: Record<number, boolean> = {};

      for (let index = 0; index < parts.length; index += 1) {
        if (parts[index].kind !== 'think') {
          continue;
        }

        nextOpenState[index] = streaming;
      }

      if (streaming !== this.lastStreaming) {
        this.openBlocks.set(nextOpenState);
        this.lastStreaming = streaming;
        return;
      }

      this.openBlocks.update((current) => {
        const merged = { ...nextOpenState };

        for (let index = 0; index < parts.length; index += 1) {
          if (parts[index].kind !== 'think') {
            continue;
          }

          merged[index] = streaming ? true : (current[index] ?? false);
        }

        return merged;
      });
    });
  }

  isBlockOpen(index: number): boolean {
    return this.openBlocks()[index] ?? this.isStreaming();
  }

  toggleBlock(event: Event, index: number): void {
    event.preventDefault();
    this.openBlocks.update((current) => ({
      ...current,
      [index]: !this.isBlockOpen(index)
    }));
  }

  blockTitle(kind: MessagePart['kind']): string {
    return getBlockTitle(kind);
  }
}
