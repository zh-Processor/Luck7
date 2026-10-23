import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { routes, render, feedPosts, siteInfo, base } from '../.prerender/prerender.js';

const output = resolve('dist');
const template = await readFile(join(output, 'index.html'), 'utf8');
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const origin = siteInfo.url;

function page(path) {
  const { html, meta } = render(path);
  const tags = [
    `<meta name="description" content="${escape(meta.description)}">`,
    `<meta property="og:site_name" content="${escape(siteInfo.name)}">`,
    `<meta property="og:title" content="${escape(meta.title)}">`,
    `<meta property="og:description" content="${escape(meta.description)}">`,
    `<meta property="og:type" content="${meta.post ? 'article' : 'website'}">`,
    '<meta property="og:locale" content="zh_CN">',
    '<meta name="twitter:card" content="summary">',
    `<link rel="alternate" type="application/rss+xml" title="${escape(siteInfo.name)}" href="${escape(base)}rss.xml">`,
  ];
  if (meta.url) tags.push(`<link rel="canonical" href="${escape(meta.url)}">`, `<meta property="og:url" content="${escape(meta.url)}">`);
  if (!meta.known) tags.push('<meta name="robots" content="noindex">');
  if (meta.post) {
    tags.push(`<meta property="article:published_time" content="${meta.post.date}T00:00:00+08:00">`);
    const schema = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: meta.post.title, description: meta.description, datePublished: `${meta.post.date}T00:00:00+08:00`, dateModified: `${meta.post.updated || meta.post.date}T00:00:00+08:00`, author: { '@type': 'Person', name: siteInfo.author.name }, ...(meta.url ? { url: meta.url, mainEntityOfPage: meta.url } : {}) };
    tags.push(`<script data-post-schema type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`);
  }
  return template.replace(/<title>.*?<\/title>/s, `<title>${escape(meta.title)}</title>`).replace('<!--site-head-->', tags.join('\n    ')).replace('<!--app-html-->', html);
}

for (const path of routes) {
  const folder = join(output, path.replace(/^\//, ''));
  await mkdir(folder, { recursive: true });
  await writeFile(join(folder, 'index.html'), page(path));
}
await writeFile(join(output, '404.html'), page('/404/'));
await writeFile(join(output, '.nojekyll'), '');

// A deployed build gets its real URL from GitHub Pages metadata. Local previews use localhost.
const feedBase = origin || `http://localhost:4173${base.replace(/\/$/, '')}`;
const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escape(siteInfo.name)}</title><link>${escape(feedBase)}/</link><description>${escape(siteInfo.description)}</description><language>zh-CN</language><atom:link href="${escape(feedBase)}/rss.xml" rel="self" type="application/rss+xml"/>${feedPosts.map(post => `<item><title>${escape(post.title)}</title><link>${escape(feedBase)}/posts/${post.slug}/</link><guid isPermaLink="true">${escape(feedBase)}/posts/${post.slug}/</guid><description>${escape(post.description)}</description><pubDate>${new Date(`${post.date}T00:00:00+08:00`).toUTCString()}</pubDate><category>${escape(post.category)}</category></item>`).join('')}</channel></rss>`;
await writeFile(join(output, 'rss.xml'), rss);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(path => `<url><loc>${escape(feedBase + path)}</loc></url>`).join('')}</urlset>`;
await writeFile(join(output, 'sitemap.xml'), sitemap);
await writeFile(join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${feedBase}/sitemap.xml\n`);
console.log(`Generated ${routes.length} static pages, 404.html, RSS and sitemap.${origin ? '' : ' Local preview URL used; set VITE_SITE_URL for deployment.'}`);
