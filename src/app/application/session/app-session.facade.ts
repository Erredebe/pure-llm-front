import { Injectable } from '@angular/core';

import { ChatFacade } from '../chat/chat.facade';
import { ModelFacade } from '../model/model.facade';
import { SettingsFacade } from '../settings/settings.facade';
import { SettingsProfile } from '../../domain/contracts/settings-repository';
import { AppSessionState } from './app-session.state';

@Injectable({ providedIn: 'root' })
export class AppSessionFacade {
  constructor(
    private readonly chatFacade: ChatFacade,
    private readonly modelFacade: ModelFacade,
    private readonly settingsFacade: SettingsFacade,
    readonly state: AppSessionState
  ) {}

  async bootstrap(): Promise<void> {
    this.state.status.set('bootstrapping');
    this.state.error.set(null);

    try {
      const profile = await this.settingsFacade.load();
      await this.modelFacade.bootstrap(profile.selectedModelId);
      const selectedModel = await this.modelFacade.getSelectedModel();

      const nextProfile = {
        ...profile,
        selectedModelId: selectedModel.id
      } satisfies SettingsProfile;

      this.state.activeProfile.set(nextProfile);
      this.state.selectedModel.set(selectedModel);
      this.state.status.set('ready');
    } catch (error) {
      this.state.status.set('error');
      this.state.error.set(error instanceof Error ? error.message : 'Unable to bootstrap the local workspace');
    }
  }

  async ensureChatReady(): Promise<void> {
    const selectedModel = this.state.selectedModel();
    if (!selectedModel) {
      await this.bootstrap();
    }

    const modelToLoad = this.state.selectedModel();
    if (!modelToLoad) {
      return;
    }

    this.state.status.set('bootstrapping');
    this.state.error.set(null);

    try {
      await this.chatFacade.init(modelToLoad);
      this.state.status.set('ready');
    } catch (error) {
      this.state.status.set('error');
      this.state.error.set(error instanceof Error ? error.message : 'Unable to prepare the local chat runtime');
    }
  }

  async reloadActiveProfile(): Promise<SettingsProfile> {
    const profile = await this.settingsFacade.load();
    this.state.activeProfile.set(profile);
    return profile;
  }

  async selectModel(modelId: string): Promise<void> {
    this.modelFacade.selectModel(modelId);
    const profile = await this.settingsFacade.updateActiveProfile({ selectedModelId: modelId });
    const selectedModel = await this.modelFacade.getSelectedModel();

    this.state.status.set('bootstrapping');
    this.state.error.set(null);

    try {
      await this.chatFacade.init(selectedModel);
      this.state.activeProfile.set(profile);
      this.state.selectedModel.set(selectedModel);
      this.state.status.set('ready');
    } catch (error) {
      this.state.status.set('error');
      this.state.error.set(error instanceof Error ? error.message : 'Unable to load the selected model');
    }
  }
}
