import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { NgClass } from '@angular/common';

import { ChatMessage } from '../../../domain/chat/entities/chat-message';

type SpecialBlockKind = 'think' | 'system-reminder';

interface MessagePart {
  kind: 'text' | SpecialBlockKind;
  content: string;
}

const SPECIAL_BLOCK_PATTERN = /<(think|system-reminder)>([\s\S]*?)<\/\1>/g;

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [NgClass],
  template: `
    <article class="message" [ngClass]="message().role">
      <header>{{ message().role }}</header>

      @for (part of parts(); track $index) {
        @if (part.kind === 'text') {
          <p class="message-copy">{{ part.content || '...' }}</p>
        } @else {
          <details class="special-block" [ngClass]="part.kind" [open]="isBlockOpen($index)">
            <summary (click)="toggleBlock($event, $index)">
              <span>{{ getBlockTitle(part.kind) }}</span>
              <small>{{ isStreaming() ? 'visible during generation' : 'collapsed after reply' }}</small>
            </summary>
            <pre>{{ part.content.trim() }}</pre>
          </details>
        }
      }
    </article>
  `,
  styles: [
    `
      .message {
        padding: 16px 18px;
        border-radius: var(--radius-md);
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.72);
      }

      .message.user {
        background: rgba(243, 179, 122, 0.24);
      }

      .message.assistant {
        background: rgba(255, 255, 255, 0.92);
      }

      header {
        margin-bottom: 8px;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--text-muted);
        font-weight: 700;
      }

      .message-copy {
        margin: 0;
        line-height: 1.6;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      .message-copy + .message-copy,
      .message-copy + .special-block,
      .special-block + .message-copy,
      .special-block + .special-block {
        margin-top: 12px;
      }

      .special-block {
        border: 1px solid rgba(199, 93, 44, 0.16);
        border-radius: 14px;
        background: rgba(250, 244, 236, 0.95);
        overflow: hidden;
      }

      .special-block.system-reminder {
        border-color: rgba(39, 109, 88, 0.18);
        background: rgba(237, 246, 243, 0.95);
      }

      summary {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        padding: 12px 14px;
        cursor: pointer;
        list-style: none;
        user-select: none;
      }

      summary::-webkit-details-marker {
        display: none;
      }

      summary span {
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      summary small {
        color: var(--text-muted);
        text-align: right;
      }

      pre {
        margin: 0;
        padding: 0 14px 14px;
        color: rgba(43, 28, 17, 0.86);
        font: 0.92rem/1.6 'Cascadia Mono', 'Consolas', monospace;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatMessageComponent {
  readonly message = input.required<ChatMessage>();
  readonly isStreaming = input(false);

  readonly parts = computed(() => this.parseContent(this.message().content || '...'));

  private readonly openBlocks = signal<Record<number, boolean>>({});
  private lastStreaming = false;

  constructor() {
    effect(() => {
      const streaming = this.isStreaming();
      const parts = this.parts();
      const nextOpenState: Record<number, boolean> = {};

      for (let index = 0; index < parts.length; index += 1) {
        if (parts[index].kind === 'text') {
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
          if (parts[index].kind === 'text') {
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

  getBlockTitle(kind: MessagePart['kind']): string {
    if (kind === 'think') {
      return 'Thinking';
    }

    return 'System Reminder';
  }

  private parseContent(content: string): MessagePart[] {
    const parts: MessagePart[] = [];
    let cursor = 0;

    for (const match of content.matchAll(SPECIAL_BLOCK_PATTERN)) {
      const matchIndex = match.index ?? 0;
      const fullMatch = match[0];
      const kind = match[1] as SpecialBlockKind;
      const blockContent = match[2];

      if (matchIndex > cursor) {
        parts.push({
          kind: 'text',
          content: content.slice(cursor, matchIndex).trim()
        });
      }

      parts.push({
        kind,
        content: blockContent
      });

      cursor = matchIndex + fullMatch.length;
    }

    if (cursor < content.length) {
      const trailing = content.slice(cursor);
      const pendingBlock = this.parsePendingSpecialBlock(trailing);

      if (pendingBlock) {
        parts.push(pendingBlock);
      } else {
        parts.push({
          kind: 'text',
          content: trailing.trim()
        });
      }
    }

    return parts.filter((part) => part.content.trim().length > 0);
  }

  private parsePendingSpecialBlock(content: string): MessagePart | null {
    const trimmed = content.trimStart();

    if (trimmed.startsWith('<think>')) {
      return {
        kind: 'think',
        content: trimmed.slice('<think>'.length)
      };
    }

    if (trimmed.startsWith('<system-reminder>')) {
      return {
        kind: 'system-reminder',
        content: trimmed.slice('<system-reminder>'.length)
      };
    }

    return null;
  }
}
