import { ChatRole } from '../../contracts/llm-provider';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}
