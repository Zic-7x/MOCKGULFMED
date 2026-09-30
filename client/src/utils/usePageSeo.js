import { useEffect } from 'react';

/**
 * Custom hook to dynamically manage document title, meta tags, OpenGraph, canonical URLs,
 * and structured data for optimal search engine display and sitelinks.
 */
export function usePageSeo({
  title,
  description,
  canonical,
  noindex = false,
  structuredData,
  ogType = 'website',
  ogImage = 'https://www.clicktogulf.com/logo.png',
} = {}) {
  useEffect(() => {
    // 1. Title
    const originalTitle = document.title;
    if (title) {
      document.title = title;
    }

    // 2. Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    const prevDesc = metaDesc.content;
    if (description) {
      metaDesc.content = description;
    }

    // 3. Meta robots
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      document.head.appendChild(metaRobots);
    }
    const prevRobots = metaRobots.content;
    metaRobots.content = noindex
      ? 'noindex, nofollow, noarchive'
      : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

    // 4. Canonical URL
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.rel = 'canonical';
      document.head.appendChild(linkCanonical);
    }
    const prevCanonical = linkCanonical.href;
    const targetCanonical =
      canonical ||
      (typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : 'https://www.clicktogulf.com/');
    linkCanonical.href = targetCanonical;

    // Helper for property / name meta tags
    const setMeta = (attribute, attrValue, content) => {
      let el = document.querySelector(`meta[${attribute}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attribute, attrValue);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    // 5. OpenGraph & Twitter
    if (title) {
      setMeta('property', 'og:title', title);
      setMeta('name', 'twitter:title', title);
    }
    if (description) {
      setMeta('property', 'og:description', description);
      setMeta('name', 'twitter:description', description);
    }
    setMeta('property', 'og:url', targetCanonical);
    if (ogType) setMeta('property', 'og:type', ogType);
    if (ogImage) {
      setMeta('property', 'og:image', ogImage);
      setMeta('name', 'twitter:image', ogImage);
    }

    // 6. Optional Structured Data script
    let scriptTag = null;
    if (structuredData) {
      scriptTag = document.createElement('script');
      scriptTag.type = 'application/ld+json';
      scriptTag.text = JSON.stringify(structuredData);
      document.head.appendChild(scriptTag);
    }

    return () => {
      if (originalTitle) document.title = originalTitle;
      if (metaDesc) metaDesc.content = prevDesc;
      if (metaRobots) metaRobots.content = prevRobots;
      if (linkCanonical) linkCanonical.href = prevCanonical;
      if (scriptTag) scriptTag.remove();
    };
  }, [title, description, canonical, noindex, structuredData, ogType, ogImage]);
}

export default usePageSeo;
