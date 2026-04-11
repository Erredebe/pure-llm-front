import { Injectable, signal } from '@angular/core';

export type WebGpuRuntimeStatus = 'idle' | 'loading' | 'ready' | 'error';

@Injectable({ providedIn: 'root' })
export class WebGpuRuntimeService {
  readonly lastLoadedModelId = signal<string | null>(null);
  readonly lastProgressMessage = signal<string | null>(null);
  readonly status = signal<WebGpuRuntimeStatus>('idle');
  readonly runtimeReady = signal(false);
  readonly lastError = signal<string | null>(null);

  markLoading(): void {
    this.status.set('loading');
    this.runtimeReady.set(false);
    this.lastError.set(null);
  }

  updateProgress(message: string): void {
    this.lastProgressMessage.set(message);
  }

  markReady(modelId: string): void {
    this.status.set('ready');
    this.lastLoadedModelId.set(modelId);
    this.lastProgressMessage.set('Model runtime ready');
    this.runtimeReady.set(true);
    this.lastError.set(null);
  }

  markError(message: string): void {
    this.status.set('error');
    this.runtimeReady.set(false);
    this.lastError.set(message);
  }

  reset(): void {
    this.lastLoadedModelId.set(null);
    this.lastProgressMessage.set(null);
    this.status.set('idle');
    this.runtimeReady.set(false);
    this.lastError.set(null);
  }
}
