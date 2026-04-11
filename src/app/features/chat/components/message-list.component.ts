import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  input
} from '@angular/core';

import { ChatMessage } from '../../../domain/chat/entities/chat-message';
import { ChatMessageComponent } from '../../../shared/ui/chat-message/chat-message.component';
import { isPinnedToBottom, scheduleScrollToBottom, scrollToBottom } from './message-list-scroll.helper';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [ChatMessageComponent],
  templateUrl: './message-list.component.html',
  styleUrl: './message-list.component.css',
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
  private pinnedToBottom = true;

  constructor() {
    effect(() => {
      this.messages();

      if (!this.pinnedToBottom) {
        return;
      }

      queueMicrotask(() => this.scrollToBottom());
    });
  }

  ngAfterViewInit(): void {
    const contentElement = this.content?.nativeElement;

    if (!contentElement || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      if (!this.pinnedToBottom) {
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

    this.pinnedToBottom = isPinnedToBottom(element);
  }

  isStreamingMessage(messageId: string): boolean {
    return this.streamingMessageId() === messageId;
  }

  private scheduleScrollToBottom(): void {
    scheduleScrollToBottom(() => this.scrollToBottom());
  }

  private scrollToBottom(): void {
    const element = this.scrollHost?.nativeElement;
    if (!element) {
      return;
    }

    scrollToBottom(element);
  }
}
