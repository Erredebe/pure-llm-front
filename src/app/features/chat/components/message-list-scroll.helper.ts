export const PIN_THRESHOLD_PX = 48;

export function isPinnedToBottom(element: HTMLElement): boolean {
  const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
  return distanceToBottom <= PIN_THRESHOLD_PX;
}

export function scheduleScrollToBottom(callback: () => void): void {
  requestAnimationFrame(callback);
}

export function scrollToBottom(element: HTMLElement): void {
  element.scrollTo({ top: element.scrollHeight, behavior: 'auto' });
}
