import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';
import logoUrl from '../../image/Gemini_Generated_Image_wtgqj3wtgqj3wtgq-removebg-preview.png';
import { fetchPublicCatalog } from '../../utils/publicApi';
import { packageFeaturesForDisplay } from '../../utils/packageFeaturesDisplay';
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

function PackageCardSkeleton({ highlight }) {
  return (
    <div
      className={`package-card package-card-skeleton ${highlight ? 'package-card-skeleton-popular' : ''}`}
      aria-hidden
    >
      {highlight ? <div className="package-skeleton-badge packages-skeleton-shimmer" /> : null}
      <div className="package-skeleton-block package-skeleton-title packages-skeleton-shimmer" />
      <div className="package-skeleton-block package-skeleton-price packages-skeleton-shimmer" />
      <div className="package-skeleton-block package-skeleton-duration packages-skeleton-shimmer" />
      <div className="package-skeleton-desc">
        <div className="package-skeleton-line packages-skeleton-shimmer" />
        <div className="package-skeleton-line package-skeleton-line-short packages-skeleton-shimmer" />
      </div>
      <div className="package-skeleton-features">
        <div className="package-skeleton-feature packages-skeleton-shimmer" />
        <div className="package-skeleton-feature packages-skeleton-shimmer" />
        <div className="package-skeleton-feature package-skeleton-feature-short packages-skeleton-shimmer" />
      </div>
      <div className="package-skeleton-block package-skeleton-button packages-skeleton-shimmer" />
    </div>
  );
}

