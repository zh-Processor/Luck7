import { parse } from 'yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { notesData } from './site-data';

export interface Post {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
  updated?: string;
  cover: string;
  minutes: number;
  featured: boolean;
  comments: boolean;
  sample: boolean;
  draft?: boolean;
  body: string;
}

export interface PostOptions { includeDrafts?: boolean }

export function parsePost(raw: string, filename: string, options: PostOptions = {}): Post | null {
  const match = raw.replace(/^\uFEFF/, '').match(/^---[\t ]*\r?\n((?:[\s\S]*?\r?\n)?)---[\t ]*(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error(`文章缺少 YAML frontmatter: ${filename}`);
  let value: unknown;
  try { value = parse(match[1], { maxAliasCount: 20 }); }
  catch (error) { throw new Error(`文章 YAML 格式错误 (${filename}): ${error instanceof Error ? error.message : '无法解析'}`); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`文章 frontmatter 必须是字段映射: ${filename}`);
  const data = value as Record<string, unknown>;
  const fail = (message: string): never => { throw new Error(`${message}: ${filename}`); };
  const text = (field: string, fallback = '') => {
    if (data[field] === undefined) return fallback;
    if (typeof data[field] !== 'string' || !data[field].trim()) return fail(`文章 ${field} 必须是非空文本`);
    return data[field].trim();
  };
  for (const field of ['draft', 'featured', 'comments', 'sample']) {
    if (data[field] !== undefined && typeof data[field] !== 'boolean') fail(`文章 ${field} 必须是 true 或 false`);
  }
  // Drafts may be unfinished. Validate publishing fields only when publishing them.
  if (data.draft === true && !options.includeDrafts) return null;
  const slug = text('slug', filename.split(/[\\/]/).pop()?.replace(/\.md$/i, '') || '');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`文章 slug 只能包含小写英文、数字与短横线: ${filename}`);
  const title = text('title') || fail('文章需要标题');
  const date = text('date');
  const updated = text('updated') || undefined;
  if (!isValidDate(date) || (updated && !isValidDate(updated))) fail('文章 date 和 updated 需要有效的 YYYY-MM-DD 日期');
  if (updated && updated < date) fail('文章 updated 不能早于 date');
  if (data.tags !== undefined && (!Array.isArray(data.tags) || data.tags.some(tag => typeof tag !== 'string' || !tag.trim()))) fail('文章 tags 必须是非空文本组成的数组');
  const body = match[2].trim();
  if (!body) fail('已发布文章的正文不能为空');
  return {
    slug, title, description: text('description'),
    tags: [...new Set((data.tags as string[] | undefined || []).map(tag => tag.trim()))],
    date, updated,
    cover: text('cover', 'landscape'),
    minutes: Math.max(1, Math.ceil(readingText(markdownParser.parse(body) as MarkdownNode).length / 450)),
    featured: data.featured === true, comments: data.comments !== false,
    sample: data.sample === true, draft: data.draft === true, body,
  };
}

export function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

export function collectPosts(files: Record<string, unknown>, options: PostOptions = {}): Post[] {
  const used = new Map<string, string>();
  return Object.entries(files).flatMap(([name, raw]) => {
    const post = parsePost(String(raw), name, options);
    if (!post) return [];
    const duplicate = used.get(post.slug);
    if (duplicate) throw new Error(`文章 slug 重复「${post.slug}」: ${duplicate} / ${name}`);
    used.set(post.slug, name);
    return [post];
  }).sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

interface MarkdownNode {
  type: string;
  depth?: number;
  value?: string;
  alt?: string;
  children?: MarkdownNode[];
  data?: { hProperties?: Record<string, unknown> };
}
const markdownParser = unified().use(remarkParse).use(remarkGfm);
function readingText(node: MarkdownNode): string {
  if (node.type === 'code' || node.type === 'html' || node.type === 'definition') return '';
  return node.value || node.alt || node.children?.map(readingText).join('') || '';
}

const files = import.meta.glob('../../content/posts/*.md', { query: '?raw', import: 'default', eager: true });
// The DEV check is deliberately independent of mode: a production build named
// "drafts" must still exclude private drafts from every generated route/feed.
export const isDraftPreview = import.meta.env.DEV && import.meta.env.MODE === 'drafts';
export const posts = collectPosts(files, { includeDrafts: isDraftPreview });
export const tags = [...new Set(posts.flatMap(p => p.tags))];
export const featured = posts.find(p => p.featured) || posts[0];

export function filterPosts(query = '', tag = '', year = '') {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return posts.filter(post => {
    const searchable = `${post.title} ${post.description} ${post.tags.join(' ')} ${post.body}`.toLocaleLowerCase();
    return (!tag || post.tags.includes(tag)) && (!year || post.date.startsWith(year)) && terms.every(term => searchable.includes(term));
  });
}

export function formatDate(date: string) {
  const [year, month, day] = date.split('-');
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

export interface Heading { id: string; text: string; level: number }
export function headingSlug(text: string) {
  return text.normalize('NFKC').toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-');
}

function assignHeadings(tree: MarkdownNode): Heading[] {
  const used = new Set<string>();
  const headings: Heading[] = [];
  const walk = (node: MarkdownNode) => {
    if (node.type === 'heading') {
      const text = readingText(node).replace(/\s+/g, ' ').trim();
      // Prefixes avoid collisions with application anchors and DOM property names.
      const slug = `section-${headingSlug(text) || 'untitled'}`;
      let id = slug;
      let count = 1;
      while (used.has(id)) id = `${slug}-${count++}`;
      used.add(id);
      node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
      if (node.depth === 2 || node.depth === 3) headings.push({ id, text: text || '未命名小节', level: node.depth });
    }
    node.children?.forEach(walk);
  };
  walk(tree);
  return headings;
}

/** The renderer and TOC share this exact AST traversal, including duplicate IDs. */
export function remarkHeadingIds() {
  return (tree: MarkdownNode) => { assignHeadings(tree); };
}

export function getHeadings(body: string): Heading[] {
  return assignHeadings(markdownParser.parse(body) as MarkdownNode);
}

export const notes = notesData;
