import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

import { ChatMessage } from '../../../domain/chat/entities/chat-message';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [NgClass],
  template: `
    <article class="message" [ngClass]="message().role">
      <header>{{ message().role }}</header>
      <p>{{ message().content || '...' }}</p>
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

      p {
        margin: 0;
        line-height: 1.6;
        white-space: pre-wrap;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatMessageComponent {
  readonly message = input.required<ChatMessage>();
}
