import { ModelDescriptor } from './llm-provider';

export interface ModelRepository {
  list(): Promise<ModelDescriptor[]>;
  getDefault(): Promise<ModelDescriptor>;
  getById(modelId: string): Promise<ModelDescriptor | null>;
}
