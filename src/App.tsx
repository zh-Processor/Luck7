import { useEffect, useRef } from 'react';
import { Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { Header, Footer } from './components/Header';
import { PreferencesProvider } from './context/Preferences';
import { Home } from './pages/Home';
import { Posts } from './pages/Posts';
import { Article } from './pages/Article';
import { About, Friends, Notes, NotFound } from './pages/Other';
import { getPageMeta } from './lib/meta';
import { site } from './config/site';
import { isDraftPreview } from './lib/content';

function NavigationEffects() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map<string, number>());
  const previousPath = useRef(location.pathname);
  useEffect(() => {
    const key = location.pathname + location.search;
    const changed = previousPath.current !== location.pathname;
    if (changed) {
      const top = navigationType === 'POP' ? positions.current.get(key) || 0 : 0;
      window.scrollTo({ top, behavior: 'instant' });
      previousPath.current = location.pathname;
    }
    if (location.hash) {
      try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView(); } catch { /* Invalid fragment, keep the current position. */ }
    }
    const remember = () => positions.current.set(key, window.scrollY);
    window.addEventListener('scroll', remember, { passive: true });
    return () => window.removeEventListener('scroll', remember);
  }, [location.pathname, location.search, location.hash, navigationType]);
  useEffect(() => {
    const meta = getPageMeta(location.pathname);
    document.title = meta.title;
    const setMeta = (selector: string, attribute: string, key: string, value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, key); document.head.appendChild(element); }
      element.content = value;
    };
    setMeta('meta[name="description"]', 'name', 'description', meta.description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', meta.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', meta.description);
    setMeta('meta[property="og:type"]', 'property', 'og:type', meta.post ? 'article' : 'website');
    document.head.querySelector('meta[name="robots"]')?.remove();
    if (!meta.known || meta.post?.draft || isDraftPreview) setMeta('meta[name="robots"]', 'name', 'robots', 'noindex');
    if (meta.url) {
      let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
      canonical.href = meta.url;
      setMeta('meta[property="og:url"]', 'property', 'og:url', meta.url);
    } else {
      document.head.querySelector('link[rel="canonical"]')?.remove();
      document.head.querySelector('meta[property="og:url"]')?.remove();
    }
    document.head.querySelector('script[data-post-schema]')?.remove();
    document.head.querySelector('meta[property="article:published_time"]')?.remove();
    if (meta.post) {
      setMeta('meta[property="article:published_time"]', 'property', 'article:published_time', `${meta.post.date}T00:00:00+08:00`);
      const schema = document.createElement('script');
      schema.type = 'application/ld+json'; schema.dataset.postSchema = '';
      schema.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: meta.post.title, description: meta.description, datePublished: `${meta.post.date}T00:00:00+08:00`, dateModified: `${meta.post.updated || meta.post.date}T00:00:00+08:00`, author: { '@type': 'Person', name: site.author.name }, ...(meta.url ? { url: meta.url, mainEntityOfPage: meta.url } : {}) });
      document.head.appendChild(schema);
    }
  }, [location.pathname]);
  return null;
}

export function App() {
  return <PreferencesProvider><div className="site-shell"><a className="skip-link" href="#main-content">跳到正文</a><NavigationEffects />{isDraftPreview && <div className="draft-preview-notice" role="status">草稿预览模式 · 仅本地可见，正式构建自动排除草稿。</div>}<Header /><main id="main-content"><Routes><Route path="/" element={<Home />} /><Route path="/posts/" element={<Posts />} /><Route path="/posts/:slug/" element={<Article />} /><Route path="/notes/" element={<Notes />} /><Route path="/friends/" element={<Friends />} /><Route path="/about/" element={<About />} /><Route path="*" element={<NotFound />} /></Routes></main><Footer /></div></PreferencesProvider>;
}
