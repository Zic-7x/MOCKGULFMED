import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';
import logoUrl from '../../image/Gemini_Generated_Image_wtgqj3wtgqj3wtgq-removebg-preview.png';
import { fetchPublicCatalog } from '../../utils/publicApi';
import { packageFeaturesForDisplay } from '../../utils/packageFeaturesDisplay';
import { packageMeetsEligibilityMinimum } from '../../utils/supabaseQueries';
import { syncFreemiusEntitlement } from '../../utils/freemiusEntitlementSync';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import './Packages.css';

const FREEMIUS_PRODUCT_ID = import.meta.env.VITE_FREEMIUS_PRODUCT_ID || '27532';
const FREEMIUS_PUBLIC_KEY = import.meta.env.VITE_FREEMIUS_PUBLIC_KEY || '';
const FREEMIUS_IMAGE = import.meta.env.VITE_FREEMIUS_IMAGE || '';
const FREEMIUS_WEBHOOK_API_URL = import.meta.env.VITE_FREEMIUS_WEBHOOK_API_URL || '/api/freemius-webhook';

const FALLBACK_PLAN_BY_PACKAGE_NAME = {
  'Basic Monthly': '45534',
  'Acing the Exam (3 Months)': '45536',
  'Mastering the Exam Annual (12 Months)': '45537',
};

const DIRECT_CHECKOUT_BY_PACKAGE_NAME = {
  'Basic Monthly':
    import.meta.env.VITE_BASIC_MONTHLY_TRIAL_CHECKOUT_URL ||
    'https://checkout.freemius.com/product/27532/plan/45534/?trial=paid',
};

let freemiusScriptPromise;

function ensureFreemiusCheckoutScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Freemius checkout can only run in the browser.'));
  }
  if (window.FS?.Checkout) return Promise.resolve(window.FS);
  if (freemiusScriptPromise) return freemiusScriptPromise;

  freemiusScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-freemius-checkout="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.FS), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Freemius checkout script.')),
        { once: true }
      );
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.freemius.com/js/v1/';
    script.async = true;
    script.dataset.freemiusCheckout = 'true';
    script.onload = () => resolve(window.FS);
    script.onerror = () => reject(new Error('Failed to load Freemius checkout script.'));
    document.body.appendChild(script);
  });

  return freemiusScriptPromise;
}

function packageFeaturesList(pkg) {
  const raw = pkg.featuresNormalized?.length
    ? pkg.featuresNormalized
    : Array.isArray(pkg.features)
      ? pkg.features.map(String)
      : [];
  return packageFeaturesForDisplay(raw);
}

function packageRankValue(pkg) {
  if (pkg?.price_display) {
    const amount = Number(String(pkg.price_display).replace(/[^0-9.]/g, ''));
    if (Number.isFinite(amount) && amount > 0) return amount;
  }
  if (typeof pkg?.sort_order === 'number') return pkg.sort_order;
  return 0;
}

