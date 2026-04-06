import { Inject, Injectable } from '@angular/core';

import { MODEL_REPOSITORY } from '../../core/config/llm.tokens';
import { ModelDescriptor } from '../../domain/contracts/llm-provider';
import { ModelRepository } from '../../domain/contracts/model-repository';
import { ModelState } from './model.state';

@Injectable({ providedIn: 'root' })
export class ModelFacade {
  constructor(
    @Inject(MODEL_REPOSITORY) private readonly modelRepository: ModelRepository,
    readonly state: ModelState
  ) {}

  async bootstrap(): Promise<void> {
    this.state.isLoading.set(true);
    const models = await this.modelRepository.list();
    const defaultModel = await this.modelRepository.getDefault();
    this.state.models.set(models);
    this.state.selectedModelId.set(defaultModel.id);
    this.state.isLoading.set(false);
  }

  async getSelectedModel(): Promise<ModelDescriptor> {
    const modelId = this.state.selectedModelId();

    if (modelId) {
      const selected = await this.modelRepository.getById(modelId);
      if (selected) {
        return selected;
      }
    }

    return this.modelRepository.getDefault();
  }

  selectModel(modelId: string): void {
    this.state.selectedModelId.set(modelId);
  }
}
