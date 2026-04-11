import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WebGpuRuntimeService {
  readonly lastLoadedModelId = signal<string | null>(null);
  readonly runtimeReady = signal(false);
  readonly lastError = signal<string | null>(null);

  markLoading(): void {
    this.runtimeReady.set(false);
    this.lastError.set(null);
  }

  markReady(modelId: string): void {
    this.lastLoadedModelId.set(modelId);
    this.runtimeReady.set(true);
    this.lastError.set(null);
  }

  markError(message: string): void {
    this.runtimeReady.set(false);
    this.lastError.set(message);
  }

  reset(): void {
    this.lastLoadedModelId.set(null);
    this.runtimeReady.set(false);
    this.lastError.set(null);
  }
}
