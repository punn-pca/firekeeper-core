/** Discard records deleted on another server instance after a successful canonical read. */
export function reconcileConversationCache<T>(cache: Map<string, T>, canonicalIds: ReadonlySet<string>): void {
  for (const id of cache.keys()) {
    if (!canonicalIds.has(id)) cache.delete(id);
  }
}
