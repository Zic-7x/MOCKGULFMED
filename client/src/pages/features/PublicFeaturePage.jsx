import { Link, Navigate, useParams } from 'react-router-dom';
import IndexMarketingLayout from '../../components/IndexMarketingLayout';
import { FEATURE_PAGE_LIST, getFeaturePage } from '../../data/featurePages';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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

  const docTitle = `${page.navLabel} · Product Features · MockGulfMed`;

  return (
    <IndexMarketingLayout documentTitle={docTitle}>
      <div className="index-feature-wrap">
        {/* Breadcrumb */}
        <nav className="index-feature-breadcrumb index-reveal" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="index-feature-breadcrumb-sep" aria-hidden="true">/</span>
          <Link to="/features">Features</Link>
          <span className="index-feature-breadcrumb-sep" aria-hidden="true">/</span>
          <span className="index-feature-breadcrumb-current">{page.navLabel}</span>
        </nav>

        {/* Feature Detail Hero */}
        <header className="index-feature-detail-hero index-reveal">
          <div className="index-feature-detail-badges">
            <span className="index-feature-tag">{page.kicker}</span>
            {page.tag && (
              <span className="index-feature-tag" style={{ background: 'var(--idx-gold-soft)', color: 'var(--idx-gold)', borderColor: 'rgba(180, 83, 9, 0.25)' }}>
                ★ {page.tag}
              </span>
            )}
            {page.stat && (
              <span className="index-feature-tag" style={{ background: 'var(--idx-glass-bg)', color: 'var(--idx-text)' }}>
                ⚡ {page.stat}
              </span>
            )}
          </div>

          <h1>{page.title}</h1>
          <p className="index-feature-detail-lede">{page.lede}</p>

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

        {/* How It Works 3-Step Sequence */}
        {page.howItWorks && page.howItWorks.length > 0 && (
          <section className="index-feature-how-section index-reveal" aria-labelledby="how-it-works-title">
            <div className="index-feature-how-head">
              <h2 id="how-it-works-title">How it works</h2>
              <p>Three straightforward steps to accelerate your licensing progress.</p>
            </div>
            <div className="index-feature-steps-grid">
              {page.howItWorks.map((stepItem) => (
                <div key={stepItem.step} className="index-feature-step-card">
                  <div className="index-feature-step-card-num">{stepItem.step}</div>
                  <h3>{stepItem.title}</h3>
                  <p>{stepItem.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Deep Dive 2-Column Section */}
        <div className="index-feature-detail-grid">
          {/* Left Column: Key Capabilities */}
          <section className="index-feature-card-panel index-reveal" aria-labelledby="feature-highlights">
            <h2 id="feature-highlights" className="index-feature-panel-title">
              Key Capabilities & Highlights
            </h2>
            <p className="index-feature-panel-desc">
              Engineered specifically for international healthcare professionals targeting GCC licensing.
            </p>
            <ul className="index-feature-highlights-list">
              {(page.highlights || []).map((line, idx) => (
                <li key={idx}>
                  <div className="index-feature-hl-icon">
                    <CheckIcon />
                  </div>
                  <div className="index-feature-hl-text">{line}</div>
                </li>
              ))}
            </ul>
          </section>

          {/* Right Column: Key Benefits & Authorities */}
          <aside className="index-reveal">
            {page.keyBenefits && page.keyBenefits.length > 0 && (
              <div className="index-feature-sidebar-block">
                <h3>Candidate Advantages</h3>
                <ul className="index-feature-benefits-list">
                  {page.keyBenefits.map((benefit, i) => (
                    <li key={i}>
                      <StarIcon />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {page.authorities && page.authorities.length > 0 && (
              <div className="index-feature-sidebar-block">
                <h3>Applicable Health Authorities</h3>
                <div className="index-feature-auth-pills" style={{ justifyContent: 'flex-start' }}>
                  {page.authorities.map((auth, i) => (
                    <span key={i} className="index-feature-auth-pill">
                      {auth}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Access Card */}
            <div className="index-feature-sidebar-block" style={{ background: 'var(--idx-bg-alt)' }}>
              <h3>Explore Full Platform Access</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--idx-muted)', margin: 0 }}>
                Unlock all question banks, simulated timed exams, and healthcare job tools in your candidate portal.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                <Link className="index-btn index-btn--primary" to="/register" style={{ textAlign: 'center' }}>
                  Create Account
                </Link>
                <Link className="index-btn index-btn--ghost" to="/packages" style={{ textAlign: 'center' }}>
                  View All Packages
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* Pro Tip Callout */}
        {page.proTip && (
          <div className="index-feature-protip index-reveal">
            <div className="index-feature-protip-icon">💡</div>
            <div>
              <h4>Candidate Expert Tip</h4>
              <p>{page.proTip}</p>
            </div>
          </div>
        )}

        {/* Related Features */}
        {related.length > 0 && (
          <section className="index-feature-related-wrap index-reveal" aria-labelledby="related-features-heading">
            <div className="index-feature-related-head">
              <h2 id="related-features-heading">Related platform features</h2>
              <p>Explore complementary tools to round out your preparation and licensing.</p>
            </div>
            <div className="index-feature-related-grid">
              {related.map((r) => (
                <Link key={r.slug} className="index-feature-related-card" to={`/features/${r.slug}`}>
                  <span className="index-feature-related-kicker">{r.kicker}</span>
                  <h3 className="index-feature-related-title">{r.navLabel}</h3>
                  <p className="index-feature-related-desc">{r.lede}</p>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--idx-accent)', marginTop: 'auto' }}>
                    View feature &rarr;
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Full Feature Index Jump */}
        <section className="index-section index-section--alt index-reveal" style={{ marginTop: 48 }}>
          <div className="index-section-head">
            <h2>Explore all MockGulfMed features</h2>
            <p>Direct navigation to every core pillar of our healthcare platform.</p>
          </div>
          <div className="index-feature-all-grid">
            {FEATURE_PAGE_LIST.map((p) => (
              <Link key={p.slug} className="index-feature-all-item" to={`/features/${p.slug}`}>
                <span className="index-feature-all-item-kicker">{p.kicker}</span>
                <span className="index-feature-all-item-title">{p.navLabel}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </IndexMarketingLayout>
  );
}
