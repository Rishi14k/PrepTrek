import { useEffect } from 'react';

/**
 * Custom hook to update page title, meta description, canonical URL, OpenGraph,
 * and search crawler robot directives dynamically in the Single Page Application.
 */
export const usePageSEO = ({
  title,
  description,
  canonicalPath = '',
  noindex = false,
} = {}) => {
  useEffect(() => {
    // 1. Update Document Title
    const defaultTitle = 'PrepTrack | Entrance Exam Performance Analytics Platform';
    document.title = title ? `${title}` : defaultTitle;

    // Helper to safely set or update a meta tag
    const setMetaTag = (selector, attributeName, attributeValue, content) => {
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attributeName, attributeValue);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // 2. Meta Description
    const defaultDescription =
      'PrepTrack helps entrance examination aspirants record mock test results, analyze strengths and weaknesses, track study time, and receive actionable study recommendations.';
    setMetaTag('meta[name="description"]', 'name', 'description', description || defaultDescription);

    // 3. OpenGraph tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', title || defaultTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description || defaultDescription);

    // 4. Twitter tags
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title || defaultTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description || defaultDescription);

    // 5. Canonical Link
    const baseUrl = 'https://preptrack.app';
    const targetUrl = canonicalPath ? `${baseUrl}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath}` : baseUrl;
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', targetUrl);

    // 6. Robots directive (noindex for private/auth-required or 404 pages)
    const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
    setMetaTag('meta[name="robots"]', 'name', 'robots', robotsContent);
  }, [title, description, canonicalPath, noindex]);
};

export default usePageSEO;
