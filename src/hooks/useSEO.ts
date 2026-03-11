import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string;
}

/**
 * Lightweight per-page SEO hook.
 * Sets document title + meta description/keywords/canonical on mount,
 * restores homepage defaults on unmount.
 */
export function useSEO({ title, description, canonical, keywords }: SEOProps) {
  useEffect(() => {
    const prev = {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
      keywords: document.querySelector('meta[name="keywords"]')?.getAttribute("content") ?? "",
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
    };

    document.title = title;

    const setMeta = (selector: string, attr: string, value: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', "content", description);
    if (keywords) setMeta('meta[name="keywords"]', "content", keywords);
    if (canonical) setMeta('link[rel="canonical"]', "href", canonical);

    return () => {
      document.title = prev.title;
      setMeta('meta[name="description"]', "content", prev.description);
      if (keywords) setMeta('meta[name="keywords"]', "content", prev.keywords);
      if (canonical) setMeta('link[rel="canonical"]', "href", prev.canonical);
    };
  }, [title, description, canonical, keywords]);
}
