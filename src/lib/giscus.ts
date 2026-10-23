export type GiscusStatus = 'loading' | 'ready' | 'error';

// giscus sends resizeHeight after rendering, including for a new discussion.
// https://github.com/giscus/giscus/blob/main/lib/types/giscus.ts
export function nextGiscusStatus(current: GiscusStatus, data: unknown): GiscusStatus {
  if (current === 'error' || !data || typeof data !== 'object' || !('giscus' in data)) return current;
  const message = data.giscus;
  if (!message || typeof message !== 'object') return current;
  if ('error' in message && typeof message.error === 'string' && message.error) {
    // A new article has no discussion until its first comment; this is normal.
    return /discussion not found/i.test(message.error) ? current : 'error';
  }
  return 'resizeHeight' in message
    && typeof message.resizeHeight === 'number'
    && Number.isFinite(message.resizeHeight)
    && message.resizeHeight > 0
    ? 'ready'
    : current;
}
