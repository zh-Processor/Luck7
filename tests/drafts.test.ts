import { describe, expect, it } from 'vitest';
import { createServer } from 'vite';
import { stringify } from 'yaml';
import { collectPosts, parsePost } from '../src/lib/content';

const article = (fields: Record<string, unknown> = {}, body = '一段还在写的文字。') =>
  `---\n${stringify({ title: '预览文章', date: '2026-10-23', ...fields })}---\n${body}`;

describe('explicit local draft parsing', () => {
  it('continues to skip unfinished drafts by default', () => {
    expect(parsePost('---\ndraft: true\n---', 'unfinished.md')).toBeNull();
    expect(parsePost(article({ draft: true }), 'private.md')).toBeNull();
    expect(collectPosts({ 'unfinished.md': '---\ndraft: true\n---' })).toEqual([]);
  });

  it('includes fully valid drafts only with an explicit preview option', () => {
    expect(parsePost(article({ draft: true }), 'private.md', { includeDrafts: true })).toMatchObject({ slug: 'private', draft: true });
    expect(parsePost(article({ draft: false }), 'published.md', { includeDrafts: true })).toMatchObject({ slug: 'published', draft: false });
    expect(parsePost(article(), 'published.md', { includeDrafts: true })?.draft).toBe(false);
    expect(parsePost(article({ draft: true }), 'private.md', { includeDrafts: false })).toBeNull();
  });

  it('requires previewed drafts to satisfy normal article validation', () => {
    expect(() => parsePost('---\ndraft: true\n---', 'unfinished.md', { includeDrafts: true })).toThrow(/标题/);
    for (const fields of [{ date: '2026-02-30' }, { slug: '../private' }, { tags: 'not-a-list' }]) {
      expect(() => parsePost(article({ ...fields, draft: true }), 'private.md', { includeDrafts: true })).toThrow();
    }
    expect(() => parsePost(article({ draft: true }, ''), 'private.md', { includeDrafts: true })).toThrow(/正文不能为空/);
  });

  it('sorts included drafts normally and detects preview route collisions', () => {
    const files = {
      'published.md': article({ slug: 'published', date: '2026-10-22' }),
      'private.md': article({ slug: 'private', draft: true }),
    };
    expect(collectPosts(files).map(post => post.slug)).toEqual(['published']);
    expect(collectPosts(files, { includeDrafts: true }).map(post => post.slug)).toEqual(['private', 'published']);
    const collisions = { 'published.md': article({ slug: 'same' }), 'private.md': article({ slug: 'same', draft: true }) };
    expect(collectPosts(collisions)).toHaveLength(1);
    expect(() => collectPosts(collisions, { includeDrafts: true })).toThrow(/slug 重复/);
  });
});

describe('draft preview uses the actual Vite mode', () => {
  it.each([
    { mode: 'drafts', expected: true },
    { mode: 'development', expected: false },
  ])('loads the content module in mode=$mode', async ({ mode, expected }) => {
    const server = await createServer({ mode, logLevel: 'silent', server: { middlewareMode: true } });
    try {
      const module = await server.ssrLoadModule('/src/lib/content.ts');
      expect(module.isDraftPreview).toBe(expected);
      const visible = module.collectPosts({ 'private.md': article({ draft: true }) }, { includeDrafts: module.isDraftPreview });
      expect(visible).toHaveLength(expected ? 1 : 0);
      if (!expected) expect(module.posts.every((post: { draft?: boolean }) => !post.draft)).toBe(true);
    } finally {
      await server.close();
    }
  });
});
