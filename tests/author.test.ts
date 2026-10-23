import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { appendNote, createPost, formatShanghaiDate, parseAuthorArgs, runAuthor } from '../scripts/author.mjs';
import { parsePost } from '../src/lib/content';

const execFileAsync = promisify(execFile);
const script = resolve('scripts/author.mjs');
let cwd: string;
const date = new Date('2026-10-23T17:30:00Z');
beforeEach(async () => { cwd = await mkdtemp(join(tmpdir(), 'peaceful-author-')); });
afterEach(async () => {
  const target = resolve(cwd);
  // Only remove the unique directory created by this test, never a source checkout.
  if (dirname(target) !== resolve(tmpdir()) || !target.split(sep).at(-1)?.startsWith('peaceful-author-')) throw new Error('Unsafe test cleanup path');
  await rm(target, { recursive: true, force: true });
});

describe('authoring command validation', () => {
  it('uses Shanghai calendar dates regardless of the host timezone', () => {
    expect(formatShanghaiDate(date)).toBe('2026-10-24');
    expect(formatShanghaiDate(new Date('2026-10-23T15:59:59Z'))).toBe('2026-10-23');
    expect(() => formatShanghaiDate('bad')).toThrow(/日期/);
  });
  it('accepts explicit commands and rejects unknown, repeated or missing values', () => {
    expect(parseAuthorArgs(['post', '--title=你好：世界', '--slug', 'my-post', '--category', '技术'])).toEqual({ command: 'post', title: '你好：世界', slug: 'my-post', category: '技术' });
    expect(parseAuthorArgs(['note', '--text=-- a literal note'])).toEqual({ command: 'note', text: '-- a literal note' });
    for (const args of [['publish'], ['post'], ['post', '--title', '--slug', 'x'], ['note', '--text', ''], ['note', '--text', 'a', '--text', 'b'], ['note', '--unknown', 'x'], ['post', 'hello']]) expect(() => parseAuthorArgs(args), args.join(' ')).toThrow();
  });
  it('rejects unsafe, reserved and ambiguous filenames without creating files', async () => {
    for (const slug of ['../escape', 'UpperCase', '-bad', 'bad--slug', 'bad-', 'a/b', 'a\\b', 'con', 'nul', 'com1', 'lpt9', 'x'.repeat(101)]) {
      await expect(createPost({ title: 'Title', slug }, { cwd, now: date })).rejects.toThrow(/slug/);
    }
    expect(await readdir(cwd)).toEqual([]);
  });
});

