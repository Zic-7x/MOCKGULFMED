import { Link } from 'react-router-dom';
import IndexMarketingLayout from '../../components/IndexMarketingLayout';
import { FEATURE_PAGE_LIST } from '../../data/featurePages';

export default function FeaturesHub() {
  return (
    <IndexMarketingLayout documentTitle="Product features">
      <div className="index-feature-wrap index-reveal">
        <div className="index-feature-hub-intro">
          <h1>Product features</h1>
          <p>
            Every public feature page uses the same trust-centric layout as our home page—explore mocks,
            official exam booking, eligibility, verification, licensing support, jobs, reels, and plans in one place.
          </p>
        </div>

        <div className="index-feature-hub-grid">
          {FEATURE_PAGE_LIST.map((p) => (
            <Link key={p.slug} className="index-feature-hub-card index-reveal" to={`/features/${p.slug}`}>
              <span className="index-feature-hub-card-kicker">{p.kicker}</span>
              <h2 className="index-feature-hub-card-title">{p.navLabel}</h2>
              <span className="index-feature-hub-card-arrow" aria-hidden="true">
                View
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
        </div>

        <section className="index-section index-section--alt index-reveal" style={{ marginTop: 48 }}>
          <div className="index-section-head">
            <h2>Quick entry points</h2>
            <p>Tools you can open today alongside the feature guides above.</p>
          </div>
          <div className="index-mini-grid">
            <article className="index-mini-card index-glass">
              <h3>Public eligibility check</h3>
              <p>Answer a short wizard and see a summary without creating an account.</p>
              <p style={{ marginTop: 12, marginBottom: 0 }}>
                <Link className="index-btn index-btn--secondary" to="/eligibility-check">
                  Open checker
                </Link>
              </p>
            </article>
            <article className="index-mini-card index-glass">
              <h3>Packages</h3>
              <p>Compare access windows and feature lines for mocks and job tools.</p>
              <p style={{ marginTop: 12, marginBottom: 0 }}>
                <Link className="index-btn index-btn--secondary" to="/packages">
                  Browse packages
                </Link>
              </p>
            </article>
            <article className="index-mini-card index-glass">
              <h3>Sign in</h3>
              <p>Return to your dashboard, exams, applications, and profile.</p>
              <p style={{ marginTop: 12, marginBottom: 0 }}>
                <Link className="index-btn index-btn--primary" to="/login">
                  Go to login
                </Link>
              </p>
            </article>
          </div>
        </section>
      </div>
    </IndexMarketingLayout>
  );
}
