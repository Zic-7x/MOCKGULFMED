import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import logoUrl from '../image/Gemini_Generated_Image_wtgqj3wtgqj3wtgq-removebg-preview.png';
import './Login.css';

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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(readStoredTheme);
  const { login } = useAuth();
  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate(result.role === 'ADMIN' ? '/admin' : '/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className={`login-page login-page--${theme}`}>
      <a className="login-skip" href="#login-main">
        Skip to sign in
      </a>

      <header className="login-nav" role="banner">
        <div className="login-nav-inner">
          <Link className="login-brand" to="/">
            <img className="login-brand-logo" src={logoUrl} alt="" />
            <span className="login-brand-text">MockGulfMed</span>
          </Link>
          <nav className="login-nav-actions" aria-label="Sign-in navigation">
            <button
              type="button"
              className="login-theme-btn"
              onClick={toggleTheme}
              aria-pressed={theme === 'dark'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <Link className="login-nav-link" to="/packages">
              Packages
            </Link>
            <Link className="login-nav-cta" to="/register">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main id="login-main" className="login-main">
        <div className="login-card login-glass">
          <div className="login-card-header">
            <h1 className="login-title">
              Welcome back — <span className="login-title-accent">sign in</span>
            </h1>
            <p className="login-subtitle">Exam portal for Gulf medical licensing preparation.</p>
          </div>
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="login-field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@hospital.org"
              />
            </div>
            <div className="login-field">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </div>
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="login-footer">
            <p>
              New here?{' '}
              <Link to="/register" className="login-inline-link">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
