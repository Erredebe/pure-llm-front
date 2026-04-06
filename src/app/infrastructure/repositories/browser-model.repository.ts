import { Injectable } from '@angular/core';

import { ModelDescriptor } from '../../domain/contracts/llm-provider';
import { ModelRepository } from '../../domain/contracts/model-repository';

const MODELS: ModelDescriptor[] = [
  {
    id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    label: 'Llama 3.2 1B Instruct',
    provider: 'webllm',
    family: 'llama',
    sizeGb: 0.8,
    supportsWebGpu: true,
    recommended: true
  },
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    label: 'Qwen 2.5 0.5B Instruct',
    provider: 'webllm',
    family: 'qwen',
    sizeGb: 0.55,
    supportsWebGpu: true,
    recommended: false
  }
];

@Injectable()
export class BrowserModelRepository implements ModelRepository {
  async list(): Promise<ModelDescriptor[]> {
    return MODELS;
  }

  async getDefault(): Promise<ModelDescriptor> {
    return MODELS.find((model) => model.recommended) ?? MODELS[0];
  }

  async getById(modelId: string): Promise<ModelDescriptor | null> {
    return MODELS.find((model) => model.id === modelId) ?? null;
  }
}
