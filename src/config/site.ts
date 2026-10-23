import { friendsData, siteData, validateSiteData } from '../lib/site-data';

/** Author-editable public data lives in content/. Nonempty deployment values override it. */
const configured = validateSiteData({
  ...siteData,
  url: import.meta.env.VITE_SITE_URL?.trim() || siteData.url,
  comments: {
    ...siteData.comments,
    repo: import.meta.env.VITE_GISCUS_REPO?.trim() || siteData.comments.repo,
    repoId: import.meta.env.VITE_GISCUS_REPO_ID?.trim() || siteData.comments.repoId,
    category: import.meta.env.VITE_GISCUS_CATEGORY?.trim() || siteData.comments.category,
    categoryId: import.meta.env.VITE_GISCUS_CATEGORY_ID?.trim() || siteData.comments.categoryId,
  },
}, 'content/site.yaml / 公开环境变量');
export const site = { ...configured, friends: friendsData };

export const basePath = import.meta.env.BASE_URL;
export function asset(path: string) {
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  const prefix = `${basePath.replace(/\/$/, '')}/`;
  if (prefix !== '/' && (path === prefix.slice(0, -1) || path.startsWith(prefix))) return path;
  return `${prefix}${path.replace(/^\/+/, '')}`;
}
