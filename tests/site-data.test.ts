import { describe, expect, it } from 'vitest';
import { stringify } from 'yaml';
import { aboutBody, friendsData, notesData, parseFriends, parseNotes, parseSiteData, siteData, validateSiteData } from '../src/lib/site-data';
import type { SiteData } from '../src/lib/site-data';

const siteFixture: SiteData = {
  name: 'Test blog',
  tagline: 'A quiet place',
  description: 'A site used by parser tests.',
  url: '',
  author: { name: 'Test author', bio: 'A short introduction.', github: '', email: '' },
  home: {
    eyebrow: 'Welcome', title: 'Some words', emphasis: 'to keep',
    description: ['A first paragraph.'], quietNote: 'Take your time.',
  },
  comments: { enabled: false, repo: '', repoId: '', category: '', categoryId: '', reactions: true },
};

describe('editable public site data', () => {
  it('loads authored content with its expected structure independent of its wording', () => {
    expect(siteData).toMatchObject({
      name: expect.any(String), url: expect.any(String),
      author: { name: expect.any(String), bio: expect.any(String), github: expect.any(String), email: expect.any(String) },
      home: { description: expect.any(Array) },
      comments: { enabled: expect.any(Boolean), reactions: expect.any(Boolean) },
    });
    expect(Array.isArray(notesData)).toBe(true);
    for (const note of notesData) {
      expect(note).toMatchObject({ id: expect.any(String), date: expect.any(String), mood: expect.any(String), text: expect.any(String) });
    }
    expect(Array.isArray(friendsData)).toBe(true);
    for (const friend of friendsData) {
      expect(friend).toMatchObject({ name: expect.any(String), description: expect.any(String), url: expect.any(String) });
    }
    expect(aboutBody).toBeTypeOf('string');
  });

  it('supports BOM, trimmed text, public HTTPS links and local author avatars', () => {
    const result = parseSiteData(`\uFEFF${stringify({
      ...siteFixture,
      name: '  我的博客  ',
      url: 'https://example.com/blog/',
      author: { ...siteFixture.author, github: 'https://github.com/example', email: 'writer+blog@example.com', avatar: '/images/my avatar.png' },
    })}`);
    expect(result.name).toBe('我的博客');
    expect(result.url).toBe('https://example.com/blog');
    expect(result.author.avatar).toBe('/images/my avatar.png');
    expect(result.author.email).toBe('writer+blog@example.com');
  });

  it('keeps empty optional contact and comment identifiers valid', () => {
    const result = validateSiteData(siteFixture);
    expect(result.url).toBe('');
    expect(result.author.github).toBe('');
    expect(result.author.email).toBe('');
    expect(result.author.avatar).toBeUndefined();
    expect(result.comments.enabled).toBe(false);
  });

  it('reports the source and field for invalid types, typoed fields and malformed YAML', () => {
    for (const value of [
      { ...siteFixture, name: '' },
      { ...siteFixture, author: [] },
      { ...siteFixture, home: { ...siteFixture.home, description: 'not an array' } },
      { ...siteFixture, home: { ...siteFixture.home, description: [] } },
      { ...siteFixture, home: { ...siteFixture.home, description: ['good', 5] } },
      { ...siteFixture, comments: { ...siteFixture.comments, enabled: 'false' } },
      { ...siteFixture, comments: { ...siteFixture.comments, reaction: true } },
    ]) {
      expect(() => parseSiteData(stringify(value), 'settings.yaml')).toThrow(/settings\.yaml/);
    }
    expect(() => parseSiteData('name: one\nname: two')).toThrow(/YAML/);
    expect(() => parseSiteData('- not-a-map')).toThrow(/字段映射/);
  });

  it('rejects executable, insecure, credential-bearing or ambiguous site links', () => {
    for (const url of ['javascript:alert(1)', 'http://example.com', '//example.com', 'https://writer:secret@example.com', 'https://example.com/?q=1', 'https://example.com/#section', 'https:\\example.com']) {
      expect(() => validateSiteData({ ...siteFixture, url }), url).toThrow(/url/);
    }
    expect(() => validateSiteData({ ...siteFixture, author: { ...siteFixture.author, github: 'http://github.com/example' } })).toThrow(/author\.github/);
    for (const email of ['mailto:writer@example.com', 'writer@example.com?subject=test', 'not an email', 'writer@example.com\nBcc:else@example.com']) {
      expect(() => validateSiteData({ ...siteFixture, author: { ...siteFixture.author, email } }), email).toThrow(/author\.email/);
    }
  });

  it('rejects unsafe avatar paths while accepting normal public paths', () => {
    for (const avatar of ['javascript:alert(1)', 'data:image/svg+xml,<svg/>', '//example.com/a.png', 'http://example.com/a.png', '../outside.png', '/images/%2e%2e/outside.png', '/%2fexample.com/a.png', 'images\\outside.png', '/bad%ZZ.png']) {
      expect(() => validateSiteData({ ...siteFixture, author: { ...siteFixture.author, avatar } }), avatar).toThrow(/author\.avatar/);
    }
    expect(validateSiteData({ ...siteFixture, author: { ...siteFixture.author, avatar: 'images/avatar.png' } }).author.avatar).toBe('images/avatar.png');
  });

  it('validates public Discussions identifiers without requiring live configuration', () => {
    const comments = { ...siteFixture.comments, repo: 'owner/blog', repoId: 'R_kgDO123', categoryId: 'DIC_kwDO123' };
    expect(validateSiteData({ ...siteFixture, comments }).comments).toEqual(comments);
    expect(() => validateSiteData({ ...siteFixture, comments: { ...comments, repo: 'https://github.com/owner/blog' } })).toThrow(/comments\.repo/);
    expect(() => validateSiteData({ ...siteFixture, comments: { ...comments, repoId: 'bad id' } })).toThrow(/comments\.repoId/);
  });
});

