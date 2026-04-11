import { ChatMessage } from '../chat/entities/chat-message';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  profileId: string | null;
  modelId: string | null;
  messages: ChatMessage[];
}

export interface ChatSessionRepository {
  loadActiveSession(): Promise<ChatSession | null>;
  saveActiveSession(session: ChatSession): Promise<void>;
  clearActiveSession(): Promise<void>;
}
