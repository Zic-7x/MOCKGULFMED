import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { fetchPublicCatalog, registerUser } from '../utils/publicApi';
import { launchFreemiusPackageCheckout } from '../utils/freemiusCheckout';
import { packageFeaturesForDisplay } from '../utils/packageFeaturesDisplay';
import {
  deduplicateHealthAuthorities,
  deduplicateProfessions,
  deduplicatePackages,
  formatHealthAuthorityLabel,
  getHealthAuthorityCanonicalKey,
} from '../utils/healthAuthorities';
import './Register.css';

const logoUrl = '/logo.png';
const PHONE_REGEX = /^[0-9+\-()\s]{7,32}$/;

const isPhoneValid = (phone) => {
  const trimmed = (phone || '').trim();
  const digits = trimmed.replace(/\D/g, '');
  return PHONE_REGEX.test(trimmed) && digits.length >= 7;
};

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState('PAY_NOW'); // 'PAY_NOW' | 'PAY_LATER'

  const [catalog, setCatalog] = useState({
    professions: [],
    healthAuthorities: [],
    packages: [],
  });

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    professionId: '',
    healthAuthorityId: '',
    packageId: '',
  });

  useEffect(() => {
    let mounted = true;
    setLoadingCatalog(true);
    fetchPublicCatalog()
      .then((data) => {
        if (!mounted) return;
        const incomingPackageId = searchParams.get('packageId');
        const incomingProfessionId = searchParams.get('professionId') || searchParams.get('profession');
        const incomingAuthorityId =
          searchParams.get('healthAuthorityId') ||
          searchParams.get('healthAuthority') ||
          searchParams.get('authorityId');

        const packageList = deduplicatePackages(data?.packages || []);
        const professionsList = deduplicateProfessions(data?.professions || []);
        const authoritiesList = deduplicateHealthAuthorities(data?.healthAuthorities || []);

        const matchingPkg =
          incomingPackageId && packageList.find((pkg) => String(pkg.id) === String(incomingPackageId));
        const defaultPkg = matchingPkg || packageList.find((p) => p.highlight) || packageList[0];

        const matchingProf =
          incomingProfessionId &&
          professionsList.find((p) => String(p.id) === String(incomingProfessionId));
        const matchingAuth =
          incomingAuthorityId &&
          authoritiesList.find(
            (ha) =>
              String(ha.id) === String(incomingAuthorityId) ||
              ha._alternateIds?.some((altId) => String(altId) === String(incomingAuthorityId)) ||
              getHealthAuthorityCanonicalKey(ha) === String(incomingAuthorityId).trim().toLowerCase()
          );

        setCatalog({
          professions: professionsList,
          healthAuthorities: authoritiesList,
          packages: packageList,
        });

        setForm((prev) => ({
          ...prev,
          packageId: prev.packageId || (defaultPkg ? String(defaultPkg.id) : ''),
          ...(matchingProf ? { professionId: String(matchingProf.id) } : {}),
          ...(matchingAuth ? { healthAuthorityId: String(matchingAuth.id) } : {}),
        }));

        if (!professionsList.length && !authoritiesList.length && !packageList.length) {
          toast.error('Could not load registration options. Please refresh the page or try again later.');
        }
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to load registration options');
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingCatalog(false);
      });

    return () => {
      mounted = false;
    };
  }, [searchParams]);

  const selectedPackage = useMemo(() => {
    if (!form.packageId) return null;
    return catalog.packages.find((pkg) => String(pkg.id) === String(form.packageId)) || null;
  }, [catalog.packages, form.packageId]);

  const validationState = useMemo(() => {
    const isNameValid = form.fullName.trim().length >= 2;
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    const isPhoneOk = isPhoneValid(form.phone);
    const isPasswordValid = form.password.length >= 8;
    const isProfessionSelected = Boolean(form.professionId);
    const isAuthoritySelected = Boolean(form.healthAuthorityId);
    const isPackageSelected = Boolean(form.packageId);

    const isValid =
      isNameValid &&
      isEmailValid &&
      isPhoneOk &&
      isPasswordValid &&
      isProfessionSelected &&
      isAuthoritySelected &&
      (paymentChoice === 'PAY_LATER' || isPackageSelected);

    return {
      isValid,
      isNameValid,
      isEmailValid,
      isPhoneOk,
      isPasswordValid,
      isProfessionSelected,
      isAuthoritySelected,
      isPackageSelected,
    };
  }, [form, paymentChoice]);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!form.fullName.trim()) {
      toast.error('Please enter your full name');
      document.getElementById('fullName')?.focus();
      return;
    }
    if (!validationState.isEmailValid) {
      toast.error('Please enter a valid email address');
      document.getElementById('email')?.focus();
      return;
    }
    if (!validationState.isPhoneOk) {
      toast.error('Please enter a valid phone number with country code (e.g. +966 5X XXX XXXX)');
      document.getElementById('phone')?.focus();
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      document.getElementById('password')?.focus();
      return;
    }
    if (!form.professionId) {
      toast.error('Please select your medical profession');
      document.getElementById('profession')?.focus();
      return;
    }
    if (!form.healthAuthorityId) {
      toast.error('Please select your target health authority');
      document.getElementById('healthAuthority')?.focus();
      return;
    }
    if (paymentChoice === 'PAY_NOW' && !form.packageId) {
      toast.error('Please select a subscription package to pay now');
      document.querySelector('.register-packages-grid')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create Supabase Auth user & profile
      await registerUser({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        professionId: form.professionId,
        healthAuthorityId: form.healthAuthorityId,
        packageId: form.packageId || null,
      });

      // 2. Automatically log in user with their new credentials
      let loggedInUser = null;
      try {
        const loginResult = await login(form.email.trim(), form.password);
        if (loginResult?.success && loginResult?.user) {
          loggedInUser = loginResult.user;
        }
      } catch (loginErr) {
        console.warn('[Register] Auto-login notice:', loginErr);
      }

      // 3. Handle Pay Later option
      if (paymentChoice === 'PAY_LATER' || !form.packageId) {
        toast.success('Account created successfully! Welcome to MockGulfMed.');
        if (loggedInUser) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/login', { replace: true, state: { registeredEmail: form.email.trim() } });
        }
        return;
      }

      // 4. Handle Pay Now option
      const pkgToBuy = selectedPackage || catalog.packages.find((p) => String(p.id) === String(form.packageId));
      if (!pkgToBuy) {
        toast.success('Account created! You can activate your plan anytime from Packages.');
        navigate('/packages', { replace: true });
        return;
      }

      if (loggedInUser) {
        toast.success('Account created! Opening secure checkout…');
        try {
          await launchFreemiusPackageCheckout({
            pkg: pkgToBuy,
            user: {
              id: loggedInUser.id,
              email: form.email.trim(),
              fullName: form.fullName.trim(),
            },
            onPurchaseCompleted: () => {
              toast.success('Payment successful! Your mock exams are now unlocked.');
              navigate('/dashboard', { replace: true });
            },
            onCancel: () => {
              toast('Account created! You can complete your package activation anytime from your dashboard.', {
                icon: 'ℹ️',
              });
              navigate('/dashboard', { replace: true });
            },
            onError: (err) => {
              toast.error(err?.message || 'Checkout failed. You can complete payment from Packages.');
              navigate('/packages', { replace: true });
            },
          });
        } catch (checkoutErr) {
          console.error('[Register] Checkout launch error:', checkoutErr);
          navigate('/packages', { replace: true });
        }
      } else {
        toast.success('Account created! Please sign in to complete your package activation.');
        navigate('/login', { replace: true, state: { registeredEmail: form.email.trim() } });
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const packageFeatures = (pkg) => {
    const raw = pkg.featuresNormalized?.length
      ? pkg.featuresNormalized
      : Array.isArray(pkg.features)
        ? pkg.features.map(String)
        : [];
    return packageFeaturesForDisplay(raw);
  };

  const getSubmitButtonText = () => {
    if (submitting) {
      return paymentChoice === 'PAY_NOW' ? 'Setting up account & checkout…' : 'Creating account…';
    }
    if (paymentChoice === 'PAY_LATER') {
      return 'Create Free Account & Pay Later';
    }
    if (selectedPackage?.name === 'Basic Monthly') {
      return 'Create Account & Start 3-Day Trial';
    }
    if (selectedPackage?.price_display) {
      return `Create Account & Pay Now (${selectedPackage.price_display})`;
    }
    return 'Create Account & Pay Now';
  };

  return (
    <div className="register-page">
      <header className="register-header">
        <div className="register-header-inner">
          <Link to="/" className="register-brand" aria-label="MockGulfMed home">
            <img className="register-logo" src={logoUrl} alt="MockGulfMed" />
          </Link>
          <nav className="register-nav">
            <Link className="register-link" to="/packages">
              Packages
            </Link>
            <Link className="register-link" to="/login">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="register-main">
        <div className="register-card">
          <div className="register-card-head">
            <h1>Create your account</h1>
            <p>
              Select your <strong>profession</strong> and <strong>target health authority</strong>, then choose your
              study plan. You can pay now to unlock your mock exams immediately or choose to pay later anytime from
              your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="register-form" noValidate>
            <div className="register-grid">
              <div className="register-field">
                <label htmlFor="fullName">Full name</label>
                <input
                  id="fullName"
                  value={form.fullName}
                  onChange={handleChange('fullName')}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="register-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="register-field">
                <label htmlFor="phone">Phone number</label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  placeholder="e.g. +966 5X XXX XXXX"
                  autoComplete="tel"
                  required
                />
                <span className="register-field-hint">Include country code (e.g. +971, +966, +974)</span>
              </div>

              <div className="register-field">
                <label htmlFor="password">Password</label>
                <div className="register-password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange('password')}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className="register-field-hint">Must be at least 8 characters</span>
              </div>

              <div className="register-field">
                <label htmlFor="profession">Profession</label>
                <select
                  id="profession"
                  value={form.professionId}
                  onChange={handleChange('professionId')}
                  disabled={loadingCatalog}
                  required
                >
                  <option value="">{loadingCatalog ? 'Loading…' : 'Select profession'}</option>
                  {catalog.professions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="register-field">
                <label htmlFor="healthAuthority">Health authority</label>
                <select
                  id="healthAuthority"
                  value={form.healthAuthorityId}
                  onChange={handleChange('healthAuthorityId')}
                  disabled={loadingCatalog}
                  required
                >
                  <option value="">{loadingCatalog ? 'Loading…' : 'Select health authority'}</option>
                  {catalog.healthAuthorities.map((ha) => (
                    <option key={ha.id} value={ha.id}>
                      {formatHealthAuthorityLabel(ha)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Timing Choice */}
            <fieldset className="register-payment-section">
              <legend className="register-payment-legend">Payment timing</legend>
              <p className="register-payment-hint">
                Choose whether you want to start your subscription immediately during signup or activate it later.
              </p>
              <div className="register-payment-options-grid">
                <label
                  className={`register-payment-option-card ${
                    paymentChoice === 'PAY_NOW' ? 'register-payment-option-card-selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentChoice"
                    value="PAY_NOW"
                    checked={paymentChoice === 'PAY_NOW'}
                    onChange={() => setPaymentChoice('PAY_NOW')}
                    className="register-payment-option-radio"
                  />
                  <div className="register-payment-option-body">
                    <div className="register-payment-option-header">
                      <span className="register-payment-option-title">Pay Now &amp; Unlock Exams</span>
                      <span className="register-payment-option-badge">Instant Access</span>
                    </div>
                    <p className="register-payment-option-desc">
                      Proceed to secure checkout right after signup. Includes 3-day free trial on monthly plan or instant
                      full access.
                    </p>
                  </div>
                </label>

                <label
                  className={`register-payment-option-card ${
                    paymentChoice === 'PAY_LATER' ? 'register-payment-option-card-selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentChoice"
                    value="PAY_LATER"
                    checked={paymentChoice === 'PAY_LATER'}
                    onChange={() => setPaymentChoice('PAY_LATER')}
                    className="register-payment-option-radio"
                  />
                  <div className="register-payment-option-body">
                    <div className="register-payment-option-header">
                      <span className="register-payment-option-title">Pay Later</span>
                      <span className="register-payment-option-badge register-payment-option-badge--green">
                        No Card Needed Now
                      </span>
                    </div>
                    <p className="register-payment-option-desc">
                      Create your free candidate account today. Explore your dashboard and activate your preferred
                      package whenever you are ready.
                    </p>
                  </div>
                </label>
              </div>
            </fieldset>

            {/* Subscription Packages */}
            <fieldset className="register-packages-fieldset">
              <legend className="register-packages-legend">
                {paymentChoice === 'PAY_NOW'
                  ? 'Select package for immediate checkout'
                  : 'Target subscription package (optional)'}
              </legend>
              {loadingCatalog && <p className="register-packages-hint">Loading packages…</p>}
              {!loadingCatalog && catalog.packages.length === 0 && (
                <p className="register-packages-empty">
                  No subscription plans are available right now. Please try again later or contact support for help
                  completing registration.
                </p>
              )}
              <div className="register-packages-grid">
                {catalog.packages.map((pkg) => {
                  const selected = Boolean(form.packageId && String(form.packageId) === String(pkg.id));
                  const feats = packageFeatures(pkg);
                  return (
                    <label
                      key={pkg.id}
                      className={`register-package-card ${
                        selected ? 'register-package-card-selected' : ''
                      } ${pkg.highlight ? 'register-package-card-highlight' : ''}`}
                    >
                      {pkg.highlight ? <span className="register-package-badge">Most popular</span> : null}
                      <div className="register-package-card-top">
                        <input
                          type="radio"
                          name="packageId"
                          value={pkg.id}
                          checked={selected}
                          onChange={() => setForm((prev) => ({ ...prev, packageId: String(pkg.id) }))}
                        />
                        <div className="register-package-card-title">
                          <span className="register-package-name">{pkg.name}</span>
                          {pkg.price_display ? (
                            <span className="register-package-price">{pkg.price_display}</span>
                          ) : null}
                          {pkg.duration_label ? (
                            <span className="register-package-duration">{pkg.duration_label}</span>
                          ) : null}
                        </div>
                      </div>
                      {pkg.description ? <p className="register-package-desc">{pkg.description}</p> : null}
                      {feats.length > 0 && (
                        <ul className="register-package-features">
                          {feats.map((f) => (
                            <li key={f}>{f}</li>
                          ))}
                        </ul>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Summary Box */}
            {selectedPackage && (
              <div className="register-summary-box">
                <div className="register-summary-info">
                  <span className="register-summary-label">Selected Plan</span>
                  <span className="register-summary-val">
                    {selectedPackage.name} &bull; {selectedPackage.price_display || 'Standard'}
                  </span>
                </div>
                <div className="register-summary-badge">
                  {paymentChoice === 'PAY_NOW' ? '⚡ Immediate Checkout' : '⏱️ Pay Anytime from Dashboard'}
                </div>
              </div>
            )}

            <button className="register-submit" type="submit" disabled={submitting}>
              {getSubmitButtonText()}
            </button>

            {paymentChoice === 'PAY_NOW' && (
              <div className="register-secure-note">
                <span>🔒 256-bit encrypted checkout powered by Freemius. Cancel anytime.</span>
              </div>
            )}

            <p className="register-foot">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Register;
