export type ChatRole = 'system' | 'user' | 'assistant';

export interface LlmMessage {
  role: ChatRole;
  content: string;
}

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  signal?: AbortSignal;
  onToken?: (token: string) => void;
}

export interface ModelDescriptor {
  id: string;
  label: string;
  provider: 'webllm' | 'transformers';
  family: string;
  sizeGb: number;
  supportsWebGpu: boolean;
  recommended: boolean;
}

export interface LlmProvider {
  readonly name: string;
  isSupported(): Promise<boolean>;
  loadModel(model: ModelDescriptor): Promise<void>;
  unloadModel(): Promise<void>;
  generate(messages: LlmMessage[], options?: GenerateOptions): Promise<string>;
}
