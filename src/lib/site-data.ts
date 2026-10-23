import { parse } from 'yaml';
import siteSource from '../../content/site.yaml?raw';
import notesSource from '../../content/notes.yaml?raw';
import friendsSource from '../../content/friends.yaml?raw';
import aboutSource from '../../content/about.md?raw';

export interface AuthorData {
  name: string;
  bio: string;
  github: string;
  email: string;
  avatar?: string;
}
export interface HomeData {
  eyebrow: string;
  title: string;
  emphasis: string;
  description: string[];
  quietNote: string;
}
export interface CommentData {
  enabled: boolean;
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  reactions: boolean;
}
export interface SiteData {
  name: string;
  tagline: string;
  description: string;
  url: string;
  author: AuthorData;
  home: HomeData;
  comments: CommentData;
}
export interface Note { id: string; date: string; mood: string; text: string }
export interface Friend { name: string; description: string; url: string; avatar?: string }

function fail(source: string, field: string, message: string): never {
  throw new Error(`${source} · ${field}: ${message}`);
}

function document(raw: string, source: string): unknown {
  try { return parse(raw.replace(/^\uFEFF/, ''), { maxAliasCount: 20 }); }
  catch (error) { throw new Error(`${source} YAML 格式错误: ${error instanceof Error ? error.message : '无法解析'}`); }
}

function object(value: unknown, source: string, field: string, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(source, field, '需要字段映射');
  const result = value as Record<string, unknown>;
  for (const key of Object.keys(result)) {
    if (!keys.includes(key)) fail(source, `${field}.${key}`, '未知字段，请检查拼写');
  }
  return result;
}

function text(value: unknown, source: string, field: string, allowEmpty = false): string {
  if (typeof value !== 'string') fail(source, field, '需要文本');
  const result = value.trim();
  if (!result && !allowEmpty) fail(source, field, '不能为空');
  return result;
}

function boolean(value: unknown, source: string, field: string): boolean {
  if (typeof value !== 'boolean') fail(source, field, '需要 true 或 false');
  return value;
}

function httpsUrl(value: string, source: string, field: string): string {
  let url: URL;
  try { url = new URL(value); }
  catch { return fail(source, field, '需要完整 HTTPS 地址'); }
  if (url.protocol !== 'https:' || !/^https:\/\//i.test(value) || url.username || url.password || /[\s\\]/.test(value)) {
    fail(source, field, '需要不含账号密码的完整 HTTPS 地址');
  }
  return url.href;
}

function optionalAvatar(value: unknown, source: string, field: string): string | undefined {
  if (value === undefined) return undefined;
  const path = text(value, source, field, true);
  if (!path) return undefined;
  if (/^https:/i.test(path)) return httpsUrl(path, source, field);
  // Local images are relative to public/, never protocol-relative or executable URLs.
  let decoded = path;
  try { decoded = decodeURIComponent(path); }
  catch { fail(source, field, '本地图片路径包含无效编码'); }
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\?)/i.test(decoded) || /[\\\u0000-\u001f\u007f]/.test(decoded) || decoded.split(/[/?#]/).includes('..')) {
    fail(source, field, '仅支持 HTTPS 图片或 public/ 内的相对路径');
  }
  return path;
}

