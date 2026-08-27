import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import IndexMarketingLayout from '../../components/IndexMarketingLayout';
import { FEATURE_CATEGORIES, FEATURE_PAGE_LIST } from '../../data/featurePages';

function FeatureIcon({ type }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  
  switch (type) {
    case 'mockExams':
      return (
        <svg {...common}>
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
          <path d="M6 14h6" />
          <circle cx="17" cy="15" r="3" />
          <path d="m16 15 1 1 2-2" />
        </svg>
      );
    case 'booking':
      return (
        <svg {...common}>
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
          <path d="m9 16 2 2 4-4" />
        </svg>
      );
    case 'eligibility':
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'dataflow':
      return (
        <svg {...common}>
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M9 15h6" />
          <path d="M9 12h6" />
          <path d="M9 18h3" />
        </svg>
      );
    case 'licensing':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      );
    case 'jobs':
      return (
        <svg {...common}>
          <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    case 'reels':
      return (
        <svg {...common}>
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect width="14" height="14" x="1" y="5" rx="2" ry="2" />
        </svg>
      );
    case 'packages':
      return (
        <svg {...common}>
          <path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" x2="12" y1="22.08" y2="12" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 14 14" />
        </svg>
      );
  }
}

function CheckSmallIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const ROADMAP_STEPS = [
  {
    step: '1',
    title: 'Eligibility check',
    desc: 'Verify qualification readiness and document rules.',
    slug: 'eligibility-assessment',
  },
  {
    step: '2',
    title: 'Targeted mock exams',
    desc: 'Practice with timed question banks calibrated to real tests.',
    slug: 'mock-exams',
  },
  {
    step: '3',
    title: 'DataFlow & PSV',
    desc: 'Complete primary source verification with zero discrepancies.',
    slug: 'dataflow-psv',
  },
  {
    step: '4',
    title: 'Prometric booking',
    desc: 'Secure official computer-based licensing exam seats.',
    slug: 'exam-booking',
  },
  {
    step: '5',
    title: 'GCC job placement',
    desc: 'Showcase video reels and connect with hospital recruiters.',
    slug: 'job-portal',
  },
];

const FAQS = [
  {
    q: 'How close are the mock exams to the real Prometric / Pearson VUE tests?',
    a: 'Our mock question banks are strictly calibrated to official regulator blueprints (DHA, MOHAP, DOH, SCFHS, QCHP, OMSB) with the exact same time limits, question formats, and clinical domains.',
  },
  {
    q: 'Can I check my licensing eligibility before paying or creating an account?',
    a: 'Yes! We offer a dedicated public eligibility checker with zero registration required. You can evaluate your degree, experience years, and authority pathway in under 2 minutes.',
  },
  {
    q: 'What is DataFlow Primary Source Verification (PSV)?',
    a: 'DataFlow is the official verification body used across Gulf health authorities to verify your degrees, licenses, and employment certificates directly with issuing institutions.',
  },
  {
    q: 'How does the Job Portal & Applicant Reels feature work?',
    a: 'Candidates subscribed to eligible annual packages gain direct access to our verified healthcare job portal, where you can apply for GCC hospital positions and attach 60-90 second professional video introductions.',
  },
];

