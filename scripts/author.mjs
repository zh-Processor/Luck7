import { randomUUID } from 'node:crypto';
import { mkdir, open, link, readFile, rename, rmdir, unlink } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isSeq, parseDocument, stringify } from 'yaml';

export const usage = `用法：
  node scripts/author.mjs post --title "文章标题" --slug my-post [--tags "随想,日常"]
  node scripts/author.mjs note --text "公开的碎碎念内容" [--mood 日常]

文章始终创建为草稿；请编辑完成后将 draft 改为 false，再构建发布。
碎碎念写入公开博客内容文件，重新构建并部署后显示。
选项支持 --name value 或 --name=value；--help 显示此说明。`;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const reservedFilename = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const errorCode = error => error && typeof error === 'object' ? error.code : undefined;
const delay = ms => new Promise(done => setTimeout(done, ms));

function requiredText(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label}必须是非空文本。`);
  if (value.includes('\0')) throw new Error(`${label}不能包含空字符。`);
  return value.trim();
}
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value && !value.startsWith('0000');
}
export function formatShanghaiDate(now = new Date()) {
  const date = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(date.getTime())) throw new Error('无法确定当前日期。');
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = name => parts.find(item => item.type === name)?.value;
  const value = `${part('year')}-${part('month')}-${part('day')}`;
  if (!validDate(value)) throw new Error('日期需要在公元 0001 至 9999 年之间。');
  return value;
}

export function parseAuthorArgs(argv) {
  if (!Array.isArray(argv) || argv.some(value => typeof value !== 'string')) throw new Error('命令参数必须为文本数组。');
  if (!argv.length || (argv.length === 1 && ['--help', '-h'].includes(argv[0]))) return { help: true };
  const [command, ...rest] = argv;
  if (!['post', 'note'].includes(command)) throw new Error(`未知命令「${command}」，请使用 post 或 note。`);
  if (rest.length === 1 && ['--help', '-h'].includes(rest[0])) return { help: true };
  const accepted = command === 'post' ? ['title', 'slug', 'tags'] : ['text', 'mood'];
  const values = {};
  for (let index = 0; index < rest.length; index++) {
    const argument = rest[index];
    if (!argument.startsWith('--')) throw new Error(`无法识别参数「${argument}」。`);
    const equals = argument.indexOf('=');
    const name = argument.slice(2, equals < 0 ? undefined : equals);
    if (!accepted.includes(name)) throw new Error(`未知选项 --${name}。`);
    if (Object.hasOwn(values, name)) throw new Error(`选项 --${name} 只能填写一次。`);
    const value = equals < 0 ? rest[++index] : argument.slice(equals + 1);
    if (value === undefined || (equals < 0 && value.startsWith('--'))) throw new Error(`选项 --${name} 缺少内容。`);
    values[name] = requiredText(value, `--${name} `);
  }
  for (const name of command === 'post' ? ['title', 'slug'] : ['text']) {
    if (!Object.hasOwn(values, name)) throw new Error(`缺少必填选项 --${name}。`);
  }
  return { command, ...values };
}

async function readOptional(path) {
  try { return await readFile(path, 'utf8'); }
  catch (error) { if (errorCode(error) === 'ENOENT') return null; throw error; }
}
async function writeTemporary(target, content) {
  const temporary = resolve(dirname(target), `.${basename(target)}.${randomUUID()}.tmp`);
  const handle = await open(temporary, 'wx');
  try { await handle.writeFile(content, 'utf8'); await handle.sync(); }
  catch (error) { await handle.close(); await unlink(temporary).catch(() => {}); throw error; }
  await handle.close();
  return temporary;
}

/** Create a complete new file atomically without ever replacing an existing draft. */
export async function createPost(input, options = {}) {
  const cwd = resolve(options.cwd || process.cwd());
  const title = requiredText(input?.title, '文章标题');
  const slug = requiredText(input?.slug, '文章 slug');
  if (!slugPattern.test(slug) || slug.length > 100 || reservedFilename.test(slug)) throw new Error('slug 需要 1 至 100 个小写英文字母、数字或分隔用短横线，且不能使用 Windows 保留文件名。');
  const tags = input?.tags === undefined ? [] : [...new Set(requiredText(input.tags, '文章标签').split(/[,，]/).map(tag => tag.trim()).filter(Boolean))];
  const date = formatShanghaiDate(options.now ?? new Date());
  const path = resolve(cwd, 'content', 'posts', `${slug}.md`);
  await mkdir(dirname(path), { recursive: true });
  const content = `---\n${stringify({ title, slug, date, tags, draft: true, sample: false, comments: true })}---\n\n## 从这里开始\n\n<!-- 在这里写下正文。完成后将上方 draft 改为 false，再构建发布。 -->\n`;
  const temporary = await writeTemporary(path, content);
  try { await link(temporary, path); }
  catch (error) {
    if (errorCode(error) === 'EEXIST') throw new Error(`文章已存在，未覆盖：${path}`);
    throw error;
  } finally { await unlink(temporary); }
  return { kind: 'post', path, slug, date, draft: true };
}

