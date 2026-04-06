import { Injectable } from '@angular/core';

import { ModelDescriptor } from '../../domain/contracts/llm-provider';
import { ModelRepository } from '../../domain/contracts/model-repository';

const MODELS: ModelDescriptor[] = [
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 1B Instruct - Mobile default',
    provider: 'webllm',
    family: 'llama',
    sizeGb: 0.88,
    supportsWebGpu: true,
    recommended: true
  },
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    label: 'Qwen 2.5 0.5B Instruct - Mobile lite',
    provider: 'webllm',
    family: 'qwen',
    sizeGb: 0.95,
    supportsWebGpu: true,
    recommended: false
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    label: 'Qwen 2.5 1.5B Instruct - Mobile balanced',
    provider: 'webllm',
    family: 'qwen',
    sizeGb: 1.63,
    supportsWebGpu: true,
    recommended: false
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 3B Instruct - Mobile max',
    provider: 'webllm',
    family: 'llama',
    sizeGb: 2.26,
    supportsWebGpu: true,
    recommended: false
  },
  {
    id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    label: 'Qwen 2.5 3B Instruct - Desktop fast',
    provider: 'webllm',
    family: 'qwen',
    sizeGb: 2.5,
    supportsWebGpu: true,
    recommended: false
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    label: 'Llama 3.2 1B Instruct - Desktop quality',
    provider: 'webllm',
    family: 'llama',
    sizeGb: 1.13,
    supportsWebGpu: true,
    recommended: false
  },
  {
    id: 'Qwen3-4B-q4f16_1-MLC',
    label: 'Qwen 3 4B - Desktop quality+',
    provider: 'webllm',
    family: 'qwen',
    sizeGb: 3.43,
    supportsWebGpu: true,
    recommended: false
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC-1k',
    label: 'Phi 3.5 Mini 1k - Desktop compact',
    provider: 'webllm',
    family: 'phi',
    sizeGb: 2.52,
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
