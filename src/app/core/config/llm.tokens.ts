import { InjectionToken } from '@angular/core';

import { LlmProvider } from '../../domain/contracts/llm-provider';
import { ModelRepository } from '../../domain/contracts/model-repository';
import { SettingsRepository } from '../../domain/contracts/settings-repository';

export const LLM_PROVIDER = new InjectionToken<LlmProvider>('LLM_PROVIDER');
export const MODEL_REPOSITORY = new InjectionToken<ModelRepository>('MODEL_REPOSITORY');
export const SETTINGS_REPOSITORY = new InjectionToken<SettingsRepository>('SETTINGS_REPOSITORY');