async function acquireLock(path, timeoutMs) {
  const started = Date.now();
  for (;;) {
    try { await mkdir(path); return; }
    catch (error) {
      if (errorCode(error) !== 'EEXIST') throw error;
      if (Date.now() - started >= timeoutMs) throw new Error(`碎碎念文件正在写入，未修改内容。请稍后重试；若上次命令意外中断，请确认没有写入进程后移除锁目录：${path}`);
      await delay(25);
    }
  }
}
function readNotesDocument(raw) {
  const document = parseDocument((raw || '[]\n').replace(/^\uFEFF/, ''), { uniqueKeys: true });
  if (document.errors.length) throw new Error(`碎碎念 YAML 格式错误：${document.errors[0].message}`);
  if (!isSeq(document.contents)) throw new Error('content/notes.yaml 必须是 YAML 数组。');
  let notes;
  try { notes = document.toJS({ maxAliasCount: 20 }); }
  catch { throw new Error('无法读取碎碎念 YAML，未修改文件。'); }
  const ids = new Set();
  for (const note of notes) {
    if (!note || typeof note !== 'object' || Array.isArray(note) || typeof note.id !== 'string' || !slugPattern.test(note.id) || ids.has(note.id)
      || !validDate(note.date) || typeof note.mood !== 'string' || typeof note.text !== 'string' || !note.text.trim()) {
      throw new Error('现有碎碎念存在无效或重复的 id、日期、心情或正文，未修改文件。');
    }
    ids.add(note.id);
  }
  return { document, ids };
}

/** Cooperating CLI writers serialize their read/append/replace operation via an exclusive lock. */
export async function appendNote(input, options = {}) {
  const cwd = resolve(options.cwd || process.cwd());
  const text = requiredText(input?.text, '碎碎念正文');
  const mood = input?.mood === undefined ? '日常' : requiredText(input.mood, '心情');
  const date = formatShanghaiDate(options.now ?? new Date());
  const path = resolve(cwd, 'content', 'notes.yaml');
  const lockPath = resolve(dirname(path), '.notes.yaml.lock');
  const timeoutMs = typeof options.lockTimeoutMs === 'number' && Number.isFinite(options.lockTimeoutMs) ? Math.max(0, options.lockTimeoutMs) : 5000;
  await mkdir(dirname(path), { recursive: true });
  await acquireLock(lockPath, timeoutMs);
  let temporary;
  try {
    const original = await readOptional(path);
    const { document, ids } = readNotesDocument(original);
    let id;
    do { id = `note-${date.replaceAll('-', '')}-${randomUUID().replaceAll('-', '')}`; } while (ids.has(id));
    document.add({ id, date, mood, text });
    // Prefer normal block YAML for author readability, preserving existing comments.
    document.contents.flow = false;
    temporary = await writeTemporary(path, document.toString());
    if (await readOptional(path) !== original) throw new Error('碎碎念文件在写入时被其他程序修改，已保留其修改，请重试。');
    await rename(temporary, path); temporary = undefined;
    return { kind: 'note', path, id, date };
  } finally {
    if (temporary) await unlink(temporary).catch(() => {});
    await rmdir(lockPath);
  }
}
export async function runAuthor(argv, options = {}) {
  const input = parseAuthorArgs(argv);
  if (input.help) return { kind: 'help', message: usage };
  return input.command === 'post' ? createPost(input, options) : appendNote(input, options);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await runAuthor(process.argv.slice(2));
    if (result.kind === 'help') console.log(result.message);
    else if (result.kind === 'post') console.log(`已创建文章草稿（尚未发布）：${result.path}\n编辑完成后将 draft 改为 false，再运行构建。`);
    else console.log(`已添加公开碎碎念：${result.id}\n文件：${result.path}\n重新构建并部署后显示。`);
  } catch (error) {
    console.error(`写作失败：${error instanceof Error ? error.message : String(error)}\n使用 --help 查看命令说明。`);
    process.exitCode = 1;
  }
}
