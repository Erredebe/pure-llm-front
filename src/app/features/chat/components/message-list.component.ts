import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  afterNextRender,
  computed,
  effect,
  input
} from '@angular/core';

import { ChatMessage } from '../../../domain/chat/entities/chat-message';
import { ChatMessageComponent } from '../../../shared/ui/chat-message/chat-message.component';

const PIN_THRESHOLD_PX = 48;

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [ChatMessageComponent],
  template: `
    <section #scrollHost class="list" (scroll)="onScroll()">
      <div #content class="content">
        @for (message of messages(); track message.id) {
          <app-chat-message [message]="message" [isStreaming]="isStreamingMessage(message.id)"></app-chat-message>
        } @empty {
          <article class="empty">
            <h2>Ready for local inference</h2>
            <p>Load a model, keep the thread short, and stream tokens without blocking the UI.</p>
          </article>
        }

        <div class="bottom-anchor" aria-hidden="true"></div>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1;
        min-height: 0;
      }

      .list {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding-right: 6px;
        scrollbar-gutter: stable;
      }

      .content {
        display: grid;
        gap: 14px;
        align-content: start;
        min-height: 100%;
      }

      .bottom-anchor {
        width: 100%;
        height: 1px;
      }

      .list::-webkit-scrollbar {
        width: 10px;
      }

      .list::-webkit-scrollbar-thumb {
        border-radius: 999px;
        background: rgba(199, 93, 44, 0.35);
      }

      .list::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.35);
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
export class MessageListComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scrollHost', { read: ElementRef }) private readonly scrollHost?: ElementRef<HTMLElement>;
  @ViewChild('content', { read: ElementRef }) private readonly content?: ElementRef<HTMLElement>;
  readonly messages = input.required<ChatMessage[]>();
  readonly isGenerating = input(false);

  readonly streamingMessageId = computed(() => {
    if (!this.isGenerating()) {
      return null;
    }

    const lastAssistantMessage = [...this.messages()].reverse().find((message) => message.role === 'assistant');
    return lastAssistantMessage?.id ?? null;
  });

  private resizeObserver: ResizeObserver | null = null;
  private isPinnedToBottom = true;

  constructor() {
    effect(() => {
      this.messages();
      this.isPinnedToBottom = true;
      if (!this.isPinnedToBottom) {
        return;
      }

      afterNextRender(() => this.scrollToBottom());
    });
  }

  ngAfterViewInit(): void {
    const contentElement = this.content?.nativeElement;

    if (!contentElement || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      if (!this.isPinnedToBottom) {
        return;
      }

      this.scheduleScrollToBottom();
    });

    this.resizeObserver.observe(contentElement);
    this.scheduleScrollToBottom();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  onScroll(): void {
    const element = this.scrollHost?.nativeElement;
    if (!element) {
      return;
    }

    const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    this.isPinnedToBottom = distanceToBottom <= PIN_THRESHOLD_PX;
  }

  private scheduleScrollToBottom(): void {
    requestAnimationFrame(() => this.scrollToBottom());
  }

  isStreamingMessage(messageId: string): boolean {
    return this.streamingMessageId() === messageId;
  }

  private scrollToBottom(): void {
    const element = this.scrollHost?.nativeElement;
    if (!element) {
      return;
    }

    element.scrollTo({ top: element.scrollHeight, behavior: 'auto' });
  }
}
