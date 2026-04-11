export type SpecialBlockKind = 'think' | 'system-reminder';

export interface MessagePart {
  kind: 'text' | SpecialBlockKind;
  content: string;
}

const SPECIAL_BLOCK_PATTERN = /<(think|system-reminder)>([\s\S]*?)<\/\1>/g;
const SYSTEM_REMINDER_START = '<system-reminder>';
const INTERNAL_TAG_PATTERN = /<\/?(?:output_contract|role|policy|conflict_policy|procedure|knowledge_base|user_question|task|source)(?:\s[^>]*)?>/gi;

export function parseMessageContent(content: string): MessagePart[] {
  const parts: MessagePart[] = [];
  let cursor = 0;
  const normalizedContent = stripInternalArtifacts(stripTrailingSystemReminder(content));

  for (const match of normalizedContent.matchAll(SPECIAL_BLOCK_PATTERN)) {
    const matchIndex = match.index ?? 0;
    const fullMatch = match[0];
    const kind = match[1] as SpecialBlockKind;
    const blockContent = match[2];

    if (matchIndex > cursor) {
      parts.push({
        kind: 'text',
        content: normalizedContent.slice(cursor, matchIndex).trim()
      });
    }

    parts.push({
      kind,
      content: blockContent
    });

    cursor = matchIndex + fullMatch.length;
  }

  if (cursor < normalizedContent.length) {
    const trailing = normalizedContent.slice(cursor);
    const pendingBlock = parsePendingSpecialBlock(trailing);

    if (pendingBlock) {
      parts.push(pendingBlock);
    } else {
      parts.push({
        kind: 'text',
        content: trailing.trim()
      });
    }
  }

  return parts.filter((part) => part.content.trim().length > 0);
}

export function getBlockTitle(kind: MessagePart['kind']): string {
  return kind === 'think' ? 'Thinking' : 'System Reminder';
}

function parsePendingSpecialBlock(content: string): MessagePart | null {
  const trimmed = content.trimStart();

  if (trimmed.startsWith('<think>')) {
    return {
      kind: 'think',
      content: trimmed.slice('<think>'.length)
    };
  }

  if (trimmed.startsWith('<system-reminder>')) {
    return {
      kind: 'system-reminder',
      content: trimmed.slice('<system-reminder>'.length)
    };
  }

  return null;
}

function stripTrailingSystemReminder(content: string): string {
  const reminderIndex = content.indexOf(SYSTEM_REMINDER_START);

  if (reminderIndex === -1) {
    return content;
  }

  const afterReminder = content.slice(reminderIndex);
  if (afterReminder.includes('</system-reminder>')) {
    return content;
  }

  return content.slice(0, reminderIndex).trimEnd();
}

function stripInternalArtifacts(content: string): string {
  return content
    .replace(INTERNAL_TAG_PATTERN, '')
    .replace(/Plan Mode - System Reminder:?/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
