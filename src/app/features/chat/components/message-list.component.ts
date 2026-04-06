import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ChatMessage } from '../../../domain/chat/entities/chat-message';
import { ChatMessageComponent } from '../../../shared/ui/chat-message/chat-message.component';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [ChatMessageComponent],
  template: `
    <section class="list">
      @for (message of messages(); track message.id) {
        <app-chat-message [message]="message"></app-chat-message>
      } @empty {
        <article class="empty">
          <h2>Ready for local inference</h2>
          <p>Load a model, keep the thread short, and stream tokens without blocking the UI.</p>
        </article>
      }
    </section>
  `,
  styles: [
    `
      .list {
        display: grid;
        gap: 14px;
      }

      .empty {
        padding: 28px;
        border: 1px dashed var(--border);
        border-radius: var(--radius-lg);
        background: rgba(255, 255, 255, 0.55);
      }

      h2,
      p {
        margin: 0;
      }

      p {
        margin-top: 8px;
        color: var(--text-muted);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageListComponent {
  readonly messages = input.required<ChatMessage[]>();
}
