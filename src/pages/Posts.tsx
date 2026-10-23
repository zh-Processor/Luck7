import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Search, X } from 'lucide-react';
import { categories, filterPosts, posts, tags } from '../lib/content';
import { PostCard } from '../components/PostCard';

const pageSize = 10;
export function Posts() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const category = params.get('category') || '全部';
  const tag = params.get('tag') || '';
  const year = params.get('year') || '';
  const requestedPage = Math.max(1, Math.floor(Number(params.get('page')) || 1));
  const matches = useMemo(() => filterPosts(query, category, tag, year), [query, category, tag, year]);
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  const page = Math.min(requestedPage, pages);
  const previousPage = useRef(page);
  useEffect(() => {
    if (previousPage.current !== page) document.getElementById('archive-results')?.scrollIntoView({ behavior: 'instant', block: 'start' });
    previousPage.current = page;
  }, [page]);
  const years = [...new Set(posts.map(post => post.date.slice(0, 4)))];
  function update(key: string, value: string) {
    setParams(current => { const next = new URLSearchParams(current); if (value && value !== '全部') next.set(key, value); else next.delete(key); if (key !== 'page') next.delete('page'); return next; }, { replace: key === 'q' });
  }
  return <div className="page-container container"><header className="page-intro"><div className="eyebrow">THE ARCHIVE</div><h1>把日子写成文字<span>.</span></h1><p>技术、生活与随想，都在这里慢慢生长。</p></header><div className="archive-layout"><section id="archive-results"><div className="archive-search search-field"><Search size={18} /><input aria-label="搜索文章归档" type="search" maxLength={150} value={query} onChange={event => update('q', event.target.value)} placeholder="搜索标题、标签或正文…" /></div><div className="archive-controls"><div className="category-tabs" aria-label="文章分类">{categories.map(item => <button type="button" key={item} aria-pressed={category === item} onClick={() => update('category', item)}>{item}</button>)}</div><span className="results-count" aria-live="polite">{matches.length} 篇文字</span></div>{(tag || year) && <div className="active-filters">{tag && <button type="button" onClick={() => update('tag', '')}>#{tag}<X size={13} /></button>}{year && <button type="button" onClick={() => update('year', '')}>{year} 年<X size={13} /></button>}</div>}
      {matches.length ? matches.slice((page - 1) * pageSize, page * pageSize).map(post => <PostCard key={post.slug} post={post} />) : <div className="quiet-empty archive-empty"><BookOpen size={34} /><h2>这段文字，还在路上</h2><p>换个关键词，或去全部文章里看看。</p><button className="button button-secondary" type="button" onClick={() => setParams({})}>清除筛选</button></div>}
      {pages > 1 && <nav className="pagination" aria-label="文章分页"><button className="icon-button" type="button" onClick={() => update('page', String(page - 1))} disabled={page === 1} aria-label="上一页"><ArrowLeft size={17} /></button><span>第 {page} / {pages} 页</span><button className="icon-button" type="button" onClick={() => update('page', String(page + 1))} disabled={page === pages} aria-label="下一页"><ArrowRight size={17} /></button></nav>}
    </section><aside className="archive-sidebar"><section><h2><CalendarDays size={16} />按年份翻阅</h2><button className={`archive-year ${!year ? 'selected' : ''}`} type="button" onClick={() => update('year', '')}><span>全部时间</span><span>{posts.length}</span></button>{years.map(item => <button type="button" className={`archive-year ${year === item ? 'selected' : ''}`} key={item} onClick={() => update('year', item)}><span>{item} 年</span><span>{posts.filter(post => post.date.startsWith(item)).length}</span></button>)}</section><section><h2>散落的关键词</h2><div className="tag-cloud">{tags.map(item => <button type="button" key={item} aria-pressed={tag === item} onClick={() => update('tag', tag === item ? '' : item)}>#{item}</button>)}</div></section><p className="archive-aside-note">文字慢慢积累，<br />日子就有了自己的形状。</p></aside></div></div>;
}
