import { afterEach, describe, expect, it } from 'vitest';
import { stringify } from 'yaml';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Route, Routes, StaticRouter } from 'react-router-dom';
import { collectPosts, getHeadings, isValidDate, parsePost, posts } from '../src/lib/content';
import { MarkdownBody, markdownUrl } from '../src/components/MarkdownBody';
import { Comments } from '../src/components/Comments';
import { PreferencesProvider } from '../src/context/Preferences';
import { site } from '../src/config/site';
import { Article } from '../src/pages/Article';

const article = (fields: Record<string, unknown> = {}, body = '这是文章的正文。') =>
  `---\n${stringify({ title: '安静的文字', date: '2026-10-23', ...fields })}---\n${body}`;
const render = (body: string) => renderToStaticMarkup(createElement(StaticRouter, { location: '/' }, createElement(MarkdownBody, { body })));

describe('published Markdown content', () => {
  it('reads BOM/CRLF files, Windows paths, defaults, and distinct trimmed tags', () => {
    const post = parsePost(`\uFEFF${article({ tags: ['音乐', '  日常 ', '音乐'], comments: false }).replace(/\n/g, '\r\n')}`, 'F:\\blog\\content\\a-good-day.md');
    expect(post).toMatchObject({ slug: 'a-good-day', title: '安静的文字', comments: false, tags: ['音乐', '日常'], minutes: 1 });
  });

  it('rejects invalid publishing fields instead of silently coercing them', () => {
    for (const fields of [
      { title: '   ' }, { title: ['a', 'b'] }, { slug: '../escape' },
      { date: '2026-02-30' }, { date: '2026-2-03' }, { date: 20261023 },
      { updated: '2026-10-22' }, { updated: '2026-13-01' },
      { tags: 'music' }, { tags: ['music', 1] }, { tags: [''] },
      { featured: 'true' }, { comments: 'false' }, { draft: 'false' },
    ]) {
      expect(() => parsePost(article(fields), 'sample.md'), JSON.stringify(fields)).toThrow(/sample\.md/);
    }
    expect(() => parsePost(article({}, '   '), 'sample.md')).toThrow(/正文不能为空/);
  });

  it('validates calendar days and leap years without timezone rollover', () => {
    expect(isValidDate('2024-02-29')).toBe(true);
    expect(isValidDate('2000-02-29')).toBe(true);
    for (const value of ['1900-02-29', '2026-02-29', '2026-04-31', '2026-00-10', '2026-01-00', '0000-01-01', '2026-10-23T00:00:00Z']) {
      expect(isValidDate(value), value).toBe(false);
    }
  });

  it('excludes unfinished drafts and rejects ambiguous YAML', () => {
    expect(parsePost('---\ndraft: true\n---', 'unfinished.md')).toBeNull();
    expect(() => parsePost('no frontmatter', 'missing.md')).toThrow(/frontmatter/);
    expect(() => parsePost('---\n- title\n- text\n---\nBody', 'array.md')).toThrow(/字段映射/);
    expect(() => parsePost('---\n---\nBody', 'empty.md')).toThrow(/字段映射/);
    expect(() => parsePost('---\ntitle: one\ntitle: two\n---\nBody', 'duplicate.md')).toThrow(/YAML/);
  });

  it('requires unique published URLs and reports both source filenames', () => {
    expect(() => collectPosts({ 'one.md': article({ slug: 'same' }), 'two.md': article({ slug: 'same' }) })).toThrow(/one\.md.*two\.md/);
    expect(collectPosts({ 'one.md': article({ slug: 'same' }), 'two.md': article({ slug: 'same', draft: true }) })).toHaveLength(1);
  });

  it('sorts posts deterministically by date and slug', () => {
    expect(collectPosts({ 'z.md': article(), 'old.md': article({ date: '2025-10-23' }), 'a.md': article() }).map(post => post.slug)).toEqual(['a', 'z', 'old']);
  });
});

