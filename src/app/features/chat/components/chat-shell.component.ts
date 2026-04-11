import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { ChatFacade } from '../../../application/chat/chat.facade';
import { ModelFacade } from '../../../application/model/model.facade';
import { SettingsFacade } from '../../../application/settings/settings.facade';
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
  readonly chat = inject(ChatFacade);
  private readonly modelFacade = inject(ModelFacade);
  private readonly settingsFacade = inject(SettingsFacade);

  settings: SettingsProfile = { ...INITIAL_CHAT_SETTINGS };

  selectedModelLabel(): string {
    return resolveSelectedModelLabel(this.modelFacade.state.models(), this.modelFacade.state.selectedModelId());
  }

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
    return getActiveKnowledgeSources(this.settings.knowledgeSources).length;
  }

  activeKnowledgeSourcesLabel(): string {
    return getKnowledgeSourcesLabel(this.settings.knowledgeSources);
  }

  isPromptDisabled(): boolean {
    return !this.chat.state.isModelReady() || this.chat.state.status() === 'loading-model';
  }

  knowledgeBaseStatus(): string {
    if (this.activeKnowledgeSourcesCount() === 0) {
      return 'off';
    }

    return this.settings.knowledgeBaseStrictMode ? 'literal' : 'active';
  }
}
