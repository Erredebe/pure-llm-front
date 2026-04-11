import { computed, Injectable, signal } from '@angular/core';

import { ModelDescriptor } from '../../domain/contracts/llm-provider';
import { SettingsProfile } from '../../domain/contracts/settings-repository';

export type AppSessionStatus = 'idle' | 'bootstrapping' | 'ready' | 'error';

@Injectable({ providedIn: 'root' })
export class AppSessionState {
  readonly status = signal<AppSessionStatus>('idle');
  readonly error = signal<string | null>(null);
  readonly activeProfile = signal<SettingsProfile | null>(null);
  readonly selectedModel = signal<ModelDescriptor | null>(null);
  readonly isReady = computed(() => this.status() === 'ready' && Boolean(this.activeProfile()) && Boolean(this.selectedModel()));
}