describe('editable public notes', () => {
  const note = { id: 'a-day', date: '2026-10-23', mood: '日常', text: '一段记录。' };

  it('supports empty files and multiple notes on one day with stable ids', () => {
    expect(parseNotes('[]')).toEqual([]);
    expect(parseNotes('# 暂无记录')).toEqual([]);
    const data = [
      { ...note, id: 'older', date: '2026-10-22' },
      { ...note, id: 'z-first' },
      { ...note, id: 'a-second', mood: '' },
      { ...note, id: 'newest', date: '2026-10-24' },
    ];
    expect(parseNotes(stringify(data)).map(item => item.id)).toEqual(['newest', 'z-first', 'a-second', 'older']);
  });

  it('rejects repeated IDs, invalid calendars and malformed entries', () => {
    expect(() => parseNotes(stringify([note, note]))).toThrow(/重复 id/);
    for (const change of [
      { id: 'A-Day' }, { id: '../day' }, { date: '2026-02-29' },
      { date: '1900-02-29' }, { date: '2026-04-31' }, { date: '2026-1-01' },
      { text: '  ' }, { mood: true }, { extra: 'typo' },
    ]) {
      expect(() => parseNotes(stringify([{ ...note, ...change }]))).toThrow(/content\/notes\.yaml/);
    }
    expect(parseNotes(stringify([{ ...note, date: '2024-02-29' }]))).toHaveLength(1);
    expect(() => parseNotes('text: not-an-array')).toThrow(/数组/);
  });
});

describe('editable friend links', () => {
  const friend = { name: 'A blog', description: '一些文字。', url: 'https://example.com', avatar: '/images/friend.png' };

  it('loads ordered HTTPS friends with optional local or external avatars', () => {
    const result = parseFriends(stringify([friend, { ...friend, name: 'Another blog', url: 'https://other.example.com', avatar: 'https://images.example.com/avatar.png' }]));
    expect(result[0]).toMatchObject({ name: 'A blog', url: 'https://example.com/', avatar: '/images/friend.png' });
    expect(result[1].avatar).toBe('https://images.example.com/avatar.png');
    expect(parseFriends('[]')).toEqual([]);
  });

  it('rejects duplicate addresses, unsafe links and incomplete descriptions', () => {
    expect(() => parseFriends(stringify([friend, { ...friend, url: 'https://EXAMPLE.com/' }]))).toThrow(/重复/);
    for (const change of [{ url: 'http://example.com' }, { url: 'javascript:alert(1)' }, { url: 'https://user:secret@example.com' }, { name: '' }, { description: null }, { avatar: 'blob:example' }]) {
      expect(() => parseFriends(stringify([{ ...friend, ...change }]))).toThrow(/content\/friends\.yaml/);
    }
  });
});
