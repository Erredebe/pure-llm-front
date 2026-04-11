import { Injectable } from '@angular/core';

import { ModelDescriptor } from '../../domain/contracts/llm-provider';
import { ModelRepository } from '../../domain/contracts/model-repository';

const MODELS: ModelDescriptor[] = [
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 1B Instruct - Mobile default',
    provider: 'webllm',
    family: 'llama',
    familyVariant: 'llama-3.2-small',
    sizeGb: 0.88,
    supportsWebGpu: true,
    recommended: true,
    promptProfile: 'compact-strict',
    supportsThinkingBlocks: false,
    sanitizeOutput: true,
    docsUrl: 'https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct',
    knownArtifacts: ['</output_contract>', '<system-reminder>']
  },
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    label: 'Qwen 2.5 0.5B Instruct - Mobile lite',
    provider: 'webllm',
    family: 'qwen',
    familyVariant: 'qwen-2.5',
    sizeGb: 0.95,
    supportsWebGpu: true,
    recommended: false,
    promptProfile: 'compact-strict',
    supportsThinkingBlocks: false,
    sanitizeOutput: true,
    docsUrl: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct',
    knownArtifacts: ['</output_contract>', '<system-reminder>']
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    label: 'Qwen 2.5 1.5B Instruct - Mobile balanced',
    provider: 'webllm',
    family: 'qwen',
    familyVariant: 'qwen-2.5',
    sizeGb: 1.63,
    supportsWebGpu: true,
    recommended: false,
    promptProfile: 'compact-strict',
    supportsThinkingBlocks: false,
    sanitizeOutput: true,
    docsUrl: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct',
    knownArtifacts: ['</output_contract>', '<system-reminder>']
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 3B Instruct - Mobile max',
    provider: 'webllm',
    family: 'llama',
    familyVariant: 'llama-3.2-small',
    sizeGb: 2.26,
    supportsWebGpu: true,
    recommended: false,
    promptProfile: 'compact-strict',
    supportsThinkingBlocks: false,
    sanitizeOutput: true,
    docsUrl: 'https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct',
    knownArtifacts: ['</output_contract>', '<system-reminder>']
  },
  {
    id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    label: 'Qwen 2.5 3B Instruct - Desktop fast',
    provider: 'webllm',
    family: 'qwen',
    familyVariant: 'qwen-2.5',
    sizeGb: 2.5,
    supportsWebGpu: true,
    recommended: false,
    promptProfile: 'compact-strict',
    supportsThinkingBlocks: false,
    sanitizeOutput: true,
    docsUrl: 'https://huggingface.co/Qwen/Qwen2.5-3B-Instruct',
    knownArtifacts: ['</output_contract>', '<system-reminder>']
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    label: 'Llama 3.2 1B Instruct - Desktop quality',
    provider: 'webllm',
    family: 'llama',
    familyVariant: 'llama-3.2-small',
    sizeGb: 1.13,
    supportsWebGpu: true,
    recommended: false,
    promptProfile: 'compact-strict',
    supportsThinkingBlocks: false,
    sanitizeOutput: true,
    docsUrl: 'https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct',
    knownArtifacts: ['</output_contract>', '<system-reminder>']
  },
  {
    id: 'Qwen3-4B-q4f16_1-MLC',
    label: 'Qwen 3 4B - Desktop quality+',
    provider: 'webllm',
    family: 'qwen',
    familyVariant: 'qwen-3',
    sizeGb: 3.43,
    supportsWebGpu: true,
    recommended: false,
    promptProfile: 'reasoning-strict',
    supportsThinkingBlocks: true,
    sanitizeOutput: true,
    docsUrl: 'https://huggingface.co/Qwen/Qwen3-4B',
    knownArtifacts: ['<system-reminder>']
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC-1k',
    label: 'Phi 3.5 Mini 1k - Desktop compact',
    provider: 'webllm',
    family: 'phi',
    familyVariant: 'phi-3.5',
    sizeGb: 2.52,
    supportsWebGpu: true,
    recommended: false,
    promptProfile: 'compact-strict',
    supportsThinkingBlocks: false,
    sanitizeOutput: true,
    docsUrl: 'https://huggingface.co/microsoft/Phi-3.5-mini-instruct',
    knownArtifacts: ['</output_contract>', '<system-reminder>']
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
