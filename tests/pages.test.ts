import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/site', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/config/site')>();
  return { ...actual, site: { ...actual.site, friends: [], author: { ...actual.site.author, email: '', github: '' }, comments: { ...actual.site.comments, repo: '', repoId: '', categoryId: '' } } };
});

vi.mock('../src/lib/site-data', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/lib/site-data')>();
  return { ...actual, aboutBody: '## 我的博客介绍\n\n这是关于页的测试正文。' };
});

vi.mock('../src/lib/content', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/lib/content')>();
  return { ...actual, posts: [], notes: [], featured: undefined, categories: ['全部'], tags: [], filterPosts: () => [] };
});

import { App } from '../src/App';

const page = (location: string) => renderToStaticMarkup(createElement(StaticRouter, { location }, createElement(App)));

describe('a blog before the author has added content', () => {
  it('renders the home page with no posts or notes without requiring sample records', () => {
    const html = page('/');
    expect(html).toContain('第一篇文字，正在酝酿');
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('文字与个人资料为示例');
  });

  it('offers a reading route when the public timeline is empty', () => {
    const html = page('/notes/');
    expect(html).toContain('日常，慢慢写下');
    expect(html).toContain('href="/posts/"');
    expect(html).not.toContain('示例记录');
  });

  it('does not expose an unusable friend application without a contact destination', () => {
    const html = page('/friends/');
    expect(html).toContain('给你，留一个位置');
    expect(html).not.toContain('如何联系');
    expect(html).not.toContain('联系入口还在准备中');
  });

  it('renders the Markdown about page and a real empty archive', () => {
    expect(page('/about/')).toContain('我的博客介绍');
    expect(page('/posts/')).toContain('清除筛选');
  });
});
