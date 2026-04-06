import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { appRoutes } from '../../app.routes';
import { LLM_PROVIDER, MODEL_REPOSITORY, SETTINGS_REPOSITORY } from './llm.tokens';
import { BrowserModelRepository } from '../../infrastructure/repositories/browser-model.repository';
import { LocalStorageSettingsRepository } from '../../infrastructure/persistence/local-storage-settings.repository';
import { WebLlmProvider } from '../../infrastructure/llm/webllm/webllm.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    {
      provide: LLM_PROVIDER,
      useClass: WebLlmProvider
    },
    {
      provide: MODEL_REPOSITORY,
      useClass: BrowserModelRepository
    },
    {
      provide: SETTINGS_REPOSITORY,
      useClass: LocalStorageSettingsRepository
    }
  ]
};
