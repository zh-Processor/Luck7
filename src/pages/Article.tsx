import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Check, Clock3, Copy, List, Maximize2, Minimize2, Minus, Plus } from 'lucide-react';
import { formatDate, getHeadings, posts } from '../lib/content';
import { usePreferences } from '../context/Preferences';
import { copyText } from '../lib/storage';
import { MarkdownBody } from '../components/MarkdownBody';
import { Comments } from '../components/Comments';
import { PostCard } from '../components/PostCard';
import { NotFound } from './Other';

export function Article() {
  const { slug } = useParams();
  const post = posts.find(item => item.slug === slug);
  const prefs = usePreferences();
  const [progress, setProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState('');
  const [copied, setCopied] = useState('');
  const body = useRef<HTMLDivElement>(null);
  const headings = useMemo(() => post ? getHeadings(post.body) : [], [post?.body]);
  useEffect(() => {
    setCopied('');
    const update = () => {
      if (!body.current) return;
      const top = body.current.getBoundingClientRect().top + window.scrollY;
      const available = body.current.offsetHeight - window.innerHeight * .45;
      setProgress(Math.min(100, Math.max(0, (window.scrollY - top + 180) / Math.max(1, available) * 100)));
      const sections = body.current.querySelectorAll('h2[id^="section-"], h3[id^="section-"]');
      let active = sections[0]?.id || '';
      sections.forEach(section => { if (section.getBoundingClientRect().top <= 160) active = section.id; });
      setActiveHeading(active);
    };
    let frame = 0;
    const scroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update(); window.addEventListener('scroll', scroll, { passive: true }); window.addEventListener('resize', scroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll); };
  }, [slug]);
  useEffect(() => () => { prefs.update({ focus: false }); }, [slug, prefs.update]);
  if (!post) return <NotFound />;
  const related = posts.filter(item => item.slug !== post.slug && (item.category === post.category || item.tags.some(tag => post.tags.includes(tag)))).slice(0, 2);
  const index = posts.indexOf(post);
  const hasHeadings = headings.length > 0;
  const toc = <nav aria-label="文章目录"><ol>{headings.map(heading => <li key={heading.id} className={`${heading.level === 3 ? 'toc-subheading' : ''} ${activeHeading === heading.id ? 'active' : ''}`}><a href={`#${heading.id}`} onClick={event => { event.preventDefault(); document.getElementById(heading.id)?.scrollIntoView({ behavior: prefs.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); }}>{heading.text}</a></li>)}</ol></nav>;
  return <div className={`article-page ${prefs.focus ? 'focus-mode' : ''} ${hasHeadings ? '' : 'no-toc'}`}><div className="reading-progress" role="progressbar" aria-label="文章阅读进度" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div><div className="container article-container"><Link className="back-link" to="/posts/"><ArrowLeft size={15} />回到文章</Link><header className="article-header"><Link className="post-category" to={`/posts/?category=${encodeURIComponent(post.category)}`}>{post.category}</Link><h1>{post.title}</h1><p className="article-description">{post.description}</p><div className="post-meta"><time dateTime={post.date}>{formatDate(post.date)}</time>{post.updated && <span>更新于 {formatDate(post.updated)}</span>}<span><Clock3 size={13} />{post.minutes} 分钟阅读</span>{post.draft && <span className="draft-label">草稿</span>}{post.sample && <span className="sample-label">示例文章</span>}</div><div className="article-tools"><div className="font-tools" aria-label="文章字号"><button type="button" className="icon-button" disabled={prefs.fontSize <= 15} onClick={() => prefs.update({ fontSize: prefs.fontSize - 1 })} aria-label="缩小字号"><Minus size={14} /></button><span>Aa</span><button type="button" className="icon-button" disabled={prefs.fontSize >= 22} onClick={() => prefs.update({ fontSize: prefs.fontSize + 1 })} aria-label="增大字号"><Plus size={14} /></button></div><button className="text-button" type="button" onClick={() => prefs.update({ focus: !prefs.focus })}>{prefs.focus ? <Minimize2 size={15} /> : <Maximize2 size={15} />}{prefs.focus ? '退出专注' : '安静阅读'}</button><button className="text-button" type="button" onClick={async () => { try { await copyText(window.location.href); setCopied('链接已复制'); } catch { setCopied('复制失败，请从地址栏复制'); } }}>{copied === '链接已复制' ? <Check size={14} /> : <Copy size={14} />}<span aria-live="polite">{copied || '分享文章'}</span></button></div></header>
    <div className="article-layout"><div className="article-main">{hasHeadings && <details className="mobile-toc"><summary><List size={16} />这篇文章的目录</summary>{toc}</details>}<div className="article-prose" ref={body}><MarkdownBody body={post.body} /></div><div className="article-end-mark">✧<span>谢谢你，读到这里。</span></div><div className="article-tags">{post.tags.map(tag => <Link to={`/posts/?tag=${encodeURIComponent(tag)}`} key={tag}>#{tag}</Link>)}</div>{posts.length > 1 && <nav className="article-neighbors" aria-label="相邻文章">{posts[index + 1] ? <Link to={`/posts/${posts[index + 1].slug}/`}><span><ArrowLeft size={13} />上一篇</span><strong>{posts[index + 1].title}</strong></Link> : <span />}{posts[index - 1] ? <Link to={`/posts/${posts[index - 1].slug}/`}><span>下一篇<ArrowRight size={13} /></span><strong>{posts[index - 1].title}</strong></Link> : <span />}</nav>}<Comments key={post.slug} slug={post.slug} enabled={post.comments} />{related.length > 0 && <section className="related-section"><div className="section-heading"><h2>也许，你还想读</h2><ArrowUpRight size={17} /></div>{related.map(item => <PostCard post={item} key={item.slug} />)}</section>}</div>{hasHeadings && <aside className="article-toc"><div className="toc-sticky"><h2><List size={15} />在这篇文字里</h2>{toc}<div className="toc-footer"><span>{Math.round(progress)}% 已读</span><button className="text-button" type="button" onClick={() => window.scrollTo({ top: 0, behavior: prefs.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><ArrowUp size={13} />回到开头</button></div><p>慢慢读，这里不赶时间。</p></div></aside>}</div></div></div>;
}
