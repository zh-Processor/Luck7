import { describe, expect, it } from 'vitest';
import { nextGiscusStatus } from '../src/lib/giscus';

describe('giscus readiness messages', () => {
  it('waits for a valid positive resizeHeight from the rendered discussion', () => {
    expect(nextGiscusStatus('loading', { giscus: { resizeHeight: 320 } })).toBe('ready');
    for (const data of [null, {}, { giscus: {} }, { giscus: { signOut: true } }, ...[0, -1, NaN, Infinity, '320'].map(resizeHeight => ({ giscus: { resizeHeight } }))]) {
      expect(nextGiscusStatus('loading', data)).toBe('loading');
    }
  });

  it('keeps an expected missing discussion pending until the UI renders', () => {
    expect(nextGiscusStatus('loading', { giscus: { error: 'Discussion not found' } })).toBe('loading');
    expect(nextGiscusStatus('ready', { giscus: { error: 'Discussion not found' } })).toBe('ready');
  });

  it('reports real errors and never clears them on a subsequent resize', () => {
    const error = { giscus: { error: 'Repository not found', resizeHeight: 320 } };
    expect(nextGiscusStatus('loading', error)).toBe('error');
    expect(nextGiscusStatus('ready', error)).toBe('error');
    expect(nextGiscusStatus('error', { giscus: { resizeHeight: 320 } })).toBe('error');
    expect(nextGiscusStatus('error', { giscus: { error: 'Discussion not found' } })).toBe('error');
  });
});
