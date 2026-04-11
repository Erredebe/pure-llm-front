import { describe, expect, it } from 'vitest';

import { renderKnowledgeCitations, retrieveKnowledgeCitations } from './knowledge-retrieval.helper';

describe('knowledge retrieval helper', () => {
  const knowledgeSources = [
    {
      id: 'source-a',
      name: 'WebGPU guide',
      enabled: true,
      format: 'markdown' as const,
      content: 'WebGPU lets the browser use the GPU for compute workloads. Chrome on Android may require recent versions and secure contexts.',
      origin: 'manual' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'source-b',
      name: 'Unrelated notes',
      enabled: true,
      format: 'text' as const,
      content: 'Tea recipes and kitchen notes for the weekend.',
      origin: 'manual' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    }
  ];

  it('retrieves the most relevant source excerpts', () => {
    const citations = retrieveKnowledgeCitations('How does WebGPU work in Chrome on Android?', knowledgeSources);

    expect(citations.length).toBeGreaterThan(0);
    expect(citations[0]?.sourceName).toBe('WebGPU guide');
  });

  it('renders citations into a prompt-friendly block', () => {
    const rendered = renderKnowledgeCitations([
      {
        sourceId: 'source-a',
        sourceName: 'WebGPU guide',
        chunkId: 'source-a:0',
        excerpt: 'WebGPU lets the browser use the GPU for compute workloads.',
        score: 6
      }
    ]);

    expect(rendered).toContain('[Citation 1]');
    expect(rendered).toContain('Source: WebGPU guide');
  });
});