const Packages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadActivePackage = async () => {
      if (!user?.id) {
        setCurrentPackage(null);
        return;
      }

      const { data: entRows, error } = await supabase
        .from('user_entitlements')
        .select('package_id, created_at, ends_at')
        .eq('user_id', user.id)
        .eq('scope', 'PACKAGE')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!mounted) return;
      if (error) {
        console.warn('[Packages] could not load active package:', error.message || error);
        setCurrentPackage(null);
        return;
      }
      const now = new Date();
      const row = (entRows || []).find((r) => {
        if (r.ends_at == null || r.ends_at === '') return true;
        return new Date(r.ends_at) > now;
      });
      const pkg = (packages || []).find((p) => p.id === row?.package_id) || null;
      setCurrentPackage(pkg);
    };

    loadActivePackage();
    return () => {
      mounted = false;
    };
  }, [user?.id, packages, entitlementRefreshKey]);

  const getPlanIdForPackage = (pkg) => {
    if (pkg?.freemius_plan_id) return String(pkg.freemius_plan_id);
    if (pkg?.freemiusPlanId) return String(pkg.freemiusPlanId);
    return FALLBACK_PLAN_BY_PACKAGE_NAME[pkg?.name] || null;
  };

  const handleBuy = async (pkg) => {
    const planId = getPlanIdForPackage(pkg);
    setCheckoutError(null);

    if (!user?.id) {
      navigate(`/register?packageId=${encodeURIComponent(pkg.id)}`);
      return;
    }

    if (!freemiusReady) {
      setCheckoutError('Checkout is not configured yet. Please contact support.');
      return;
    }

    if (!planId) {
      setCheckoutError(`Plan ID is missing for "${pkg?.name || 'this package'}".`);
      return;
    }

    if (currentPackage?.id && currentPackage.id === pkg.id) {
      setCheckoutError('You already have this package active.');
      return;
    }

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
          console.log('[Freemius] purchaseCompleted:', response);
          if (user?.id) {
            const externalRef =
              response?.subscription?.id ||
              response?.license?.id ||
              response?.license?.key ||
              response?.order?.id ||
              null;
            syncFreemiusEntitlement(
              {
                userId: user.id,
                packageId: pkg.id,
                status: 'ACTIVE',
                externalRef: externalRef || null,
              },
              FREEMIUS_WEBHOOK_API_URL
            )
              .then(() => {
                toast.success('Purchase recorded. Your package exams are unlocking now.');
                setEntitlementRefreshKey((k) => k + 1);
              })
              .catch((syncErr) => {
                console.error('[Freemius] entitlement sync failed:', syncErr);
                toast.error(syncErr?.message || 'Purchase sync failed. Contact support with your receipt.');
              });
          }
        },
        success: (response) => {
          console.log('[Freemius] checkout success:', response);
        },
      });
    } catch (error) {
      console.error('[Freemius] checkout error:', error);
      setCheckoutError(error?.message || 'Failed to open checkout.');
    } finally {
      setActiveCheckoutPackageId(null);
    }
  };

  const content = (
    <div className="packages-page">
      <div className="packages-hero">
        <p className="packages-eyebrow">Mock exams for Gulf licensing</p>
        <h1 className="packages-title">Choose your study plan</h1>
        <p className="packages-lead">
          Each plan unlocks the mock exams included for your profession. Compare access length and how many
          multiple-choice questions you can practise per day. Clinical scenario–style items mirror real exam pacing and
          decision-making; they are marked as recommended to pass the exam on each plan below.
        </p>
        {loadError && <p className="packages-load-error">{loadError}</p>}
        {checkoutError && <p className="packages-load-error">{checkoutError}</p>}
        {user && currentPackage?.name && (
          <p className="packages-current-banner">
            <span className="packages-current-label">Your active plan</span>
            <span className="packages-current-name">{currentPackage.name}</span>
          </p>
        )}
        {loading && (
          <div className="packages-loading-strip" role="status" aria-live="polite">
            <span className="packages-loading-spinner" aria-hidden />
            <div className="packages-loading-strip-text">
              <span className="packages-loading-strip-title">Fetching plans</span>
              <span className="packages-loading-strip-sub">Preparing pricing and what each tier includes</span>
            </div>
          </div>
        )}
        {!loading && !loadError && packages.length === 0 && (
          <p className="packages-empty">
            No subscription plans are available at the moment. Please refresh the page or try again later. If the
            problem continues, contact support and we will help you get access.
          </p>
        )}
      </div>

      <div className="packages-grid" aria-busy={loading}>
        {loading ? (
          <>
            <PackageCardSkeleton />
            <PackageCardSkeleton highlight />
            <PackageCardSkeleton />
          </>
        ) : (
          packages.map((pkg) => {
            const feats = packageFeaturesList(pkg);
            const hasCurrent = Boolean(currentPackage?.id);
            const isCurrent = hasCurrent && currentPackage.id === pkg.id;
            const isUpgrade =
              hasCurrent &&
              !isCurrent &&
              packageRankValue(pkg) > packageRankValue(currentPackage);
            const isLockedLowerTier = hasCurrent && !isCurrent && !isUpgrade;
            const buttonLabel = isCurrent
              ? 'Current Package'
              : isUpgrade
                ? 'Upgrade Package'
                : isLockedLowerTier
                  ? 'Current plan covers this'
                  : 'Buy Now';

            return (
              <div
                key={pkg.id}
                className={`package-card ${pkg.highlight ? 'package-card-highlight' : ''}`}
              >
                {pkg.highlight && <div className="package-badge">Most popular</div>}
                <div className="package-top">
                  <h2 className="package-name">{pkg.name}</h2>
                  <div className="package-price-row">
                    {pkg.price_display ? <div className="package-price">{pkg.price_display}</div> : null}
                    {pkg.duration_label ? <div className="package-duration">{pkg.duration_label}</div> : null}
                  </div>
                </div>

                {pkg.description ? <p className="package-description">{pkg.description}</p> : null}

                {feats.length > 0 && (
                  <ul className="package-features" aria-label="Plan includes">
                    {feats.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  className="package-buy-button"
                  onClick={() => handleBuy(pkg)}
                  disabled={activeCheckoutPackageId === pkg.id || isCurrent || isLockedLowerTier}
                >
                  {activeCheckoutPackageId === pkg.id ? 'Opening checkout...' : buttonLabel}
                </button>
              </div>
            );
          })
        )}
      </div>

      {!user && !loading && (
        <div className="packages-bottom-cta">
          <p className="packages-register-cta">
            New to MockGulfMed?{' '}
            <Link to="/register">Create an account</Link>
            {' — '}you can complete checkout right after sign-up.
          </p>
        </div>
      )}
    </div>
  );

  if (user) {
    return <Layout>{content}</Layout>;
  }

  return (
    <div className="packages-public">
      <header className="packages-public-header">
        <div className="packages-public-inner">
          <Link to="/" className="packages-public-brand" aria-label="MockGulfMed home">
            <img className="packages-public-logo" src={logoUrl} alt="MockGulfMed" />
          </Link>
          <nav className="packages-public-nav">
            <Link className="packages-public-link" to="/">
              Home
            </Link>
            <Link className="packages-public-link packages-public-link-active" to="/packages">
              Packages
            </Link>
            <Link className="packages-public-link" to="/register">
              Register
            </Link>
            <Link className="packages-public-cta" to="/login">
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <main className="packages-public-main">{content}</main>
    </div>
  );
};

export default Packages;
