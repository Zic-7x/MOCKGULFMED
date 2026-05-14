import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logoUrl from '../image/Gemini_Generated_Image_wtgqj3wtgqj3wtgq-removebg-preview.png';
import '../pages/Index.css';
import '../pages/FeaturePages.css';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/**
 * Shared shell for public marketing pages: matches Index theme, nav, and footer.
 */
export default function IndexMarketingLayout({ children, documentTitle }) {
  const reducedMotion = usePrefersReducedMotion();
  const [navSolid, setNavSolid] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('mockgulfmed-index-theme');
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {
      /* ignore */
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('mockgulfmed-index-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    if (!documentTitle) return;
    const base = 'MockGulfMed';
    document.title = documentTitle.includes(base) ? documentTitle : `${documentTitle} · ${base}`;
    return () => {
      document.title = base;
    };
  }, [documentTitle]);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const nodes = document.querySelectorAll('.index-reveal');
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('index-reveal--visible');
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -5% 0px' }
    );
    nodes.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, [children, reducedMotion]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const pageClass = `index-page index-page--${theme}`;

  return (
    <div className={pageClass}>
      <a className="index-skip" href="#main-content">
        Skip to content
      </a>

      <header className={`index-nav ${navSolid ? 'index-nav--solid' : ''}`} role="banner">
        <div className="index-nav-inner">
          <Link className="index-nav-brand" to="/">
            <img className="index-nav-logo" src={logoUrl} alt="" />
            <span className="index-nav-title">MockGulfMed</span>
          </Link>

          <nav className="index-nav-actions" aria-label="Primary">
            <button
              type="button"
              className="index-icon-btn"
              onClick={toggleTheme}
              aria-pressed={theme === 'dark'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <span className="index-icon-btn-icon" aria-hidden="true">
                  ☀️
                </span>
              ) : (
                <span className="index-icon-btn-icon" aria-hidden="true">
                  🌙
                </span>
              )}
            </button>
            <Link className="index-btn index-btn--ghost" to="/features">
              Features
            </Link>
            <Link className="index-btn index-btn--ghost" to="/packages">
              Packages
            </Link>
            <Link className="index-btn index-btn--primary" to="/login">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" className="index-main">
        {children}
      </main>

      <footer className="index-footer">
        <div className="index-footer-inner">
          <Link to="/">Home</Link>
          <span className="index-footer-sep" aria-hidden="true">
            •
          </span>
          <Link to="/features">Features</Link>
          <span className="index-footer-sep" aria-hidden="true">
            •
          </span>
          <span>MockGulfMed</span>
          <span className="index-footer-sep" aria-hidden="true">
            •
          </span>
          <Link to="/policies">Policies</Link>
          <span className="index-footer-sep" aria-hidden="true">
            •
          </span>
          <Link to="/policies/terms">Terms</Link>
          <span className="index-footer-sep" aria-hidden="true">
            •
          </span>
          <Link to="/policies/refund">Refund policy</Link>
        </div>
      </footer>
    </div>
  );
}
