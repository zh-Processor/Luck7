import { useEffect, useId, useRef, useState } from 'react';
import { MessageCircle, ArrowUpRight, AlertCircle, LoaderCircle, RotateCw } from 'lucide-react';
import { site } from '../config/site';
import { usePreferences } from '../context/Preferences';
import { nextGiscusStatus, type GiscusStatus } from '../lib/giscus';

export function Comments({ slug, enabled }: { slug: string; enabled: boolean }) {
  const { resolvedTheme } = usePreferences();
  const [requested, setRequested] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const label = useId();
  const container = useRef<HTMLDivElement>(null);
  const theme = useRef(resolvedTheme);
  theme.current = resolvedTheme;
  const config = site.comments;
  const configured = Boolean(/^[\w.-]+\/[\w.-]+$/.test(config.repo) && config.repoId && config.categoryId);
  const visible = config.enabled && enabled;
  useEffect(() => {
    if (!visible || !configured || !requested || !container.current) return;
    const target = container.current;
    setStatus('loading');
    let active = true;
    let connectionStatus: GiscusStatus = 'loading';
    let frame: HTMLIFrameElement | null = null;
    const fail = () => {
      if (!active) return;
      connectionStatus = 'error';
      clearTimeout(timeout);
      setStatus('error');
    };
    const ready = () => {
      if (!active || connectionStatus === 'error') return;
      connectionStatus = 'ready';
      clearTimeout(timeout);
      setStatus('ready');
    };
    const syncTheme = () => {
      if (!active) return;
      frame?.contentWindow?.postMessage({ giscus: { setConfig: { theme: theme.current } } }, 'https://giscus.app');
    };
    const timeout = setTimeout(fail, 20000);
    const observer = new MutationObserver(() => {
      const next = target.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
      if (!next || next === frame) return;
      frame?.removeEventListener('load', syncTheme);
      frame = next;
      // iframe load also fires on network failures; wait for a valid message.
      frame.addEventListener('load', syncTheme);
      frame.setAttribute('title', '文章评论 · GitHub Discussions');
    });
    observer.observe(target, { childList: true, subtree: true });
    const receive = (event: MessageEvent) => {
      if (event.origin !== 'https://giscus.app' || !frame || event.source !== frame.contentWindow) return;
      const next = nextGiscusStatus(connectionStatus, event.data);
      if (next === connectionStatus) return;
      if (next === 'error') fail();
      else if (next === 'ready') ready();
    };
    window.addEventListener('message', receive);
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true; script.crossOrigin = 'anonymous';
    const data = { repo: config.repo, 'repo-id': config.repoId, category: config.category, 'category-id': config.categoryId, mapping: 'specific', term: `post:${slug}`, strict: '1', 'reactions-enabled': config.reactions ? '1' : '0', 'emit-metadata': '0', 'input-position': 'top', theme: theme.current, lang: 'zh-CN', loading: 'eager' };
    Object.entries(data).forEach(([key, value]) => script.setAttribute(`data-${key}`, value));
    script.onerror = fail;
    target.appendChild(script);
    return () => {
      active = false;
      clearTimeout(timeout);
      observer.disconnect();
      window.removeEventListener('message', receive);
      frame?.removeEventListener('load', syncTheme);
      script.onerror = null;
      target.replaceChildren();
    };
    // Theme changes use giscus messages, without reloading the discussion.
  }, [requested, attempt, slug, visible, configured, config]);
  useEffect(() => {
    container.current?.querySelector('iframe')?.contentWindow?.postMessage({ giscus: { setConfig: { theme: resolvedTheme } } }, 'https://giscus.app');
  }, [resolvedTheme]);
  if (!visible || !configured) return null;
  return <section className="comments-section" aria-labelledby={label}><div className="section-heading"><h2 id={label}><MessageCircle size={20} />留下一点回声</h2><span>GitHub Discussions</span></div>
      {!requested && <div className="comment-welcome"><p>读完之后，有什么想说的？</p><span>点击后加载评论。通过 GitHub 登录，和我聊聊你的想法。</span><button type="button" className="button button-secondary" onClick={() => setRequested(true)}>打开评论<MessageCircle size={16} /></button></div>}
      {status === 'loading' && <p className="inline-notice comment-loading" role="status"><LoaderCircle className="spin" size={16} />正在打开评论区…</p>}
      {status === 'error' && <div className="comment-error" role="status"><p className="inline-notice"><AlertCircle size={16} />评论暂时无法加载，请稍后重试。</p><div className="comment-actions"><button type="button" className="button button-secondary" onClick={() => setAttempt(value => value + 1)}><RotateCw size={15} />重新加载</button><a href={`https://github.com/${config.repo}/discussions`} target="_blank" rel="noopener noreferrer">前往 Discussions<ArrowUpRight size={13} /></a></div></div>}
      <div ref={container} className="giscus" aria-busy={status === 'loading'} />
  </section>;
}
