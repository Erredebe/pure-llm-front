import { KnowledgeSource } from '../../domain/contracts/settings-repository';
import { KnowledgeCitation } from '../../domain/chat/entities/knowledge-citation';

type KnowledgeChunk = {
  id: string;
  sourceId: string;
  sourceName: string;
  content: string;
  normalizedContent: string;
};

const CHUNK_SIZE = 700;
const CHUNK_OVERLAP = 120;
const MAX_RETRIEVED_CHUNKS = 4;
const TOKEN_PATTERN = /[a-z0-9áéíóúüñ]{3,}/gi;

export function retrieveKnowledgeCitations(question: string, knowledgeSources: KnowledgeSource[]): KnowledgeCitation[] {
  const queryTokens = tokenize(question);
  const activeSources = knowledgeSources.filter((source) => source.enabled && source.content.trim());

  if (!question.trim() || activeSources.length === 0 || queryTokens.length === 0) {
    return [];
  }

  return activeSources
    .flatMap((source) => chunkSource(source))
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, queryTokens) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_RETRIEVED_CHUNKS)
    .map(({ chunk, score }) => ({
      sourceId: chunk.sourceId,
      sourceName: chunk.sourceName,
      chunkId: chunk.id,
      excerpt: toExcerpt(chunk.content),
      score
    }));
}

export function renderKnowledgeCitations(citations: KnowledgeCitation[]): string {
  return citations
    .map((citation, index) => {
      return [`[Citation ${index + 1}]`, `Source: ${citation.sourceName}`, citation.excerpt].join('\n');
    })
    .join('\n\n');
}

function chunkSource(source: KnowledgeSource): KnowledgeChunk[] {
  const content = source.content.trim();
  if (!content) {
    return [];
  }

  const chunks: KnowledgeChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < content.length) {
    const end = Math.min(content.length, start + CHUNK_SIZE);
    const slice = content.slice(start, end).trim();

    if (slice) {
      chunks.push({
        id: `${source.id}:${index}`,
        sourceId: source.id,
        sourceName: source.name.trim() || 'Untitled source',
        content: slice,
        normalizedContent: normalizeText(slice)
      });
      index += 1;
    }

    if (end === content.length) {
      break;
    }

    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}

function scoreChunk(chunk: KnowledgeChunk, queryTokens: string[]): number {
  let score = 0;

  for (const token of queryTokens) {
    if (!chunk.normalizedContent.includes(token)) {
      continue;
    }

    score += token.length > 6 ? 3 : 2;
  }

  return score;
}

function tokenize(value: string): string[] {
  return [...new Set((value.toLowerCase().match(TOKEN_PATTERN) ?? []).map((token) => normalizeText(token)))];
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function toExcerpt(content: string): string {
  const collapsed = content.replace(/\s+/g, ' ').trim();
  return collapsed.length > 220 ? `${collapsed.slice(0, 217)}...` : collapsed;
}