function parsePriceAmount(pkg) {
  if (!pkg?.price_display) return null;
  const amount = Number(String(pkg.price_display).replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

function packageCallout(pkg) {
  if (pkg?.name === 'Basic Monthly') return '3-day free trial. Card required.';
  return null;
}

function eligibilityPlanNote(pkg) {
  if (packageMeetsEligibilityMinimum(pkg)) {
    return 'Includes full eligibility assessment (document upload & review).';
  }
  return 'Eligibility assessment unlocks on 3-month and annual plans — upgrade anytime.';
}

function formatCurrencyAmount(amount, referencePriceDisplay) {
  if (amount == null || !Number.isFinite(amount)) return null;
  const rounded = Number(amount.toFixed(2));
  const prefix = String(referencePriceDisplay || '').replace(/[0-9.,\s]/g, '').trim();
  return prefix ? `${prefix}${rounded.toFixed(2)}` : rounded.toFixed(2);
}

function PackageCardSkeleton({ highlight }) {
  return (
    <div
      className={`pkg-card pkg-card--skeleton${highlight ? ' pkg-card--popular pkg-card--skeleton-popular' : ''}`}
      aria-hidden="true"
    >
      {highlight && <div className="pkg-badge pkg-shimmer" />}
      <div className="pkg-skeleton-header">
        <div className="pkg-skeleton-block pkg-skeleton-title pkg-shimmer" />
        <div className="pkg-skeleton-block pkg-skeleton-price pkg-shimmer" />
        <div className="pkg-skeleton-block pkg-skeleton-duration pkg-shimmer" />
      </div>
      <div className="pkg-skeleton-body">
        <div className="pkg-skeleton-line pkg-shimmer" />
        <div className="pkg-skeleton-line pkg-skeleton-line--short pkg-shimmer" />
      </div>
      <div className="pkg-skeleton-features">
        {[100, 88, 72].map((w) => (
          <div key={w} className="pkg-shimmer pkg-skeleton-feature" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="pkg-skeleton-block pkg-skeleton-btn pkg-shimmer" />
    </div>
  );
}

function SavingsPills({ packages }) {
  const monthly = packages.find((p) => p.name === 'Basic Monthly');
  const threeMonth = packages.find((p) => p.name === 'Acing the Exam (3 Months)');
  const annual = packages.find((p) => p.name === 'Mastering the Exam Annual (12 Months)');

  const monthlyPrice = parsePriceAmount(monthly);
  const threeMonthPrice = parsePriceAmount(threeMonth);
  const annualPrice = parsePriceAmount(annual);

  const save3M =
    monthlyPrice && threeMonthPrice
      ? formatCurrencyAmount(Number((monthlyPrice * 3 - threeMonthPrice).toFixed(2)), monthly?.price_display)
      : null;
  const saveAnnual =
    monthlyPrice && annualPrice
      ? formatCurrencyAmount(Number((monthlyPrice * 12 - annualPrice).toFixed(2)), monthly?.price_display)
      : null;

  const monthlyEquivalent3M =
    monthlyPrice && threeMonthPrice ? Number((monthlyPrice * 3 - threeMonthPrice).toFixed(2)) : null;
  const monthlyEquivalentAnnual =
    monthlyPrice && annualPrice ? Number((monthlyPrice * 12 - annualPrice).toFixed(2)) : null;

  return (
    <div className="pkg-savings-row" role="note" aria-label="Plan price comparison">
      <div className="pkg-savings-pill pkg-savings-pill--trial">
        <span className="pkg-savings-tag">TRIAL</span>
        <span>
          <strong>Basic Monthly</strong>: 3-day free trial before first charge
        </span>
      </div>
      {monthlyEquivalent3M != null && monthlyEquivalent3M > 0 && (
        <div className="pkg-savings-pill pkg-savings-pill--save">
          <span className="pkg-savings-tag">SAVE</span>
          <span>
            3 Months saves <strong>{save3M}</strong> vs monthly x3
          </span>
        </div>
      )}
      {monthlyEquivalentAnnual != null && monthlyEquivalentAnnual > 0 && (
        <div className="pkg-savings-pill pkg-savings-pill--best">
          <span className="pkg-savings-tag">BEST VALUE</span>
          <span>
            Annual saves <strong>{saveAnnual}</strong> vs monthly x12
          </span>
        </div>
      )}
    </div>
  );
}

function PackageCard({ pkg, currentPackage, activeCheckoutPackageId, onBuy }) {
  const feats = packageFeaturesList(pkg);
  const callout = packageCallout(pkg);
  const eligNote = eligibilityPlanNote(pkg);
  const hasCurrent = Boolean(currentPackage?.id);
  const isCurrent = hasCurrent && currentPackage.id === pkg.id;
  const isUpgrade = hasCurrent && !isCurrent && packageRankValue(pkg) > packageRankValue(currentPackage);
  const isLockedLowerTier = hasCurrent && !isCurrent && !isUpgrade;
  const isProcessing = activeCheckoutPackageId === pkg.id;

  let buttonLabel = 'Get Started';
  if (isCurrent) buttonLabel = 'Current Plan';
  else if (isUpgrade) buttonLabel = 'Upgrade';
  else if (isLockedLowerTier) buttonLabel = 'Covered by current plan';

  return (
    <article
      className={`pkg-card${pkg.highlight ? ' pkg-card--popular' : ''}${isCurrent ? ' pkg-card--current' : ''}`}
      aria-label={`${pkg.name} plan`}
    >
      {pkg.highlight && (
        <div className="pkg-popular-banner" aria-label="Most popular plan">
          <span className="pkg-popular-star" aria-hidden="true">&#9733;</span>
          Most Popular
        </div>
      )}

      <div className="pkg-card-inner">
        <header className="pkg-card-header">
          <h2 className="pkg-name">{pkg.name}</h2>

          <div className="pkg-pricing">
            {pkg.price_display && (
              <span className="pkg-price" aria-label={`Price: ${pkg.price_display}`}>
                {pkg.price_display}
              </span>
            )}
            {pkg.duration_label && (
              <span className="pkg-duration">{pkg.duration_label}</span>
            )}
          </div>

          {callout && (
            <div className="pkg-trial-callout" role="note">
              <span className="pkg-trial-tag">FREE TRIAL</span>
              <span>{callout}</span>
            </div>
          )}
        </header>

        {pkg.description && (
          <p className="pkg-description">{pkg.description}</p>
        )}

        <div className="pkg-eligibility" role="note">
          <span className="pkg-eligibility-icon" aria-hidden="true">
            {packageMeetsEligibilityMinimum(pkg) ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeWidth="1" />
                <path d="M5 8.5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeWidth="1" />
                <path d="M8 5v3.5M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </span>
          <span>{eligNote}</span>
        </div>

        {feats.length > 0 && (
          <ul className="pkg-features" aria-label={`Features included in ${pkg.name}`}>
            {feats.map((feat) => (
              <li key={feat} className="pkg-feature-item">
                <span className="pkg-feature-check" aria-hidden="true">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6.5l3 3 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {feat}
              </li>
            ))}
          </ul>
        )}

        <div className="pkg-card-footer">
          <button
            type="button"
            className={`pkg-cta-btn${pkg.highlight ? ' pkg-cta-btn--primary' : ''}${isCurrent ? ' pkg-cta-btn--current' : ''}`}
            onClick={() => onBuy(pkg)}
            disabled={isProcessing || isCurrent || isLockedLowerTier}
            aria-busy={isProcessing}
            aria-label={`${buttonLabel} — ${pkg.name}`}
          >
            {isProcessing ? (
              <span className="pkg-btn-loading">
                <span className="pkg-btn-spinner" aria-hidden="true" />
                Opening checkout...
              </span>
            ) : (
              buttonLabel
            )}
          </button>

          {!isCurrent && !isLockedLowerTier && (
            <p className="pkg-no-commitment">
              {callout ? 'Cancel anytime after trial' : 'Secure checkout via Freemius'}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function readStoredTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    const t = localStorage.getItem('mockgulfmed-index-theme');
    if (t === 'dark' || t === 'light') return t;
  } catch {
    /* ignore */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const Packages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(readStoredTheme);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);
  const [activeCheckoutPackageId, setActiveCheckoutPackageId] = useState(null);
  const [currentPackage, setCurrentPackage] = useState(null);
  const [entitlementRefreshKey, setEntitlementRefreshKey] = useState(0);

  const freemiusReady = useMemo(
    () => Boolean(FREEMIUS_PUBLIC_KEY && FREEMIUS_PRODUCT_ID),
    []
  );

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('mockgulfmed-index-theme', next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'mockgulfmed-index-theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError(null);
    fetchPublicCatalog()
      .then((data) => {
        if (!mounted) return;
        setPackages(data?.packages || []);
      })
      .catch((err) => {
        if (!mounted) return;
        setLoadError(err.message || 'Failed to load packages');
        setPackages([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadActivePackage = async () => {
      if (!user?.id) { setCurrentPackage(null); return; }
      const { data: entRows, error } = await supabase
        .from('user_entitlements')
        .select('package_id, created_at, ends_at')
        .eq('user_id', user.id)
        .eq('scope', 'PACKAGE')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(5);
      if (!mounted) return;
      if (error) { setCurrentPackage(null); return; }
      const now = new Date();
      const row = (entRows || []).find((r) => {
        if (r.ends_at == null || r.ends_at === '') return true;
        return new Date(r.ends_at) > now;
      });
      const pkg = (packages || []).find((p) => p.id === row?.package_id) || null;
      setCurrentPackage(pkg);
    };
    loadActivePackage();
    return () => { mounted = false; };
  }, [user?.id, packages, entitlementRefreshKey]);

  const getPlanIdForPackage = (pkg) => {
    if (pkg?.freemius_plan_id) return String(pkg.freemius_plan_id);
    if (pkg?.freemiusPlanId) return String(pkg.freemiusPlanId);
    return FALLBACK_PLAN_BY_PACKAGE_NAME[pkg?.name] || null;
  };

  const handleBuy = async (pkg) => {
    const planId = getPlanIdForPackage(pkg);
    const directCheckoutUrl = DIRECT_CHECKOUT_BY_PACKAGE_NAME[pkg?.name] || null;
    setCheckoutError(null);

    if (!user?.id) {
      navigate(`/register?packageId=${encodeURIComponent(pkg.id)}`);
      return;
    }
    if (directCheckoutUrl) { window.location.assign(directCheckoutUrl); return; }
    if (!freemiusReady) { setCheckoutError('Checkout is not configured yet. Please contact support.'); return; }
    if (!planId) { setCheckoutError(`Plan ID is missing for "${pkg?.name || 'this package'}".`); return; }
    if (currentPackage?.id && currentPackage.id === pkg.id) { setCheckoutError('You already have this package active.'); return; }

    try {
      setActiveCheckoutPackageId(pkg.id);
      const FS = await ensureFreemiusCheckoutScript();
      const handler = new FS.Checkout({
        product_id: String(FREEMIUS_PRODUCT_ID),
        plan_id: String(planId),
        public_key: FREEMIUS_PUBLIC_KEY,
        image: FREEMIUS_IMAGE || undefined,
      });
      handler.open({
        name: pkg.name || 'Package',
        licenses: 1,
        purchaseCompleted: (response) => {
          if (user?.id) {
            const externalRef =
              response?.subscription?.id || response?.license?.id ||
              response?.license?.key || response?.order?.id || null;
            syncFreemiusEntitlement(
              { userId: user.id, packageId: pkg.id, status: 'ACTIVE', externalRef: externalRef || null },
              FREEMIUS_WEBHOOK_API_URL
            )
              .then(() => {
                toast.success('Purchase recorded. Your package exams are unlocking now.');
                setEntitlementRefreshKey((k) => k + 1);
              })
              .catch((syncErr) => {
                toast.error(syncErr?.message || 'Purchase sync failed. Contact support with your receipt.');
              });
          }
        },
        success: () => {},
      });
    } catch (error) {
      setCheckoutError(error?.message || 'Failed to open checkout.');
    } finally {
      setActiveCheckoutPackageId(null);
    }
  };

  const content = (
    <div className={`packages-page packages-page--${theme}`}>
      <section className="packages-hero" aria-labelledby="packages-heading">
        {user && (
          <div className="packages-hero-toolbar">
            <button
              type="button"
              className="packages-theme-btn"
              onClick={toggleTheme}
              aria-pressed={theme === 'dark'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        )}
        <div className="packages-hero-text">
          <p className="packages-eyebrow">
            <span className="packages-eyebrow-dot" aria-hidden="true" />
            Mock exams for Gulf licensing
          </p>
          <h1 id="packages-heading" className="packages-heading">
            Choose your <span className="packages-heading-accent">study plan</span>
          </h1>
          <p className="packages-lead">
            Each plan unlocks the mock exams included for your profession. Compare access length and
            how many multiple-choice questions you can practise per day. The{' '}
            <strong>full eligibility assessment</strong> (upload and review) is included on{' '}
            <strong>3-month and annual</strong> plans. Clinical scenario-style items mirror real exam
            pacing and decision-making.
          </p>
        </div>

        {(loadError || checkoutError) && (
          <div className="packages-alert packages-alert--error" role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeWidth="1.25" />
              <path d="M8 5v3.5M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {loadError || checkoutError}
          </div>
        )}

        {user && currentPackage?.name && (
          <div className="packages-active-plan" role="status">
            <div className="packages-active-plan-dot" aria-hidden="true" />
            <div>
              <span className="packages-active-plan-label">Active plan</span>
              <span className="packages-active-plan-name">{currentPackage.name}</span>
            </div>
          </div>
        )}

        {loading && (
          <div className="packages-loading-bar" role="status" aria-live="polite">
            <span className="packages-loading-spinner" aria-hidden="true" />
            <div>
              <p className="packages-loading-title">Fetching plans</p>
              <p className="packages-loading-sub">Preparing pricing and what each tier includes</p>
            </div>
          </div>
        )}

        {!loading && !loadError && packages.length === 0 && (
          <p className="packages-empty" role="status">
            No subscription plans are available at the moment. Please refresh or try again later.
            Contact support if the problem continues.
          </p>
        )}

        {!loading && !loadError && packages.length > 0 && (
          <SavingsPills packages={packages} />
        )}
      </section>

      <section
        className="packages-grid"
        aria-label="Available plans"
        aria-busy={loading}
      >
        {loading ? (
          <>
            <PackageCardSkeleton />
            <PackageCardSkeleton highlight />
            <PackageCardSkeleton />
          </>
        ) : (
          packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              currentPackage={currentPackage}
              activeCheckoutPackageId={activeCheckoutPackageId}
              onBuy={handleBuy}
            />
          ))
        )}
      </section>

      {!user && !loading && (
        <aside className="packages-register-banner" aria-label="Create account prompt">
          <div className="packages-register-content">
            <p className="packages-register-headline">New to MockGulfMed?</p>
            <p className="packages-register-sub">
              Create a free account and complete checkout right after sign-up. Takes less than a minute.
            </p>
            <Link to="/register" className="packages-register-btn">
              Create free account
            </Link>
          </div>
        </aside>
      )}
    </div>
  );

  if (user) {
    return <Layout>{content}</Layout>;
  }

  return (
    <div className={`packages-shell packages-shell--${theme}`}>
      <header className={`packages-header${theme === 'dark' ? ' packages-header--dark' : ''}`} role="banner">
        <div className="packages-header-inner">
          <Link to="/" className="packages-brand" aria-label="MockGulfMed home">
            <img className="packages-logo" src={logoUrl} alt="" width="40" height="40" />
            <span className="packages-brand-text">MockGulfMed</span>
          </Link>
          <nav className="packages-nav" aria-label="Main navigation">
            <button
              type="button"
              className="packages-theme-btn"
              onClick={toggleTheme}
              aria-pressed={theme === 'dark'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <Link className="packages-nav-link" to="/">
              Home
            </Link>
            <Link
              className="packages-nav-link packages-nav-link--active"
              to="/packages"
              aria-current="page"
            >
              Packages
            </Link>
            <Link className="packages-nav-link" to="/register">
              Register
            </Link>
            <Link className="packages-nav-cta" to="/login">
              Get started
            </Link>
          </nav>
        </div>
      </header>
      <main className="packages-main" id="main-content">
        {content}
      </main>
    </div>
  );
};

export default Packages;