export function validateSiteData(value: unknown, source = 'content/site.yaml'): SiteData {
  const data = object(value, source, 'site', ['name', 'tagline', 'description', 'url', 'author', 'home', 'comments']);
  const author = object(data.author, source, 'author', ['name', 'bio', 'github', 'email', 'avatar']);
  const home = object(data.home, source, 'home', ['eyebrow', 'title', 'emphasis', 'description', 'quietNote']);
  const comments = object(data.comments, source, 'comments', ['enabled', 'repo', 'repoId', 'category', 'categoryId', 'reactions']);
  const urlValue = text(data.url, source, 'url', true);
  const url = urlValue ? httpsUrl(urlValue, source, 'url').replace(/\/+$/, '') : '';
  if (url && /[?#]/.test(url)) fail(source, 'url', '站点地址不能包含查询参数或片段');
  const githubValue = text(author.github, source, 'author.github', true);
  const email = text(author.email, source, 'author.email', true);
  if (email && !/^[^\s@:?&#%/\\<>"]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(email)) fail(source, 'author.email', '需要邮箱地址，不包含 mailto: 或查询参数');
  if (!Array.isArray(home.description) || !home.description.length) fail(source, 'home.description', '需要至少一段文本组成的数组');
  const repo = text(comments.repo, source, 'comments.repo', true);
  if (repo && !/^[a-z0-9][a-z0-9-]*\/[a-z0-9_.-]+$/i.test(repo)) fail(source, 'comments.repo', '需要 owner/repository 格式');
  const repoId = text(comments.repoId, source, 'comments.repoId', true);
  const categoryId = text(comments.categoryId, source, 'comments.categoryId', true);
  for (const [key, value] of [['repoId', repoId], ['categoryId', categoryId]]) {
    if (value && !/^[a-z0-9_+/=-]+$/i.test(value)) fail(source, `comments.${key}`, '需要 giscus 提供的公开标识');
  }
  return {
    name: text(data.name, source, 'name'),
    tagline: text(data.tagline, source, 'tagline'),
    description: text(data.description, source, 'description'),
    url,
    author: {
      name: text(author.name, source, 'author.name'),
      bio: text(author.bio, source, 'author.bio'),
      github: githubValue ? httpsUrl(githubValue, source, 'author.github') : '',
      email,
      avatar: optionalAvatar(author.avatar, source, 'author.avatar'),
    },
    home: {
      eyebrow: text(home.eyebrow, source, 'home.eyebrow'),
      title: text(home.title, source, 'home.title'),
      emphasis: text(home.emphasis, source, 'home.emphasis'),
      description: home.description.map((value, index) => text(value, source, `home.description[${index}]`)),
      quietNote: text(home.quietNote, source, 'home.quietNote'),
    },
    comments: {
      enabled: boolean(comments.enabled, source, 'comments.enabled'),
      repo, repoId,
      category: text(comments.category, source, 'comments.category', true),
      categoryId,
      reactions: boolean(comments.reactions, source, 'comments.reactions'),
    },
  };
}

export function parseSiteData(raw: string, source = 'content/site.yaml'): SiteData {
  return validateSiteData(document(raw, source), source);
}

function array(raw: string, source: string): unknown[] {
  const value = document(raw, source);
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) fail(source, '列表', '需要 YAML 数组；没有内容时使用 []');
  return value;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

export function parseNotes(raw: string, source = 'content/notes.yaml'): Note[] {
  const ids = new Set<string>();
  return array(raw, source).map((entry, index) => {
    const field = `notes[${index}]`;
    const note = object(entry, source, field, ['id', 'date', 'mood', 'text']);
    const id = text(note.id, source, `${field}.id`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) fail(source, `${field}.id`, '仅支持小写字母、数字与短横线');
    if (ids.has(id)) fail(source, `${field}.id`, `重复 id「${id}」`);
    ids.add(id);
    const date = text(note.date, source, `${field}.date`);
    if (!validDate(date)) fail(source, `${field}.date`, '需要有效的 YYYY-MM-DD 日期');
    return { id, date, mood: text(note.mood, source, `${field}.mood`, true), text: text(note.text, source, `${field}.text`) };
  }).sort((a, b) => b.date.localeCompare(a.date));
}

export function parseFriends(raw: string, source = 'content/friends.yaml'): Friend[] {
  const urls = new Set<string>();
  return array(raw, source).map((entry, index) => {
    const field = `friends[${index}]`;
    const friend = object(entry, source, field, ['name', 'description', 'url', 'avatar']);
    const url = httpsUrl(text(friend.url, source, `${field}.url`), source, `${field}.url`);
    const key = url.replace(/\/+$/, '');
    if (urls.has(key)) fail(source, `${field}.url`, '友链地址重复');
    urls.add(key);
    return {
      name: text(friend.name, source, `${field}.name`),
      description: text(friend.description, source, `${field}.description`),
      url,
      avatar: optionalAvatar(friend.avatar, source, `${field}.avatar`),
    };
  });
}

export const siteData = parseSiteData(siteSource);
export const notesData = parseNotes(notesSource);
export const friendsData = parseFriends(friendsSource);
export const aboutBody = aboutSource.replace(/^\uFEFF/, '').trim();
