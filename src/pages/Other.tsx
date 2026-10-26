import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy, Github, Link2, Mail, MessageCircle, Sprout } from 'lucide-react';
import { asset, site } from '../config/site';
import { formatDate, notes } from '../lib/content';
import { aboutBody } from '../lib/site-data';
import { copyText } from '../lib/storage';
import { Mascot, StudyScene, WindowMark } from '../components/Scene';
import { MarkdownBody } from '../components/MarkdownBody';

export function Notes() {
  return <div className="page-container container">
    <header className="page-intro"><div className="eyebrow">LITTLE MOMENTS</div><h1>一些，心安时刻<span>.</span></h1><p>不是每件小事，都需要写成一篇文章。</p></header>
    <div className="notes-layout">
      {notes.length ? <div className="notes-timeline">{notes.map((note, index) => <article className="note-item" key={note.id}><div className="note-date"><time dateTime={note.date}>{formatDate(note.date)}</time><span>{note.mood}</span></div><p>{note.text}</p>{index === 0 && <span className="note-leaf"><Sprout size={22} strokeWidth={1.3} /></span>}</article>)}</div> : <section className="quiet-empty notes-empty"><Sprout size={35} strokeWidth={1.2} /><h2>日常，慢慢写下。</h2><p>这里会留下那些不长，却值得记住的小事。</p><Link className="text-link" to="/posts/">先读一篇文章<ArrowRight size={15} /></Link></section>}
      <aside className="notes-aside"><Sprout size={40} strokeWidth={1} /><p>把平凡的日子，<br />过成值得记住的小事。</p><span>some days, some little things.</span></aside>
    </div>
  </div>;
}

export function About() {
  return <div className="page-container container about-page">
    <header className="page-intro"><div className="eyebrow">ABOUT THIS LITTLE PLACE</div><h1>很高兴，在这里遇见你<span>.</span></h1><p>隔着屏幕，也可以认识一个有趣的灵魂。</p></header>
    <section className="about-hello"><div><span className="intro-label">你好，欢迎来坐坐</span><h2>{site.author.name}</h2><p>{site.author.bio}</p><div className="about-contacts">
      {site.author.github && <a className="button button-secondary" href={site.author.github} target="_blank" rel="noopener noreferrer"><Github size={16} />GitHub<ArrowUpRight size={14} /></a>}
      {site.author.email && <a className="button button-secondary" href={`mailto:${site.author.email}`}><Mail size={16} />写封信</a>}
    </div></div><StudyScene /></section>
    <section className="about-prose article-prose" aria-label="关于这个博客"><MarkdownBody body={aboutBody} /><div className="about-next"><Link to="/posts/">翻翻这里的文字<ArrowRight size={15} /></Link><Link to="/friends/">去拜访朋友们<ArrowUpRight size={15} /></Link></div></section>
  </div>;
}

export function Friends() {
  const [copied, setCopied] = useState('');
  const [showApply, setShowApply] = useState(false);
  const [address, setAddress] = useState(site.url);
  const discussions = site.comments.repo && site.comments.repoId && site.comments.categoryId ? `https://github.com/${site.comments.repo}/discussions` : '';
  const canContact = Boolean(site.author.email || discussions);
  useEffect(() => { if (!site.url) setAddress(new URL(import.meta.env.BASE_URL, window.location.origin).href.replace(/\/$/, '')); }, []);
  async function copyCard() {
    const avatar = site.author.avatar || 'favicon.svg';
    const avatarUrl = /^https?:/.test(avatar) ? avatar : new URL(avatar.replace(/^\//, ''), `${address.replace(/\/$/, '')}/`).href;
    try { await copyText(`站名：${site.name}\n简介：${site.tagline}\n地址：${address}\n头像：${avatarUrl}`); setCopied('已复制本站信息'); }
    catch { setCopied('暂时无法复制，请手动复制'); }
  }
  return <div className="page-container container">
    <header className="page-intro"><div className="eyebrow">NEIGHBORS & KINDRED SPIRITS</div><h1>远方的朋友们<span>.</span></h1><p>借由一个链接，去拜访另一个有趣的灵魂。</p></header>
    {site.friends.length ? <div className="friends-grid">{site.friends.map(friend => <a key={friend.url} className="friend-card" href={friend.url} target="_blank" rel="noopener noreferrer"><span className="friend-avatar">{friend.avatar ? <img src={asset(friend.avatar)} alt="" loading="lazy" /> : <Link2 size={24} />}</span><span><strong>{friend.name}</strong><p>{friend.description}</p><small>{new URL(friend.url).hostname}</small></span><ArrowUpRight size={17} /></a>)}</div> : <div className="friends-empty"><span className="empty-link"><Link2 size={32} strokeWidth={1.3} /></span><h2>给你，留一个位置</h2><p>这条小路上，期待遇见更多认真写字的人。<br />朋友的名字，会在这里慢慢增加。</p>{canContact && <button className="button button-secondary" type="button" onClick={() => setShowApply(true)}>交换一个链接<ArrowUpRight size={16} /></button>}</div>}
    <div className="friends-bottom"><section className="site-card"><div className="section-heading"><h2>把这个小角落带走</h2><WindowMark small /></div><dl><div><dt>站名</dt><dd>{site.name}</dd></div><div><dt>简介</dt><dd>{site.tagline}</dd></div><div><dt>地址</dt><dd>{address || '本站'}</dd></div></dl><button className="button button-secondary" type="button" disabled={!address} onClick={copyCard}>{copied === '已复制本站信息' ? <Check size={15} /> : <Copy size={15} />}<span aria-live="polite">{copied || '复制本站信息'}</span></button></section>
      <section className="friends-guidelines" id="friend-request"><h2>关于交换友链</h2><p>喜欢有真实内容、持续更新的个人博客。不必有很高的访问量，有自己的表达就很好。</p>{canContact ? <><p>准备好站名、地址、一句话介绍和头像，我们就可以认识一下。</p><button className="text-button" type="button" onClick={() => setShowApply(value => !value)} aria-expanded={showApply}>如何联系<ArrowRight size={14} /></button>{showApply && <div className="contact-reveal">{site.author.email ? <a href={`mailto:${site.author.email}?subject=${encodeURIComponent(`${site.name} · 友链申请`)}`}><Mail size={15} />发一封友链来信</a> : <a href={discussions} target="_blank" rel="noopener noreferrer"><MessageCircle size={15} />在 Discussions 中留言</a>}</div>}</> : <p>愿文字成为一条小路，让我们在远方相逢。</p>}</section>
    </div>
  </div>;
}

export function NotFound() {
  return <div className="not-found container"><div className="lost-mascot"><Mascot /></div><span className="eyebrow">404 / A QUIET LITTLE DETOUR</span><h1>好像走进了一条<br />安静的小路。</h1><p>这页文字还没有到来，或者已经搬了家。<br />先回去，读一点别的吧。</p><div><Link className="button button-primary" to="/"><ArrowLeft size={16} />回到首页</Link><Link className="button button-text" to="/posts/">去看看文章<ArrowRight size={15} /></Link></div></div>;
}
