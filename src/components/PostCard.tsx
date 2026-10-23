import { ArrowUpRight, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Cover } from './Scene';
import { type Post, formatDate } from '../lib/content';

export function PostCard({ post, layout = 'list' }: { post: Post; layout?: 'list' | 'grid' }) {
  return <article className={`post-card post-card-${layout}`}><div className="post-card-text"><Link to={`/posts/?category=${encodeURIComponent(post.category)}`} className="post-category">{post.category}</Link><h3><Link to={`/posts/${post.slug}/`}>{post.title}<ArrowUpRight size={18} /></Link></h3><p>{post.description}</p><div className="post-meta"><time dateTime={post.date}>{formatDate(post.date)}</time><span><Clock3 size={12} />{post.minutes} 分钟阅读</span>{post.draft && <span className="draft-label">草稿</span>}{post.sample && <span className="sample-label">示例</span>}</div></div><Link className="post-cover-link" to={`/posts/${post.slug}/`} aria-label={`阅读：${post.title}`} tabIndex={-1}><Cover kind={post.cover} /></Link></article>;
}