export default function FeaturesHub() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categoryCounts = useMemo(() => {
    const counts = { all: FEATURE_PAGE_LIST.length };
    FEATURE_PAGE_LIST.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, []);

  const filteredFeatures = useMemo(() => {
    return FEATURE_PAGE_LIST.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.navLabel.toLowerCase().includes(q) ||
        p.lede.toLowerCase().includes(q) ||
        p.kicker.toLowerCase().includes(q) ||
        (p.highlights && p.highlights.some((h) => h.toLowerCase().includes(q)));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <IndexMarketingLayout documentTitle="Platform Features & Capabilities · MockGulfMed">
      <div className="index-feature-wrap">
        {/* Hub Header & Hero */}
        <header className="index-feature-hub-header index-reveal">
          <div className="index-feature-hero-badge">
            <span>✨ Complete Healthcare Licensing Suite</span>
          </div>
          <h1>End-to-end platform for Gulf healthcare licensing</h1>
          <p>
            From your very first eligibility check to timed mock exams, primary source verification, official Prometric booking, and hospital career placement across the GCC.
          </p>

          {/* Quick Stats Ribbon */}
          <div className="index-feature-stats-ribbon">
            <div className="index-feature-stat-box">
              <div className="index-feature-stat-num">10,000+</div>
              <div className="index-feature-stat-lbl">Authority-Aligned MCQs</div>
            </div>
            <div className="index-feature-stat-box">
              <div className="index-feature-stat-num">7+</div>
              <div className="index-feature-stat-lbl">GCC Health Authorities</div>
            </div>
            <div className="index-feature-stat-box">
              <div className="index-feature-stat-num">98%</div>
              <div className="index-feature-stat-lbl">First-Attempt Pass Rate</div>
            </div>
            <div className="index-feature-stat-box">
              <div className="index-feature-stat-num">100%</div>
              <div className="index-feature-stat-lbl">PSV Compliance Guidance</div>
            </div>
          </div>
        </header>

        {/* Roadmap / Candidate Journey */}
        <section className="index-feature-journey-section index-reveal" aria-labelledby="journey-heading">
          <div className="index-feature-journey-head">
            <h2 id="journey-heading">Your complete pathway to practice</h2>
            <p>Follow the proven 5-step roadmap thousands of healthcare professionals use to get licensed and hired in the Gulf.</p>
          </div>
          <div className="index-feature-journey-grid">
            {ROADMAP_STEPS.map((s) => (
              <Link key={s.step} to={`/features/${s.slug}`} className="index-feature-journey-step">
                <div className="index-feature-step-num">{s.step}</div>
                <h3 className="index-feature-step-title">{s.title}</h3>
                <p className="index-feature-step-desc">{s.desc}</p>
                <span className="index-feature-step-link" aria-hidden="true">
                  Learn more &rarr;
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Search & Filter Controls */}
        <div className="index-feature-controls index-reveal">
          <div className="index-feature-filter-pills" role="tablist" aria-label="Feature categories">
            {FEATURE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat.id}
                className={`index-feature-filter-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>{cat.label}</span>
                <span className="index-feature-filter-count">{categoryCounts[cat.id] || 0}</span>
              </button>
            ))}
          </div>

          <div className="index-feature-search-wrap">
            <span className="index-feature-search-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" x2="16.65" y1="21" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className="index-feature-search-input"
              placeholder="Search features (e.g. Prometric, DataFlow, Reels)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search platform features"
            />
            {searchQuery && (
              <button
                type="button"
                className="index-feature-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filtered Features Grid */}
        {filteredFeatures.length > 0 ? (
          <div className="index-feature-hub-grid">
            {filteredFeatures.map((p) => (
              <Link key={p.slug} className="index-feature-hub-card index-reveal" to={`/features/${p.slug}`}>
                <div className="index-feature-card-top">
                  <div className="index-feature-icon-badge">
                    <FeatureIcon type={p.icon} />
                  </div>
                  {p.tag && <span className="index-feature-tag">{p.tag}</span>}
                </div>

                <div>
                  <div className="index-feature-hub-card-kicker">{p.kicker}</div>
                  <h2 className="index-feature-hub-card-title">{p.navLabel}</h2>
                </div>

                <p className="index-feature-hub-card-lede">{p.lede}</p>

                {p.highlights && p.highlights.length > 0 && (
                  <ul className="index-feature-card-highlights">
                    {p.highlights.slice(0, 2).map((hl, i) => (
                      <li key={i}>
                        <CheckSmallIcon />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="index-feature-card-footer">
                  <span className="index-feature-card-stat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    {p.stat}
                  </span>
                  <span className="index-feature-hub-card-arrow" aria-hidden="true">
                    Explore feature
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="index-feature-empty index-reveal">
            <h3>No matching features found</h3>
            <p>Try adjusting your search query or switching category filters.</p>
            <button
              type="button"
              className="index-btn index-btn--secondary"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Authority Support Matrix */}
        <section className="index-feature-authorities-box index-reveal">
          <h3>Supported GCC Health Regulatory Bodies</h3>
          <p>MockGulfMed tools and exam simulations are built according to official guidelines published by:</p>
          <div className="index-feature-auth-pills">
            <span className="index-feature-auth-pill">🇦🇪 DHA (Dubai Health Authority)</span>
            <span className="index-feature-auth-pill">🇦🇪 MOHAP (UAE Ministry of Health)</span>
            <span className="index-feature-auth-pill">🇦🇪 DOH (Department of Health Abu Dhabi)</span>
            <span className="index-feature-auth-pill">🇸🇦 SCFHS (Saudi Commission for Health Specialties)</span>
            <span className="index-feature-auth-pill">🇶🇦 QCHP / MOPH (Ministry of Public Health Qatar)</span>
            <span className="index-feature-auth-pill">🇴🇲 OMSB (Oman Medical Specialty Board)</span>
            <span className="index-feature-auth-pill">🇧🇭 NHRA (Bahrain National Health Authority)</span>
            <span className="index-feature-auth-pill">🇰🇼 MOH Kuwait</span>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="index-section index-section--alt index-reveal" style={{ marginTop: 48 }}>
          <div className="index-section-head">
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about preparing, booking, and practicing in the Gulf.</p>
          </div>
          <div className="index-feature-faq-grid">
            {FAQS.map((faq, i) => (
              <article key={i} className="index-feature-faq-card index-glass">
                <h3>{faq.q}</h3>
                <p>{faq.a}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Quick entry points CTA */}
        <section className="index-section index-reveal" style={{ marginTop: 48 }}>
          <div className="index-section-head">
            <h2>Ready to start your journey?</h2>
            <p>Pick a starting point below to launch your exam preparation or eligibility verification immediately.</p>
          </div>
          <div className="index-mini-grid">
            <article className="index-mini-card index-glass">
              <h3>Free eligibility check</h3>
              <p>Answer a quick wizard and see your GCC qualification breakdown instantly.</p>
              <p style={{ marginTop: 14, marginBottom: 0 }}>
                <Link className="index-btn index-btn--secondary" to="/eligibility-check">
                  Launch checker
                </Link>
              </p>
            </article>
            <article className="index-mini-card index-glass">
              <h3>Compare packages</h3>
              <p>Explore access durations from 1 month to 12 months with full job portal access.</p>
              <p style={{ marginTop: 14, marginBottom: 0 }}>
                <Link className="index-btn index-btn--secondary" to="/packages">
                  Browse pricing
                </Link>
              </p>
            </article>
            <article className="index-mini-card index-glass">
              <h3>Create account / Sign in</h3>
              <p>Unlock mock questions, track diagnostics, and take practice tests right now.</p>
              <p style={{ marginTop: 14, marginBottom: 0 }}>
                <Link className="index-btn index-btn--primary" to="/register">
                  Get started
                </Link>
              </p>
            </article>
          </div>
        </section>
      </div>
    </IndexMarketingLayout>
  );
}
