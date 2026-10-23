import { Fragment, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Coffee, Pin, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
import { asset, site } from '../config/site';
import { categories, featured, formatDate, notes, posts } from '../lib/content';
import { Cover, StudyScene } from '../components/Scene';
import { PostCard } from '../components/PostCard';

export function Home() {
  const [category, setCategory] = useState('全部');
  const showFeatured = Boolean(featured && posts.length > 1);
  const recent = posts.filter(post => (!showFeatured || category !== '全部' || post.slug !== featured?.slug) && (category === '全部' || post.category === category)).slice(0, 4);
  const latestNote = notes[0];
  return <>
    <section className="hero container">
      <div className="hero-copy">
        <div className="eyebrow"><span />{site.home.eyebrow}</div>
        <h1>{site.home.title}<br /><em>{site.home.emphasis}</em></h1>
        <p className="hero-description">{site.home.description.map((line, index) => <Fragment key={index}>{index > 0 && <br />}{line}</Fragment>)}</p>
        <div className="hero-actions"><Link className="button button-primary" to="/posts/">开始阅读<ArrowUpRight size={17} /></Link><Link className="button button-text" to="/about/">关于这里<ArrowRight size={15} /></Link></div>
        <p className="hero-quiet-note"><Coffee size={14} />{site.home.quietNote}</p>
      </div>
      <StudyScene />
    </section>
    {showFeatured && featured && <section className="container">
      <Link className="featured-post" to={`/posts/${featured.slug}/`}>
        <div><span className="eyebrow"><Pin size={13} />写在前面</span><h2>{featured.title}<ArrowUpRight size={22} /></h2><p>{featured.description}</p><div className="post-meta"><span>{featured.category}</span><span>{featured.minutes} 分钟阅读</span><span className="feature-read">阅读全文<ArrowRight size={13} /></span></div></div>
        <Cover kind={featured.cover} className="featured-cover" />
      </Link>
    </section>}
    <div className="home-content container">
      <section className="recent-posts" aria-labelledby="recent-title">
        <div className="section-heading"><h2 id="recent-title">最近写下的<span className="heading-dot">.</span></h2><span>让每个普通日子，都有迹可循</span></div>
        {posts.length > 0 && <div className="category-tabs" aria-label="首页文章分类">{categories.map(item => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>}
        <div className="recent-list">{recent.length ? recent.map(post => <PostCard key={post.slug} post={post} />) : <div className="quiet-empty"><BookOpen size={25} /><p>{posts.length ? '这个分类正在酝酿新的文字。' : '第一篇文字，正在酝酿。'}</p></div>}</div>
        {posts.length > 0 && <Link className="all-posts-link" to="/posts/">去文章里逛逛<ArrowRight size={16} /></Link>}
      </section>
      <aside className="home-sidebar">
        <section className="author-card">
          <div className="author-avatar">{site.author.avatar ? <img src={asset(site.author.avatar)} alt="" width="64" height="64" /> : <Coffee size={27} strokeWidth={1.4} />}</div>
          <span className="tiny-eyebrow">NICE TO MEET YOU</span><h3>{site.author.name}</h3><p>{site.author.bio}</p><div className="author-divider" /><Link to="/about/">认识这个小角落<ArrowUpRight size={13} /></Link>
        </section>
        {latestNote && <section className="little-moment"><h3><Sprout size={16} />心安时刻</h3><blockquote>{latestNote.text}</blockquote><Link to="/notes/">{formatDate(latestNote.date)}<ArrowUpRight size={12} /></Link></section>}
      </aside>
    </div>
    <section className="closing-note container"><span>✧</span><p>这里没有什么大事，<br />只有认真生活留下的小小回声。</p><Link to={latestNote ? '/notes/' : '/about/'} aria-label={latestNote ? '去看碎碎念' : '关于这个博客'}><ArrowDown size={17} /></Link></section>
  </>;
}
