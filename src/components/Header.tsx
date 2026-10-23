import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Github, Menu, Monitor, Moon, Search, Settings2, Sun, X } from 'lucide-react';
import { WindowMark } from './Scene';
import { Dialog } from './Dialog';
import { site } from '../config/site';
import { filterPosts } from '../lib/content';
import { usePreferences } from '../context/Preferences';

const navigation = [{ to: '/', name: '首页' }, { to: '/posts/', name: '文章' }, { to: '/notes/', name: '碎碎念' }, { to: '/friends/', name: '友链' }, { to: '/about/', name: '关于' }];

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const preferences = usePreferences();
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (document.querySelector('dialog[open]:not(.search-dialog)')) return;
        event.preventDefault(); setSearchOpen(open => !open);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
  return <>
    <header className="site-header container"><Link className="brand" to="/" aria-label={`${site.name}首页`} onClick={() => setMenuOpen(false)}><WindowMark /><span><span className="brand-title">{site.name}</span><span className="brand-subtitle">A PLACE TO FEEL AT HOME</span></span></Link>
      <nav id="mobile-nav" className={`main-nav ${menuOpen ? 'mobile-open' : ''}`} aria-label="主导航">{navigation.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMenuOpen(false)}>{item.name}</NavLink>)}</nav>
      <div className="header-tools"><button className="icon-button search-launcher" type="button" onClick={() => setSearchOpen(true)} aria-label="搜索文章，快捷键 Ctrl 或 Command 加 K"><Search size={18} /><kbd>⌘ K</kbd></button><button className="icon-button" type="button" onClick={preferences.toggleTheme} aria-label={preferences.resolvedTheme === 'dark' ? '切换浅色模式' : '切换深色模式'}>{preferences.resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button><button className="icon-button settings-launcher" type="button" onClick={() => setSettingsOpen(true)} aria-label="阅读偏好设置"><Settings2 size={17} /></button><button className="icon-button menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="mobile-nav" onClick={() => setMenuOpen(open => !open)} aria-label={menuOpen ? '收起导航' : '展开导航'}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button></div>
    </header>
    <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} title="找一段文字" className="search-dialog"><SearchContent close={() => setSearchOpen(false)} /></Dialog>
    <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} title="让阅读更自在" className="settings-dialog"><div className="settings-content"><p className="muted">一些小小的偏好，会记在这个浏览器里。</p><fieldset><legend>阅读配色</legend><div className="theme-options">{([{ value: 'light', label: '纸白日间', Icon: Sun }, { value: 'dark', label: '暖灯夜间', Icon: Moon }, { value: 'system', label: '跟随系统', Icon: Monitor }] as const).map(({ value, label, Icon }) => <button key={value} className="theme-option" type="button" aria-pressed={preferences.theme === value} onClick={() => preferences.update({ theme: value })}><Icon size={20} />{label}</button>)}</div></fieldset><label className="setting-toggle"><span><strong>显示小安</strong><small>在首页遇见一个安静的小伙伴</small></span><input type="checkbox" checked={preferences.mascot} onChange={event => preferences.update({ mascot: event.target.checked })} /></label><label className="setting-toggle"><span><strong>减少动态效果</strong><small>保留反馈，让画面更安静</small></span><input type="checkbox" checked={preferences.reducedMotion} onChange={event => preferences.update({ reducedMotion: event.target.checked })} /></label><div className="font-setting"><label htmlFor="reading-font-size">文章字号 <span>{preferences.fontSize}px</span></label><input id="reading-font-size" type="range" min="15" max="22" step="1" value={preferences.fontSize} onChange={event => preferences.update({ fontSize: Number(event.target.value) })} /></div></div></Dialog>
  </>;
}

function SearchContent({ close }: { close: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const results = useRef<HTMLDivElement>(null);
  const allMatches = filterPosts(query);
  const matches = allMatches.slice(0, 8);
  return <div className="search-content"><div className="search-field"><Search size={20} /><input ref={input} data-dialog-autofocus type="search" value={query} maxLength={150} onChange={event => setQuery(event.target.value)} placeholder="标题、标签，或记得的一句话…" aria-label="搜索文章" onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); results.current?.querySelector<HTMLAnchorElement>('a')?.focus(); } if (event.key === 'Enter' && matches[0] && !event.nativeEvent.isComposing) { event.preventDefault(); close(); navigate(`/posts/${matches[0].slug}/`); } }} /><kbd>ESC</kbd></div><p className="search-summary" aria-live="polite">{query ? `找到 ${allMatches.length} 篇相关文字` : '最近写下的'}</p><div className="search-results" ref={results}>{matches.length ? matches.map((post, index) => <Link key={post.slug} to={`/posts/${post.slug}/`} onClick={close} onKeyDown={event => { const links = results.current?.querySelectorAll<HTMLAnchorElement>('a'); if (event.key === 'ArrowDown') { event.preventDefault(); links?.[Math.min(index + 1, matches.length - 1)]?.focus(); } if (event.key === 'ArrowUp') { event.preventDefault(); if (index === 0) input.current?.focus(); else links?.[index - 1]?.focus(); } }}><span><small>{post.category}</small><strong>{post.title}</strong><p>{post.description}</p></span><ArrowUpRight size={18} /></Link>) : <div className="quiet-empty"><Search size={25} /><p>暂时没有找到，换一个词试试。</p><button className="text-button" type="button" onClick={() => setQuery('')}>清除搜索</button></div>}</div>{allMatches.length > matches.length && <Link className="search-all-results" to={`/posts/?q=${encodeURIComponent(query.trim())}`} onClick={close}>查看全部 {allMatches.length} 篇文字<ArrowUpRight size={16} /></Link>}<div className="search-help"><span>↑ ↓ 选择</span><span>Enter 打开</span><span>Esc 关闭</span></div></div>;
}

export function Footer() {
  return <footer className="site-footer container"><div><Link to="/" className="footer-brand"><WindowMark small /><span>{site.name}</span></Link><p>{site.tagline}</p></div><div className="footer-right"><div><Link to="/about/">关于这里</Link><a href={`${import.meta.env.BASE_URL}rss.xml`} target="_blank" rel="noopener noreferrer">RSS 订阅</a>{site.author.github && <a href={site.author.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub"><Github size={15} /></a>}</div><span>© {new Date().getFullYear()} {site.name}</span></div></footer>;
}
