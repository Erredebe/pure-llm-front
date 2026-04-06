import { Injectable, signal } from '@angular/core';

import { ModelDescriptor } from '../../domain/contracts/llm-provider';

@Injectable({ providedIn: 'root' })
export class ModelState {
  readonly models = signal<ModelDescriptor[]>([]);
  readonly selectedModelId = signal<string | null>(null);
  readonly isLoading = signal(false);
}
