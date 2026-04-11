import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';

import { AppSessionFacade } from '../../../application/session/app-session.facade';
import { ChatFacade } from '../../../application/chat/chat.facade';
import { ModelFacade } from '../../../application/model/model.facade';
import { WebGpuRuntimeService } from '../../../core/platform/webgpu-runtime.service';
import { SettingsProfile } from '../../../domain/contracts/settings-repository';
import { ModelBadgeComponent } from '../../../shared/ui/model-badge/model-badge.component';
import {
  getActiveKnowledgeSources,
  getKnowledgeSourcesLabel,
  INITIAL_CHAT_SETTINGS,
  resolveSelectedModelLabel
} from './chat-shell.helpers';
import { MessageListComponent } from './message-list.component';
import { PromptInputComponent } from './prompt-input.component';

@Component({
  selector: 'app-chat-shell',
  standalone: true,
  imports: [MessageListComponent, PromptInputComponent, ModelBadgeComponent],
  templateUrl: './chat-shell.component.html',
  styleUrl: './chat-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatShellComponent implements OnInit {
  readonly appSession = inject(AppSessionFacade);
  readonly chat = inject(ChatFacade);
  readonly runtime = inject(WebGpuRuntimeService);
  private readonly modelFacade = inject(ModelFacade);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  settings: SettingsProfile = { ...INITIAL_CHAT_SETTINGS };

  selectedModelLabel(): string {
    return resolveSelectedModelLabel(this.modelFacade.state.models(), this.modelFacade.state.selectedModelId());
  }

  async ngOnInit(): Promise<void> {
    await this.appSession.bootstrap();
    await this.appSession.ensureChatReady();
    this.settings = this.appSession.state.activeProfile() ?? { ...INITIAL_CHAT_SETTINGS };
    this.changeDetectorRef.markForCheck();
  }

  async send(content: string): Promise<void> {
    await this.chat.sendUserMessage(content, this.settings);
  }

  async regenerate(): Promise<void> {
    await this.chat.regenerateLastResponse(this.settings);
  }

  async clearConversation(): Promise<void> {
    await this.chat.clearConversation();
  }

  stopGeneration(): void {
    this.chat.stopGeneration();
  }

  activeKnowledgeSourcesCount(): number {
    return getActiveKnowledgeSources(this.settings.knowledgeSources).length;
  }

  activeKnowledgeSourcesLabel(): string {
    return getKnowledgeSourcesLabel(this.settings.knowledgeSources);
  }

  isPromptDisabled(): boolean {
    return !this.chat.state.isModelReady() || this.chat.state.status() === 'loading-model' || this.chat.state.status() === 'stopping';
  }

  knowledgeBaseStatus(): string {
    if (this.activeKnowledgeSourcesCount() === 0) {
      return 'off';
    }

    return this.settings.knowledgeBaseStrictMode ? 'literal' : 'active';
  }

  runtimeProgress(): string {
    return this.runtime.lastProgressMessage() ?? '';
  }
}
