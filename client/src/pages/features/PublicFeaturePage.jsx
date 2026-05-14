import { Link, Navigate, useParams } from 'react-router-dom';
import IndexMarketingLayout from '../../components/IndexMarketingLayout';
import { FEATURE_PAGE_LIST, getFeaturePage } from '../../data/featurePages';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function PublicFeaturePage() {
  const { slug } = useParams();
  const page = getFeaturePage(slug);

  if (!page) {
    return <Navigate to="/features" replace />;
  }

  const related = (page.relatedSlugs || [])
    .map((s) => getFeaturePage(s))
    .filter(Boolean);

  const docTitle = page.title;

  return (
    <IndexMarketingLayout documentTitle={docTitle}>
      <div className="index-feature-wrap">
        <nav className="index-reveal" aria-label="Breadcrumb" style={{ marginBottom: 8 }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--idx-muted)' }}>
            <Link to="/" style={{ color: 'var(--idx-accent)', fontWeight: 700, textDecoration: 'none' }}>
              Home
            </Link>
            <span aria-hidden="true"> · </span>
            <Link to="/features" style={{ color: 'var(--idx-accent)', fontWeight: 700, textDecoration: 'none' }}>
              Features
            </Link>
            <span aria-hidden="true"> · </span>
            <span style={{ color: 'var(--idx-text)' }}>{page.navLabel}</span>
          </p>
        </nav>

        <header className="index-feature-hero index-reveal">
          <div className="index-feature-hero-pill">{page.kicker}</div>
          <h1>{page.title}</h1>
          <p className="index-feature-hero-lede">{page.lede}</p>
          <div className="index-feature-cta-row">
            {(page.ctas || []).map((c) => (
              <Link
                key={c.to + c.label}
                className={
                  c.variant === 'primary' ? 'index-btn index-btn--primary' : 'index-btn index-btn--ghost'
                }
                to={c.to}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </header>

        <div className="index-feature-grid-2">
          <section className="index-reveal" aria-labelledby="feature-highlights">
            <div className="index-section-head" style={{ textAlign: 'left', marginBottom: 12 }}>
              <h2 id="feature-highlights" style={{ fontSize: '1.2rem' }}>
                What you get
              </h2>
              <p style={{ marginBottom: 0 }}>High-signal bullets—aligned with how teams use MockGulfMed today.</p>
            </div>
            <ul className="index-feature-list">
              {(page.highlights || []).map((line) => (
                <li key={line}>
                  <span className="index-feature-list-icon">
                    <CheckIcon />
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>

          <aside className="index-reveal">
            <div className="index-bottom-cta-inner index-glass" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', marginTop: 0 }}>Explore the full platform</h2>
                <p style={{ marginBottom: 0 }}>
                  These pages describe product pillars. Your account unlocks the live workflows inside the portal.
                </p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                <Link className="index-btn index-btn--primary" to="/register">
                  Create account
                </Link>
                <Link className="index-btn index-btn--ghost" to="/features">
                  All features
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="index-feature-related index-reveal" aria-labelledby="related-features">
            <h2 id="related-features">Related features</h2>
            <div className="index-feature-related-grid">
              {related.map((r) => (
                <Link key={r.slug} className="index-feature-related-card" to={`/features/${r.slug}`}>
                  <div className="index-feature-related-kicker">{r.kicker}</div>
                  <p className="index-feature-related-title">{r.navLabel}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="index-section index-section--alt index-reveal" style={{ marginTop: 32 }}>
          <div className="index-section-head">
            <h2>Full feature index</h2>
            <p>Jump to any pillar from the hub.</p>
          </div>
          <div className="index-service-grid">
            {FEATURE_PAGE_LIST.map((p) => (
              <article key={p.slug} className="index-service-card index-glass">
                <h3>
                  <Link to={`/features/${p.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {p.navLabel}
                  </Link>
                </h3>
                <p>{p.title}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </IndexMarketingLayout>
  );
}
