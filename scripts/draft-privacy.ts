import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { normalizePath, type Plugin } from 'vite';
import { parse } from 'yaml';

const hiddenDraft = '---\ndraft: true\n---\n';

/** Only read the visibility flag here; field validation stays in content.ts. */
function isDraft(raw: string, filename: string): boolean {
  const match = raw.replace(/^\uFEFF/, '').match(/^---[\t ]*\r?\n((?:[\s\S]*?\r?\n)?)---[\t ]*(?:\r?\n|$)([\s\S]*)$/);
  if (!match) return false;
  try {
    const data: unknown = parse(match[1], { maxAliasCount: 20 });
    return Boolean(data && typeof data === 'object' && !Array.isArray(data) && (data as { draft?: unknown }).draft === true);
  } catch (error) {
    throw new Error(`文章 YAML 格式错误 (${filename}): ${error instanceof Error ? error.message : '无法解析'}`);
  }
}

/** Remove draft text before Vite can place raw Markdown in a browser bundle. */
export function draftPrivacy(): Plugin {
  let postsRoot = '';
  let revealDrafts = false;
  return {
    name: 'haven-draft-privacy',
    enforce: 'pre',
    configResolved(config) {
      postsRoot = `${normalizePath(resolve(config.root, 'content/posts'))}/`;
      revealDrafts = config.command === 'serve' && !config.isProduction && config.mode === 'drafts';
    },
    async load(id) {
      const query = id.indexOf('?');
      if (query < 0 || !new URLSearchParams(id.slice(query + 1)).has('raw')) return null;
      const filename = normalizePath(id.slice(0, query));
      if (!filename.startsWith(postsRoot) || !filename.toLowerCase().endsWith('.md')) return null;
      this.addWatchFile(filename);
      if (revealDrafts) return null;
      const raw = await readFile(filename, 'utf8');
      if (!isDraft(raw, filename)) return null;
      // Preserve the parser's normal "skip draft" contract without shipping its
      // title, metadata, comments or body. Neither Rollup nor runtime filtering
      // alone can remove private strings from eager raw imports.
      return { code: `export default ${JSON.stringify(hiddenDraft)};`, map: null };
    },
  };
}
