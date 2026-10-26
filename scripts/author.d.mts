export interface AuthorOptions { cwd?: string; now?: Date | string | number; lockTimeoutMs?: number }
export interface PostInput { title: string; slug: string; tags?: string }
export interface NoteInput { text: string; mood?: string }
export interface PostResult { kind: 'post'; path: string; slug: string; date: string; draft: true }
export interface NoteResult { kind: 'note'; path: string; id: string; date: string }
export interface HelpResult { kind: 'help'; message: string }
export const usage: string;
export function formatShanghaiDate(now?: Date | string | number): string;
export function parseAuthorArgs(argv: string[]): { help: true } | ({ command: 'post' } & PostInput) | ({ command: 'note' } & NoteInput);
export function createPost(input: PostInput, options?: AuthorOptions): Promise<PostResult>;
export function appendNote(input: NoteInput, options?: AuthorOptions): Promise<NoteResult>;
export function runAuthor(argv: string[], options?: AuthorOptions): Promise<PostResult | NoteResult | HelpResult>;
