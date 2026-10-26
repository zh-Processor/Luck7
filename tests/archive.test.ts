import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/content', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/lib/content')>();
  const fixtures = Array.from({ length: 12 }, (_, index) => {
    const number = index + 1;
    return {
      slug: `archive-${String(number).padStart(2, '0')}`,
      title: `归档文章 ${String(number).padStart(2, '0')}`,
      description: number % 3 === 0 ? '窗边札记：一杯热茶。' : '静态页面里的日常记录。',
      tags: [number <= 11 ? '写作' : '读书', number % 2 === 0 ? '生活' : '前端'],
      date: number <= 8 ? `2026-10-${24 - number}` : `2025-11-${30 - number}`,
      cover: 'window',
      minutes: 1,
      featured: false,
      comments: false,
      sample: false,
      body: '阅读让时间慢下来。',
    };
  });
  // Replace only the content data. Keeping the module's own array means its
  // real filterPosts function is exercised instead of recreating it in a mock.
  actual.posts.splice(0, actual.posts.length, ...fixtures);
  return {
    ...actual,
    posts: actual.posts,
    tags: ['写作', '读书', '前端', '生活'],
  };
});

import { Posts } from '../src/pages/Posts';

const archive = (query: Record<string, string> = {}) => renderToStaticMarkup(
  createElement(StaticRouter, { location: `/posts/?${new URLSearchParams(query)}` }, createElement(Posts)),
);
const visibleSlugs = (html: string) => [...html.matchAll(/<h3><a href="\/posts\/([^"]+)\/"/g)].map(match => match[1]);
const paginationButton = (html: string, label: string) => [...html.matchAll(/<button\b[^>]*>/g)]
  .map(match => match[0]).find(button => button.includes(`aria-label="${label}"`));

describe('article archive URL pagination and filters', () => {
  it('shows ten articles initially and the remaining two on the second page', () => {
    const first = archive();
    expect(visibleSlugs(first)).toEqual([
      'archive-01', 'archive-02', 'archive-03', 'archive-04', 'archive-05',
      'archive-06', 'archive-07', 'archive-08', 'archive-09', 'archive-10',
    ]);
    expect(first).toContain('12 篇文字');
    expect(first).toContain('第 1 / 2 页');
    expect(paginationButton(first, '上一页')).toContain('disabled');
    expect(paginationButton(first, '下一页')).not.toContain('disabled');

    const second = archive({ page: '2' });
    expect(visibleSlugs(second)).toEqual(['archive-11', 'archive-12']);
    expect(second).toContain('第 2 / 2 页');
    expect(paginationButton(second, '上一页')).not.toContain('disabled');
    expect(paginationButton(second, '下一页')).toContain('disabled');
  });

  it('clamps an outdated page URL to the last available page', () => {
    const html = archive({ page: '999' });
    expect(visibleSlugs(html)).toEqual(['archive-11', 'archive-12']);
    expect(html).toContain('第 2 / 2 页');
    expect(paginationButton(html, '下一页')).toContain('disabled');
  });

  it('paginates tag results and displays links to each article tag', () => {
    const html = archive({ tag: '写作', page: '2' });
    expect(visibleSlugs(html)).toEqual(['archive-11']);
    expect(html).toContain('11 篇文字');
    expect(html).toContain('第 2 / 2 页');

    const smallerTag = archive({ tag: '读书', page: '2' });
    expect(visibleSlugs(smallerTag)).toEqual(['archive-12']);
    expect(smallerTag).toContain('1 篇文字');
    expect(smallerTag).toContain('href="/posts/?tag=%E8%AF%BB%E4%B9%A6"');
    expect(smallerTag).toContain('#读书');
    expect(smallerTag).not.toContain('?category=');
    expect(smallerTag).not.toContain('文章分类');
    expect(smallerTag).not.toContain('aria-label="文章分页"');
  });

  it('recalculates the total and clamps a page URL after a search narrows the results', () => {
    const html = archive({ q: '窗边札记', page: '2' });
    expect(visibleSlugs(html)).toEqual(['archive-03', 'archive-06', 'archive-09', 'archive-12']);
    expect(html).toContain('4 篇文字');
    expect(html).toContain('value="窗边札记"');
    expect(html).not.toContain('aria-label="文章分页"');
  });

  it('applies search, tag, and year together from a shared archive URL', () => {
    const html = archive({ q: '窗边札记', tag: '生活', year: '2026', page: '7' });
    expect(visibleSlugs(html)).toEqual(['archive-06']);
    expect(html).toContain('1 篇文字');
    expect(html).not.toContain('aria-label="文章分页"');
  });

  it('offers a way to clear a no-match search without showing stale articles or pagination', () => {
    const html = archive({ q: '不存在的文字', page: '2' });
    expect(visibleSlugs(html)).toEqual([]);
    expect(html).toContain('0 篇文字');
    expect(html).toContain('清除筛选');
    expect(html).not.toContain('aria-label="文章分页"');
  });
});
