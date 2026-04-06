export async function safeAsyncDispose(resource: { unload?: () => Promise<void> } | null | undefined): Promise<void> {
  if (resource?.unload) {
    await resource.unload();
  }
}
