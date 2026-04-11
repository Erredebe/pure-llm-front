import { vi } from 'vitest';

vi.mock('https://esm.run/@mlc-ai/web-llm', () => ({
  CreateMLCEngine: vi.fn()
}));