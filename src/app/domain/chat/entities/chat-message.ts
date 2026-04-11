import { ChatRole } from '../../contracts/llm-provider';

import { KnowledgeCitation } from './knowledge-citation';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  citations?: KnowledgeCitation[];
}