describe('draft article creation', () => {
  it('creates a valid unpublished Markdown draft and never fabricates a description', async () => {
    const result = await createPost({ title: '标题：含有 "引号"\n和换行', slug: 'first-post' }, { cwd, now: date });
    expect(result).toMatchObject({ kind: 'post', draft: true, date: '2026-10-24' });
    const raw = await readFile(result.path, 'utf8');
    const frontmatter = parse(raw.split('---\n')[1]);
    expect(frontmatter).toMatchObject({ title: '标题：含有 "引号"\n和换行', slug: 'first-post', date: '2026-10-24', category: '随想', draft: true, sample: false, comments: true });
    expect(frontmatter.description).toBeUndefined();
    expect(parsePost(raw, result.path)).toBeNull();
    expect(parsePost(raw.replace('draft: true', 'draft: false'), result.path)?.title).toBe(frontmatter.title);
    expect(await readdir(dirname(result.path))).toEqual(['first-post.md']);
  });
  it('never replaces an existing post, including concurrent creation attempts', async () => {
    const results = await Promise.allSettled([
      createPost({ title: 'First', slug: 'same' }, { cwd, now: date }),
      createPost({ title: 'Second', slug: 'same' }, { cwd, now: date }),
    ]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
    const path = join(cwd, 'content', 'posts', 'same.md');
    const original = await readFile(path, 'utf8');
    await expect(createPost({ title: 'Third', slug: 'same' }, { cwd })).rejects.toThrow(/未覆盖/);
    expect(await readFile(path, 'utf8')).toBe(original);
    expect(await readdir(dirname(path))).toEqual(['same.md']);
  });
});

describe('public short-note authoring', () => {
  it('appends to a valid notes array and retains existing entries and comments', async () => {
    const path = join(cwd, 'content', 'notes.yaml'); await mkdir(dirname(path), { recursive: true });
    await writeFile(path, '# 作者保留的说明\n- id: existing-note\n  date: 2026-10-01\n  mood: ""\n  text: 原来的文字\n');
    const result = await appendNote({ text: '这是一条公开记录：\n第二行。', mood: '随记' }, { cwd, now: date });
    const content = await readFile(path, 'utf8');
    expect(content).toContain('# 作者保留的说明');
    expect(parse(content)).toEqual([
      { id: 'existing-note', date: '2026-10-01', mood: '', text: '原来的文字' },
      { id: result.id, date: '2026-10-24', mood: '随记', text: '这是一条公开记录：\n第二行。' },
    ]);
    expect(result.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(await readdir(dirname(path))).toEqual(['notes.yaml']);
  });
  it('serializes concurrent writers without dropping notes', async () => {
    const results = await Promise.all(Array.from({ length: 8 }, (_, index) => appendNote({ text: `记录 ${index}` }, { cwd, now: date })));
    const notes = parse(await readFile(join(cwd, 'content', 'notes.yaml'), 'utf8'));
    expect(notes).toHaveLength(8);
    expect(new Set(notes.map((note: { id: string }) => note.id)).size).toBe(8);
    expect(new Set(notes.map((note: { text: string }) => note.text))).toEqual(new Set(Array.from({ length: 8 }, (_, index) => `记录 ${index}`)));
    expect(results.every(result => result.kind === 'note')).toBe(true);
  });
  it('preserves invalid existing files and releases the write lock on failure', async () => {
    const path = join(cwd, 'content', 'notes.yaml'); await mkdir(dirname(path), { recursive: true });
    for (const raw of ['not: an-array\n', '- id: duplicated\n  text: missing-fields\n', '- id: invalid-date\n  date: 2026-02-30\n  mood: 日常\n  text: 内容\n', '[invalid yaml']) {
      await writeFile(path, raw);
      await expect(appendNote({ text: 'New' }, { cwd, now: date })).rejects.toThrow();
      expect(await readFile(path, 'utf8')).toBe(raw);
      expect(await readdir(dirname(path))).toEqual(['notes.yaml']);
    }
  });
  it('fails safely when another writer owns the lock', async () => {
    await mkdir(join(cwd, 'content', '.notes.yaml.lock'), { recursive: true });
    await expect(appendNote({ text: 'New' }, { cwd, lockTimeoutMs: 0 })).rejects.toThrow(/正在写入/);
    expect(await readdir(join(cwd, 'content'))).toEqual(['.notes.yaml.lock']);
  });
});

describe('CLI entry point', () => {
  it('prints help without creating content and reports invalid input with a failing exit status', async () => {
    expect(await runAuthor(['--help'], { cwd })).toMatchObject({ kind: 'help' });
    const help = await execFileAsync(process.execPath, [script, '--help'], { cwd });
    expect(help.stdout).toContain('文章始终创建为草稿'); expect(await readdir(cwd)).toEqual([]);
    await expect(execFileAsync(process.execPath, [script, 'post', '--title', 'Missing slug'], { cwd })).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('--slug') });
    expect(await readdir(cwd)).toEqual([]);
  });
  it('writes a draft through the actual command in a temporary workspace', async () => {
    const result = await execFileAsync(process.execPath, [script, 'post', '--title', '真实命令测试', '--slug', 'cli-post'], { cwd });
    expect(result.stdout).toContain('尚未发布');
    expect(parsePost(await readFile(join(cwd, 'content', 'posts', 'cli-post.md'), 'utf8'), 'cli-post.md')).toBeNull();
  });
});
