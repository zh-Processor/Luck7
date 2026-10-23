import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';
import { routes, feedPosts, base, siteInfo } from '../.prerender/prerender.js';

const output = resolve('dist');
const pages = [...routes.map(route => `${route.slice(1)}index.html`), '404.html'];
const checked = new Set();
for (const page of pages) {
  const html = await readFile(join(output, page), 'utf8');
  assert(!html.includes('<!--app-html-->') && !html.includes('<!--site-head-->'), `${page}: unrendered template`);
  assert(html.includes('id="main-content"') && /<h1[ >]/.test(html), `${page}: missing readable content`);
  assert(/<meta name="description"/.test(html), `${page}: missing description`);
  if (page === '404.html') assert(html.includes('content="noindex"'), '404 must be noindex');
  if (siteInfo.url && page !== '404.html') assert(html.includes(`href="${siteInfo.url}`), `${page}: missing deployed origin`);
  for (const match of html.matchAll(/(?:href|src)="([^"<>]+)"/g)) {
    const href = match[1];
    if (/^(?:https?:|data:|mailto:|#|blob:|\/\/)/.test(href)) continue;
    let path = href.split(/[?#]/)[0];
    if (path === base.replace(/\/$/, '')) path = base;
    if (!path || checked.has(path)) continue;
    assert(path.startsWith(base), `${page}: ${path} is missing deployment base ${base}`);
    const local = decodeURIComponent(path.slice(base.length));
    const target = join(output, local.endsWith('/') || !extname(local) ? `${local}${local && !local.endsWith('/') ? '/' : ''}index.html` : local);
    assert(target.startsWith(output), `${page}: escaped output directory`);
    assert((await stat(target)).isFile(), `${page}: missing target ${target}`);
    checked.add(path);
  }
}
const rss = await readFile(join(output, 'rss.xml'), 'utf8');
const sitemap = await readFile(join(output, 'sitemap.xml'), 'utf8');
assert.equal((rss.match(/<item>/g) || []).length, feedPosts.length, 'RSS post count');
assert.equal((sitemap.match(/<loc>/g) || []).length, routes.length, 'Sitemap route count');
assert((await stat(join(output, '.nojekyll'))).isFile());
console.log(`Verified ${pages.length} HTML files, ${checked.size} local links/assets, RSS and sitemap (base ${base}).`);
