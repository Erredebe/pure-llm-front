import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from "@angular/core";

import { ChatFacade } from "../../../application/chat/chat.facade";
import { ModelFacade } from "../../../application/model/model.facade";
import { SettingsFacade } from "../../../application/settings/settings.facade";
import { SettingsProfile } from "../../../domain/contracts/settings-repository";
import { MessageListComponent } from "./message-list.component";
import { PromptInputComponent } from "./prompt-input.component";
import { ModelBadgeComponent } from "../../../shared/ui/model-badge/model-badge.component";

@Component({
  selector: "app-chat-shell",
  standalone: true,
  imports: [MessageListComponent, PromptInputComponent, ModelBadgeComponent],
  template: `
    <section class="layout">
      <article class="panel transcript">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Inference</p>
          </div>
          @if (selectedModelLabel()) {
            <app-model-badge [label]="selectedModelLabel()"></app-model-badge>
          }
        </div>

        <app-message-list [messages]="chat.state.messages()" [isGenerating]="chat.state.status() === 'generating'"></app-message-list>
      </article>

      <aside class="panel composer">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Control</p>
            <h2>Prompt composer</h2>
          </div>
        </div>

        <div class="composer-body">
          <div class="composer-main">
            @if (!chat.state.isModelReady() && chat.state.error()) {
              <section class="notice" aria-live="polite">
                <p class="notice-title">
                  This device cannot start the local model.
                </p>
                <p class="notice-copy">
                  The app needs WebGPU to run WebLLM in-browser. Open
                  Diagnostics on this phone to check support, then try a newer
                  Android Chrome build or another device.
                </p>
              </section>
            }

            @if (chat.state.isModelReady() || !chat.state.error()) {
              @if (activeKnowledgeSourcesCount() > 0) {
                <section class="knowledge-banner" aria-live="polite">
                  <p class="knowledge-title">Knowledge base active</p>
                  <p class="knowledge-copy">
                    {{ activeKnowledgeSourcesLabel() }}
                    ·
                    {{
                      settings.knowledgeBaseStrictMode
                        ? "literal mode"
                        : "assisted mode"
                    }}
                  </p>
                </section>
              }

              <app-prompt-input
                [disabled]="
                  !chat.state.isModelReady() ||
                  chat.state.status() === 'loading-model'
                "
                [submitDisabled]="!chat.state.canSend()"
                (submitted)="send($event)"
              ></app-prompt-input>
            }
          </div>

          <div class="composer-footer">
            <dl class="meta">
              <div>
                <dt>Status</dt>
                <dd>{{ chat.state.status() }}</dd>
              </div>
              <div>
                <dt>Model ready</dt>
                <dd>{{ chat.state.isModelReady() ? "yes" : "no" }}</dd>
              </div>
              <div>
                <dt>Temperature</dt>
                <dd>{{ settings.temperature }}</dd>
              </div>
              <div>
                <dt>Max tokens</dt>
                <dd>{{ settings.maxTokens }}</dd>
              </div>
              <div>
                <dt>Knowledge base</dt>
                <dd>
                  {{
                    activeKnowledgeSourcesCount() > 0
                      ? settings.knowledgeBaseStrictMode
                        ? "literal"
                        : "active"
                      : "off"
                  }}
                </dd>
              </div>
              <div>
                <dt>Active sources</dt>
                <dd>{{ activeKnowledgeSourcesCount() }}</dd>
              </div>
            </dl>

            @if (chat.state.error()) {
              <div class="error-box">
                <p class="error">{{ chat.state.error() }}</p>
              </div>
            }
          </div>
        </div>
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
        display: flex;
        flex-direction: column;
        min-height: 0;
        padding: 24px;
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        background: var(--surface);
        box-shadow: var(--shadow);
        overflow: hidden;
      }

      .transcript {
        overflow: hidden;
        min-height: 72vh;
        max-height: 72vh;
      }

      .composer {
        min-height: 72vh;
        max-height: 72vh;
      }

      .composer-body,
      .composer-main,
      .composer-footer {
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .composer-body {
        flex: 1;
        gap: 18px;
        overflow: hidden;
      }

      .composer-main {
        flex: 0 0 auto;
      }

      .composer-footer {
        flex: 1;
        min-height: 0;
        overflow: hidden;
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
        margin: 0;
        flex: 0 0 auto;
      }

      .knowledge-banner {
        margin-bottom: 18px;
        padding: 14px 16px;
        border: 1px solid rgba(39, 109, 88, 0.22);
        border-radius: var(--radius-lg);
        background: rgba(39, 109, 88, 0.08);
      }

      .knowledge-title,
      .knowledge-copy {
        margin: 0;
      }

      .knowledge-title {
        font-weight: 700;
      }

      .knowledge-copy {
        margin-top: 6px;
        color: var(--text-muted);
        line-height: 1.5;
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
        margin: 0;
        color: var(--danger);
        line-height: 1.5;
        overflow-wrap: anywhere;
      }

      .error-box {
        margin-top: 18px;
        max-height: 160px;
        overflow-y: auto;
        padding-right: 6px;
      }

      @media (max-width: 940px) {
        .layout {
          grid-template-columns: 1fr;
        }

        .transcript {
          min-height: 55vh;
          max-height: 55vh;
        }

        .composer {
          min-height: auto;
          max-height: none;
        }

        .composer-body,
        .composer-footer {
          overflow: visible;
        }

        .error-box {
          max-height: 120px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatShellComponent implements OnInit {
  readonly chat = inject(ChatFacade);
  private readonly modelFacade = inject(ModelFacade);
  private readonly settingsFacade = inject(SettingsFacade);

  settings: SettingsProfile = {
    id: "default",
    name: "Default",
    temperature: 0.7,
    maxTokens: 256,
    systemPrompt: "",
    knowledgeBaseStrictMode: true,
    knowledgeSources: [],
    selectedModelId: null,
  };

  selectedModelLabel = () => {
    const selectedId = this.modelFacade.state.selectedModelId();
    return (
      this.modelFacade.state.models().find((model) => model.id === selectedId)
        ?.label ?? ""
    );
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

  activeKnowledgeSourcesCount(): number {
    return this.settings.knowledgeSources.filter(
      (source) => source.enabled && source.content.trim(),
    ).length;
  }

  activeKnowledgeSourcesLabel(): string {
    const activeSources = this.settings.knowledgeSources.filter(
      (source) => source.enabled && source.content.trim(),
    );

    if (activeSources.length === 0) {
      return "No active sources";
    }

    if (activeSources.length === 1) {
      return activeSources[0].name || "Untitled source";
    }

    return `${activeSources.length} sources active`;
  }
}
