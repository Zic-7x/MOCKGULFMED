import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
const logoUrl = '/logo.png';
import { fetchPublicCatalog, registerUser } from '../utils/publicApi';
import { packageFeaturesForDisplay } from '../utils/packageFeaturesDisplay';
import {
  deduplicateHealthAuthorities,
  deduplicateProfessions,
  deduplicatePackages,
  formatHealthAuthorityLabel,
  getHealthAuthorityCanonicalKey,
} from '../utils/healthAuthorities';
import './Register.css';

const PHONE_REGEX = /^[0-9+\-()\s]{7,32}$/;

const isPhoneValid = (phone) => {
  const trimmed = (phone || '').trim();
  const digits = trimmed.replace(/\D/g, '');
  return PHONE_REGEX.test(trimmed) && digits.length >= 7;
};

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
          ...(matchingPkg ? { packageId: String(matchingPkg.id) } : {}),
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
      isPackageSelected;

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
  }, [form]);

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
    if (!form.packageId) {
      toast.error('Please select a subscription package to proceed');
      document.querySelector('.register-packages-grid')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const data = await registerUser({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        professionId: form.professionId,
        healthAuthorityId: form.healthAuthorityId,
        packageId: form.packageId,
      });

      toast.success('Account created successfully! Please sign in to proceed.');

      navigate('/login', { replace: true, state: { registeredEmail: form.email.trim() } });

      return data;
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
              Select your <strong>profession</strong> and <strong>health authority</strong>, then choose a subscription
              plan. After checkout completes, the mock exams linked to that plan unlock for your account. Plans that
              list <strong>clinical scenario</strong> practice include vignette-style questions that are{' '}
              <strong>recommended to pass the exam</strong>; those lines are called out on each card below.
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

            <fieldset className="register-packages-fieldset">
              <legend className="register-packages-legend">Choose a subscription package</legend>
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
                      className={`register-package-card ${selected ? 'register-package-card-selected' : ''} ${pkg.highlight ? 'register-package-card-highlight' : ''}`}
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

            <button
              className="register-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Creating account…' : 'Create account'}
            </button>

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
