import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { App } from './App';
import { site } from './config/site';
import { posts } from './lib/content';
import { getPageMeta } from './lib/meta';

export const routes = ['/', '/posts/', '/notes/', '/friends/', '/about/', ...posts.map(post => `/posts/${post.slug}/`)];
export const feedPosts = posts;
export const siteInfo = site;
export const base = import.meta.env.BASE_URL;
export function render(path: string) {
  const basename = base.replace(/\/$/, '') || '/';
  const location = `${basename === '/' ? '' : basename}${path}`;
  return { html: renderToString(<StaticRouter location={location} basename={basename}><App /></StaticRouter>), meta: getPageMeta(path) };
}
