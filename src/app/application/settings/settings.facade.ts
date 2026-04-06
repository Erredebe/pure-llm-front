import { Inject, Injectable } from '@angular/core';

import { SETTINGS_REPOSITORY } from '../../core/config/llm.tokens';
import { AppSettings, SettingsRepository } from '../../domain/contracts/settings-repository';

@Injectable({ providedIn: 'root' })
export class SettingsFacade {
  constructor(@Inject(SETTINGS_REPOSITORY) private readonly settingsRepository: SettingsRepository) {}

  load(): Promise<AppSettings> {
    return this.settingsRepository.load();
  }

  save(settings: AppSettings): Promise<void> {
    return this.settingsRepository.save(settings);
  }
}
