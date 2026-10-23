import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build, createServer, type ViteDevServer } from 'vite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { draftPrivacy } from '../scripts/draft-privacy';

const privateTitle = 'DRAFT_PRIVATE_TITLE_b786e28b';
const privateBody = 'DRAFT_PRIVATE_BODY_968c1d5f';
const privateComment = 'DRAFT_PRIVATE_COMMENT_a5b40e66';
const publicBody = 'PUBLIC_POST_BODY_1a3ae69f';
const entry = `export const files = import.meta.glob('./content/posts/*.md', { query: '?raw', import: 'default', eager: true });`;
let workspace = '';
let server: ViteDevServer | undefined;

beforeEach(async () => {
  workspace = await mkdtemp(join(tmpdir(), 'haven-draft-privacy-'));
  await mkdir(join(workspace, 'content/posts'), { recursive: true });
  await writeFile(join(workspace, 'entry.js'), entry);
  await writeFile(join(workspace, 'content/posts/private.md'), `---\ntitle: ${privateTitle}\ndraft: true\n---\n${privateBody}\n<!-- ${privateComment} -->`);
  await writeFile(join(workspace, 'content/posts/public.md'), `---\ntitle: A public post\ndraft: false\n---\n${publicBody}`);
});

afterEach(async () => {
  await server?.close();
  server = undefined;
  // Only delete the fresh test workspace, never a repository or supplied path.
  const target = resolve(workspace);
  const prefix = resolve(tmpdir(), 'haven-draft-privacy-');
  if (workspace && target.startsWith(prefix) && target !== prefix) await rm(target, { recursive: true, force: true });
  workspace = '';
});

describe('draft text never reaches public build artifacts', () => {
  it.each([
    { mode: 'production', ssr: false },
    { mode: 'drafts', ssr: false },
    { mode: 'drafts', ssr: true },
  ])('scans every emitted chunk and asset for mode=$mode SSR=$ssr', async ({ mode, ssr }) => {
    const built = await build({
      root: workspace,
      configFile: false,
      mode,
      logLevel: 'silent',
      plugins: [draftPrivacy()],
      build: {
        write: false,
        minify: false,
        sourcemap: true,
        ...(ssr ? { ssr: join(workspace, 'entry.js') } : { lib: { entry: join(workspace, 'entry.js'), formats: ['es'] } }),
      },
    });
    const outputs = (Array.isArray(built) ? built : [built]).flatMap(result => 'output' in result ? result.output : []);
    expect(outputs.length).toBeGreaterThan(0);
    const text = outputs.map(output => output.type === 'chunk' ? output.code : typeof output.source === 'string' ? output.source : new TextDecoder().decode(output.source)).join('\n');
    expect(text).toContain(publicBody);
    for (const marker of [privateTitle, privateBody, privateComment]) expect(text).not.toContain(marker);
  });
});

describe('draft text visibility in local development', () => {
  it.each([
    { mode: 'development', reveal: false },
    { mode: 'drafts', reveal: true },
  ])('serves raw draft content only for mode=$mode', async ({ mode, reveal }) => {
    server = await createServer({ root: workspace, configFile: false, mode, logLevel: 'silent', plugins: [draftPrivacy()], server: { middlewareMode: true } });
    const response = await server.transformRequest('/content/posts/private.md?raw');
    expect(response).not.toBeNull();
    for (const marker of [privateTitle, privateBody, privateComment]) {
      if (reveal) expect(response!.code).toContain(marker);
      else expect(response!.code).not.toContain(marker);
    }
    const published = await server.transformRequest('/content/posts/public.md?raw');
    expect(published?.code).toContain(publicBody);
  });
});
