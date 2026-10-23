import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';
import { basePath } from '../config/site';
import { remarkHeadingIds } from '../lib/content';
import { copyText } from '../lib/storage';
import { Dialog } from './Dialog';

/** Local assets are site-relative, including on GitHub project Pages. */
export function markdownUrl(url: string, base = basePath): string {
  if (!url || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\?)/i.test(url)) return url;
  const prefix = `${base.replace(/\/$/, '')}/`;
  if (prefix !== '/' && (url === prefix.slice(0, -1) || url.startsWith(prefix))) return url;
  return `${prefix}${url.replace(/^\/+/, '')}`;
}
function plainText(children: ReactNode): string {
  return Children.toArray(children).map(child => typeof child === 'string' || typeof child === 'number' ? String(child) : isValidElement<{ children?: ReactNode }>(child) ? plainText(child.props.children) : '').join('');
}
function CodeBlock({ children }: { children?: ReactNode }) {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { clearTimeout(timer.current); }, []);
  const child = Children.toArray(children)[0];
  const language = isValidElement<{ className?: string }>(child) ? child.props.className?.replace('language-', '') || 'text' : 'text';
  async function copy() {
    try { await copyText(plainText(children)); setMessage('已复制'); }
    catch { setMessage('复制失败，请手动选择'); }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(''), 2500);
  }
  return <div className="code-block"><div className="code-toolbar"><span>{language}</span><button type="button" onClick={copy}>{message === '已复制' ? <Check size={13} /> : <Copy size={13} />}<span aria-live="polite">{message || '复制代码'}</span></button></div><pre tabIndex={0} aria-label={`${language} 代码`}>{children}</pre></div>;
}

export function MarkdownBody({ body }: { body: string }) {
  const [image, setImage] = useState<{ src: string; alt: string }>();
  useEffect(() => { setImage(undefined); }, [body]);
  return <><ReactMarkdown skipHtml remarkPlugins={[remarkGfm, remarkHeadingIds]} components={{
    pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
    table: ({ children }) => <div className="table-scroll" tabIndex={0} role="region" aria-label="文章表格，可横向滚动"><table>{children}</table></div>,
    a: ({ href, children, title }) => {
      if (!href) return <span>{children}</span>;
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\?)/i.test(href)) {
        const external = /^(?:https?:)?\/\//i.test(href);
        return <a href={href} title={title} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>{children}</a>;
      }
      const path = markdownUrl(href);
      const route = basePath === '/' ? path : path.slice(basePath.replace(/\/$/, '').length) || '/';
      // Internal pages use client navigation; downloadable files retain native
      // anchors and Markdown's default URL sanitization.
      if (!/\.[a-z0-9]+(?:[?#]|$)/i.test(path)) return <Link to={route} title={title}>{children}</Link>;
      return <a href={path} title={title}>{children}</a>;
    },
    img: ({ src, alt, title }) => {
      const path = typeof src === 'string' ? markdownUrl(src) : '';
      if (!path) return <span className="image-caption">{alt || '图片暂不可用'}</span>;
      return <span className="article-image"><button type="button" onClick={() => setImage({ src: path, alt: alt || '' })} aria-label={`放大图片：${alt || '文章配图'}`}><img src={path} alt={alt || ''} title={title} loading="lazy" decoding="async" /></button>{alt && <span className="image-caption">{alt}</span>}</span>;
    },
  }}>{body}</ReactMarkdown>{image && <Dialog open onClose={() => setImage(undefined)} title={image.alt || '文章配图'} className="image-dialog"><img src={image.src} alt={image.alt} /></Dialog>}</>;
}
