import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { ChatFacade } from '../../../application/chat/chat.facade';
import { ModelFacade } from '../../../application/model/model.facade';
import { SettingsFacade } from '../../../application/settings/settings.facade';
import { MessageListComponent } from './message-list.component';
import { PromptInputComponent } from './prompt-input.component';
import { ModelBadgeComponent } from '../../../shared/ui/model-badge/model-badge.component';

@Component({
  selector: 'app-chat-shell',
  standalone: true,
  imports: [MessageListComponent, PromptInputComponent, ModelBadgeComponent],
  template: `
    <section class="layout">
      <article class="panel transcript">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Inference</p>
            <h2>Pure browser chat</h2>
          </div>
          @if (selectedModelLabel()) {
            <app-model-badge [label]="selectedModelLabel()"></app-model-badge>
          }
        </div>

        <app-message-list [messages]="chat.state.messages()"></app-message-list>
      </article>

      <aside class="panel composer">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Control</p>
            <h2>Prompt composer</h2>
          </div>
        </div>

        @if (!chat.state.isModelReady() && chat.state.error()) {
          <section class="notice" aria-live="polite">
            <p class="notice-title">This device cannot start the local model.</p>
            <p class="notice-copy">
              The app needs WebGPU to run WebLLM in-browser. Open Diagnostics on this phone to check support,
              then try a newer Android Chrome build or another device.
            </p>
          </section>
        }

        <app-prompt-input
          [disabled]="!chat.state.canSend()"
          (submitted)="send($event)"></app-prompt-input>

        <dl class="meta">
          <div>
            <dt>Status</dt>
            <dd>{{ chat.state.status() }}</dd>
          </div>
          <div>
            <dt>Model ready</dt>
            <dd>{{ chat.state.isModelReady() ? 'yes' : 'no' }}</dd>
          </div>
          <div>
            <dt>Temperature</dt>
            <dd>{{ settings.temperature }}</dd>
          </div>
          <div>
            <dt>Max tokens</dt>
            <dd>{{ settings.maxTokens }}</dd>
          </div>
        </dl>

        @if (chat.state.error()) {
          <p class="error">{{ chat.state.error() }}</p>
        }
      </aside>
    </section>
  `,
  styles: [
    `
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1.7fr) minmax(320px, 0.9fr);
        gap: 20px;
      }

      .panel {
        padding: 24px;
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        background: var(--surface);
        box-shadow: var(--shadow);
      }

      .transcript {
        min-height: 72vh;
      }

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }

      .eyebrow {
        margin: 0 0 8px;
        color: var(--accent);
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 0.72rem;
        font-weight: 700;
      }

      h2 {
        margin: 0;
        font-family: var(--font-display);
        font-size: 1.7rem;
      }

      .meta {
        display: grid;
        gap: 12px;
        margin: 20px 0 0;
      }

      .notice {
        margin-bottom: 18px;
        padding: 16px 18px;
        border: 1px solid rgba(166, 64, 52, 0.2);
        border-radius: var(--radius-lg);
        background: rgba(166, 64, 52, 0.08);
      }

      .notice-title,
      .notice-copy {
        margin: 0;
      }

      .notice-title {
        font-weight: 700;
      }

      .notice-copy {
        margin-top: 8px;
        color: var(--text-muted);
        line-height: 1.5;
      }

      .meta div {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--border);
      }

      dt {
        color: var(--text-muted);
      }

      dd {
        margin: 0;
        font-weight: 700;
      }

      .error {
        margin: 18px 0 0;
        color: var(--danger);
        line-height: 1.5;
      }

      @media (max-width: 940px) {
        .layout {
          grid-template-columns: 1fr;
        }

        .transcript {
          min-height: auto;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatShellComponent implements OnInit {
  readonly chat = inject(ChatFacade);
  private readonly modelFacade = inject(ModelFacade);
  private readonly settingsFacade = inject(SettingsFacade);

  settings = {
    temperature: 0.7,
    maxTokens: 256
  };

  selectedModelLabel = () => {
    const selectedId = this.modelFacade.state.selectedModelId();
    return this.modelFacade.state.models().find((model) => model.id === selectedId)?.label ?? '';
  };

  async ngOnInit(): Promise<void> {
    await this.modelFacade.bootstrap();
    const settings = await this.settingsFacade.load();
    this.settings = settings;

    if (settings.selectedModelId) {
      this.modelFacade.selectModel(settings.selectedModelId);
    }

    const selectedModel = await this.modelFacade.getSelectedModel();
    await this.chat.init(selectedModel);
  }

  async send(content: string): Promise<void> {
    await this.chat.sendUserMessage(content, this.settings);
  }
}
