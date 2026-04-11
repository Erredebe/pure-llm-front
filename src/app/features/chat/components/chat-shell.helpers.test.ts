import { describe, expect, it } from 'vitest';

import { getActiveKnowledgeSources, getKnowledgeSourcesLabel, resolveSelectedModelLabel } from './chat-shell.helpers';

describe('chat shell helpers', () => {
  it('filters active knowledge sources', () => {
    expect(
      getActiveKnowledgeSources([
        {
          id: 'a',
          name: 'Guide',
          enabled: true,
          format: 'markdown',
          content: '# Hello',
          origin: 'manual',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z'
        },
        {
          id: 'b',
          name: 'Disabled',
          enabled: false,
          format: 'text',
          content: 'Ignore me',
          origin: 'manual',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z'
        }
      ])
    ).toHaveLength(1);
  });

  it('resolves readable labels', () => {
    expect(
      resolveSelectedModelLabel(
        [
          {
            id: 'model-1',
            label: 'Qwen Mobile',
            provider: 'webllm',
            family: 'qwen',
            sizeGb: 1.7,
            supportsWebGpu: true,
            recommended: true
          }
        ],
        'model-1'
      )
    ).toBe('Qwen Mobile');

    expect(
      getKnowledgeSourcesLabel([
        {
          id: 'a',
          name: 'Guide',
          enabled: true,
          format: 'markdown',
          content: '# Hello',
          origin: 'manual',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z'
        },
        {
          id: 'b',
          name: 'FAQ',
          enabled: true,
          format: 'text',
          content: 'Answer',
          origin: 'manual',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z'
        }
      ])
    ).toBe('2 sources active');
  });
});
