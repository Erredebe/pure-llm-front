import { Injectable } from '@angular/core';

import { GenerateOptions, LlmMessage, LlmProvider, ModelDescriptor } from '../../../domain/contracts/llm-provider';

@Injectable()
export class TransformersProvider implements LlmProvider {
  readonly name = 'transformers';

  async isSupported(): Promise<boolean> {
    return false;
  }

  async loadModel(_: ModelDescriptor): Promise<void> {
    throw new Error('Transformers provider scaffolded but not wired yet');
  }

  async unloadModel(): Promise<void> {
    return Promise.resolve();
  }

  async generate(_: LlmMessage[], __?: GenerateOptions): Promise<string> {
    throw new Error('Transformers provider scaffolded but not wired yet');
  }
}
