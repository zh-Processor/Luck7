import { site } from '../config/site';
import { posts } from './content';

export function normalizePath(path: string) { return path === '/' ? '/' : `${path.replace(/\/$/, '')}/`; }
export function getPageMeta(pathname: string) {
  const path = normalizePath(pathname);
  const post = posts.find(item => path === `/posts/${item.slug}/`);
  const pages: Record<string, { title: string; description: string }> = {
    '/': { title: `${site.name} · ${site.tagline.replace(/。$/, '')}`, description: site.description },
    '/posts/': { title: `文章 · ${site.name}`, description: '技术笔记、生活手记与随想。把日子写成文字。' },
    '/notes/': { title: `碎碎念 · ${site.name}`, description: '一些值得记住的小小心安时刻。' },
    '/friends/': { title: `友链 · ${site.name}`, description: '借由一个链接，去拜访另一个有趣的灵魂。' },
    '/about/': { title: `关于 · ${site.name}`, description: '很高兴，在这里遇见你。认识这间有文字、有温度的小屋。' },
  };
  const known = Boolean(post || pages[path]);
  const info = post ? { title: `${post.title} · ${site.name}`, description: post.description } : pages[path] || { title: `这一页暂时不在 · ${site.name}`, description: '好像走进了一条安静的小路。回到心安之地，继续阅读。' };
  return { ...info, post, known, url: site.url && known ? `${site.url}${path === '/' ? '/' : path}` : '' };
}
