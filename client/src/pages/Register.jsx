import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import logoUrl from '../image/Gemini_Generated_Image_wtgqj3wtgqj3wtgq-removebg-preview.png';
import { fetchPublicCatalog, registerUser } from '../utils/publicApi';
import { packageFeaturesForDisplay } from '../utils/packageFeaturesDisplay';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
        const packageList = data?.packages || [];
        const hasIncomingPackage =
          incomingPackageId && packageList.some((pkg) => String(pkg.id) === String(incomingPackageId));
        setCatalog({
          professions: data?.professions || [],
          healthAuthorities: data?.healthAuthorities || [],
          packages: packageList,
        });
        if (hasIncomingPackage) {
          setForm((prev) => ({ ...prev, packageId: incomingPackageId }));
        }
        if (
          !(data?.professions?.length || data?.healthAuthorities?.length) &&
          !(data?.packages?.length)
        ) {
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

  const canSubmit = useMemo(() => {
    return (
      form.fullName.trim().length > 1 &&
      form.email.includes('@') &&
      form.phone.trim().length >= 7 &&
      form.password.length >= 8 &&
      form.professionId &&
      form.healthAuthorityId &&
      form.packageId &&
      !submitting
    );
  }, [form, submitting]);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const data = await registerUser({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        professionId: form.professionId,
        healthAuthorityId: form.healthAuthorityId,
        packageId: form.packageId,
      });

      toast.success('Account created. Complete payment to unlock exams.');

      navigate('/login', { replace: true, state: { registeredEmail: form.email } });

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

          <form onSubmit={handleSubmit} className="register-form">
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
                  placeholder="Enter your email"
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
              </div>

              <div className="register-field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  required
                />
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
                      {ha.name} ({ha.country})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <fieldset className="register-packages-fieldset">
              <legend className="register-packages-legend">Choose a package</legend>
              {loadingCatalog && <p className="register-packages-hint">Loading packages…</p>}
              {!loadingCatalog && catalog.packages.length === 0 && (
                <p className="register-packages-empty">
                  No subscription plans are available right now. Please try again later or contact support for help
                  completing registration.
                </p>
              )}
              <div className="register-packages-grid">
                {catalog.packages.map((pkg) => {
                  const selected = form.packageId === pkg.id;
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
                          onChange={() => setForm((prev) => ({ ...prev, packageId: pkg.id }))}
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

            <button className="register-submit" type="submit" disabled={!canSubmit}>
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