describe('Markdown table of contents and rendering', () => {
  it('uses one parser for formatted headings, references, setext headings, images, and code fences', () => {
    const body = [
      '# 顶层标题',
      '## **读书**与[音乐](https://example.com) &amp; `code`',
      '### ![小安](avatar.png) [参考][link] ###',
      '下划线标题', '------------',
      '~~~md', '## 围栏中的示例', '~~~',
      '```md', '### 代码里的标题', '```',
      '    ## 缩进代码标题',
      '', '[link]: https://example.com',
    ].join('\n');
    const headings = getHeadings(body);
    expect(headings.map(heading => heading.text)).toEqual(['读书与音乐 & code', '小安 参考', '下划线标题']);
    expect(headings.map(heading => heading.level)).toEqual([2, 3, 2]);
    const rendered = render(body);
    expect([...rendered.matchAll(/<h[23] id="([^"]+)"/g)].map(match => match[1])).toEqual(headings.map(heading => heading.id));
  });

  it('never collides with duplicate headings, pre-suffixed names, or other heading levels', () => {
    const body = '# Same\n\n## Same\n\n## Same-1\n\n## Same\n\n### !!!\n\n### ???';
    const ids = [...render(body).matchAll(/<h[1-6] id="([^"]+)"/g)].map(match => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(['section-same', 'section-same-1', 'section-same-1-1', 'section-same-2', 'section-untitled', 'section-untitled-1']);
    expect(getHeadings(body).map(heading => heading.id)).toEqual(ids.slice(1));
  });

  it('retains safe links and rejects raw HTML and executable URLs', () => {
    const html = render('[mail](mailto:hello@example.com) [web](https://example.com) [relative](/posts/a-good-day/) [bad](javascript:alert%281%29)\n\n<script>alert(1)</script>\n\n![bad](javascript:alert%281%29)');
    expect(html).toContain('href="mailto:hello@example.com"');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('href="/posts/a-good-day/"');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('src=""');
  });

  it('renders accessible code, tables, image descriptions and copy controls', () => {
    const html = render('```ts\nconst answer = 42;\n```\n\n| 时间 | 记录 |\n| --- | --- |\n| 今天 | 晴天 |\n\n![窗边的灯](/images/lamp.png "一盏灯")');
    expect(html).toContain('复制代码');
    expect(html).toContain('aria-label="ts 代码"');
    expect(html).toContain('aria-label="文章表格，可横向滚动"');
    expect(html).toContain('<table>');
    expect(html).toContain('alt="窗边的灯"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('aria-label="放大图片：窗边的灯"');
  });

  it('rewrites site-local assets once for project Pages and preserves URL schemes', () => {
    expect(markdownUrl('images/a.png', '/blog/')).toBe('/blog/images/a.png');
    expect(markdownUrl('/images/a.png', '/blog/')).toBe('/blog/images/a.png');
    expect(markdownUrl('/blog/images/a.png', '/blog/')).toBe('/blog/images/a.png');
    for (const url of ['https://example.com/a.png', '//example.com/a.png', 'mailto:hello@example.com', '#section-a', '?tag=music']) {
      expect(markdownUrl(url, '/blog/')).toBe(url);
    }
  });
});

describe('static Discussions comment controls', () => {
  const original = { ...site.comments };
  const comments = (enabled = true) => renderToStaticMarkup(createElement(PreferencesProvider, null, createElement(Comments, { slug: 'a-good-day', enabled })));
  afterEach(() => { Object.assign(site.comments, original); });

  it('honors both the site-wide switch and individual article switch', () => {
    expect(comments(false)).toBe('');
    site.comments.enabled = false;
    expect(comments()).toBe('');
  });

  it('omits comments before public repository identifiers are configured', () => {
    Object.assign(site.comments, { enabled: true, repo: '', repoId: '', categoryId: '' });
    const html = comments();
    expect(html).toBe('');
  });

  it('keeps third-party comments unloaded until the visitor chooses to open them', () => {
    Object.assign(site.comments, { enabled: true, repo: 'owner/blog', repoId: 'R_example', categoryId: 'DIC_example' });
    const html = comments();
    expect(html).toContain('打开评论');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<iframe');
  });
});

describe('short article layout', () => {
  const originalPosts = [...posts];
  afterEach(() => { posts.splice(0, posts.length, ...originalPosts); });

  it('renders a sole short article without empty navigation or a reserved sidebar', () => {
    const post = parsePost(article({ slug: 'short-letter', comments: false }), 'short-letter.md')!;
    posts.splice(0, posts.length, post);
    const html = renderToStaticMarkup(createElement(StaticRouter, { location: '/posts/short-letter/' },
      createElement(PreferencesProvider, null,
        createElement(Routes, null, createElement(Route, { path: '/posts/:slug/', element: createElement(Article) })))));
    expect(html).toContain('这是文章的正文。');
    expect(html).toContain('no-toc');
    expect(html).not.toContain('class="mobile-toc"');
    expect(html).not.toContain('class="article-toc"');
    expect(html).not.toContain('aria-label="相邻文章"');
  });
});
