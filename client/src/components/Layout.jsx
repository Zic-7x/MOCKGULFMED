import { Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getAnnualJobPortalQueryOptions } from '../utils/annualJobPortalQuery';
const logoUrl = '/logo.png';
import './Layout.css';

/* Micro SVG Icons for Nav & Menu Items */
function NavIcon({ type, className = 'nav-icon' }) {
  const props = {
    className,
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  switch (type) {
    case 'dashboard':
      return (
        <svg {...props}>
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      );
    case 'profile':
      return (
        <svg {...props}>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'exams':
      return (
        <svg {...props}>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      );
    case 'packages':
      return (
        <svg {...props}>
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
      );
    case 'eligibility':
      return (
        <svg {...props}>
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'results':
      return (
        <svg {...props}>
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      );
    case 'users':
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'access':
      return (
        <svg {...props}>
          <circle cx="7.5" cy="15.5" r="5.5" />
          <path d="m21 2-9.6 9.6" />
          <path d="m15.5 7.5 3 3L22 7l-3-3" />
        </svg>
      );
    case 'professions':
      return (
        <svg {...props}>
          <path d="M11 2v2" />
          <path d="M5 2v2" />
          <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
          <path d="M8 15a6 6 0 0 0 12 0v-3" />
          <circle cx="20" cy="10" r="2" />
        </svg>
      );
    case 'authorities':
      return (
        <svg {...props}>
          <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01" />
          <path d="M16 6h.01" />
          <path d="M12 6h.01" />
          <path d="M12 10h.01" />
          <path d="M12 14h.01" />
          <path d="M16 10h.01" />
          <path d="M16 14h.01" />
          <path d="M8 10h.01" />
          <path d="M8 14h.01" />
        </svg>
      );
    case 'support':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'jobs':
      return (
        <svg {...props}>
          <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    case 'applications':
      return (
        <svg {...props}>
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      );
    case 'reels':
      return (
        <svg {...props}>
          <polygon points="6 3 20 12 6 21 6 3" />
        </svg>
      );
    case 'hiring':
      return (
        <svg {...props}>
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
          <path d="M10 6h4" />
          <path d="M10 10h4" />
          <path d="M10 14h4" />
          <path d="M10 18h4" />
        </svg>
      );
    case 'crown':
      return (
        <svg {...props}>
          <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...props}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" x2="9" y1="12" y2="12" />
        </svg>
      );
    case 'app':
      return (
        <svg {...props}>
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      );
    case 'chevron':
      return (
        <svg {...props} width="12" height="12" strokeWidth="2.5">
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    default:
      return null;
  }
}

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const isAdmin = user?.role === 'ADMIN';
  const userInitial = user?.fullName?.trim()?.charAt(0)?.toUpperCase() || 'U';
  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsAccountOpen(false);
  };

  const { data: hasAnnualJobPortal } = useQuery({
    ...getAnnualJobPortalQueryOptions(user?.id),
    enabled: !!user?.id && user?.role !== 'ADMIN',
    staleTime: 60_000,
  });

  useEffect(() => {
    setIsAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isAccountOpen) return;
    const onPointerDown = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setIsAccountOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setIsAccountOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isAccountOpen]);

  const handleLogout = () => {
    logout();
  };

  const jobsActive =
    location.pathname === '/jobs' || location.pathname.startsWith('/jobs/');
  const applicationsActive = location.pathname === '/applications';
  const reelsActive = location.pathname === '/reels';
  const hiringActive = location.pathname.startsWith('/employer');
  const appActive = location.pathname === '/download-app';
  const supportActive = location.pathname === '/support';

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-shell">
          <div className="nav-container">
            <div className="nav-brand-wrap">
              <Link to={isAdmin ? '/admin' : '/dashboard'} className="nav-logo" onClick={closeMenu}>
                <img className="nav-logo-image" src={logoUrl} alt="MockGulfMed" />
                <span className="sr-only">MockGulfMed</span>
              </Link>
              {isAdmin && <span className="nav-badge nav-badge--admin">Admin</span>}
            </div>

            <button
              className={`nav-toggle ${isMenuOpen ? 'nav-toggle--open' : ''}`}
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
            >
              <span className="nav-toggle-bar" />
              <span className="nav-toggle-bar" />
              <span className="nav-toggle-bar" />
            </button>

            <div className={`nav-menu ${isMenuOpen ? 'nav-menu-open' : ''}`}>
              {isAdmin ? (
                <div className="nav-menu-rail nav-menu-rail--admin">
                  <Link
                    to="/admin"
                    className={location.pathname === '/admin' ? 'nav-link active' : 'nav-link'}
                    onClick={closeMenu}
                  >
                    <NavIcon type="dashboard" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/admin/users"
                    className={location.pathname === '/admin/users' ? 'nav-link active' : 'nav-link'}
                    onClick={closeMenu}
                  >
                    <NavIcon type="users" />
                    <span>Users</span>
                  </Link>
                  <Link
                    to="/admin/exams"
                    className={location.pathname === '/admin/exams' ? 'nav-link active' : 'nav-link'}
                    onClick={closeMenu}
                  >
                    <NavIcon type="exams" />
                    <span>Exams</span>
                  </Link>
                  <Link
                    to="/admin/access"
                    className={location.pathname === '/admin/access' ? 'nav-link active' : 'nav-link'}
                    onClick={closeMenu}
                  >
                    <NavIcon type="access" />
                    <span>Access Control</span>
                  </Link>
                  <Link
                    to="/admin/professions"
                    className={location.pathname === '/admin/professions' ? 'nav-link active' : 'nav-link'}
                    onClick={closeMenu}
                  >
                    <NavIcon type="professions" />
                    <span>Professions</span>
                  </Link>
                  <Link
                    to="/admin/health-authorities"
                    className={
                      location.pathname === '/admin/health-authorities' ? 'nav-link active' : 'nav-link'
                    }
                    onClick={closeMenu}
                  >
                    <NavIcon type="authorities" />
                    <span>Health Authorities</span>
                  </Link>
                  <Link
                    to="/admin/tickets"
                    className={
                      location.pathname === '/admin/tickets' || location.pathname === '/admin/support'
                        ? 'nav-link active'
                        : 'nav-link'
                    }
                    onClick={closeMenu}
                  >
                    <NavIcon type="support" />
                    <span>Support Desk</span>
                  </Link>
                </div>
              ) : (
                <div className="nav-menu-rail">
                  <div className="nav-cluster nav-cluster--study">
                    <Link
                      to="/dashboard"
                      className={location.pathname === '/dashboard' ? 'nav-link active' : 'nav-link'}
                      onClick={closeMenu}
                    >
                      <NavIcon type="dashboard" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/profile"
                      className={location.pathname === '/profile' ? 'nav-link active' : 'nav-link'}
                      onClick={closeMenu}
                    >
                      <NavIcon type="profile" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/exams"
                      className={location.pathname.startsWith('/exams') ? 'nav-link active' : 'nav-link'}
                      onClick={closeMenu}
                    >
                      <NavIcon type="exams" />
                      <span>Exams</span>
                    </Link>
                    <Link
                      to="/packages"
                      className={location.pathname === '/packages' ? 'nav-link active' : 'nav-link'}
                      onClick={closeMenu}
                    >
                      <NavIcon type="packages" />
                      <span>Packages</span>
                    </Link>
                    <Link
                      to="/eligibility-assessment"
                      className={
                        location.pathname === '/eligibility-assessment' ? 'nav-link active' : 'nav-link'
                      }
                      onClick={closeMenu}
                    >
                      <NavIcon type="eligibility" />
                      <span>Eligibility</span>
                    </Link>
                    <Link
                      to="/results"
                      className={location.pathname === '/results' ? 'nav-link active' : 'nav-link'}
                      onClick={closeMenu}
                    >
                      <NavIcon type="results" />
                      <span>Results</span>
                    </Link>
                  </div>
                </div>
              )}

              <div className="nav-user nav-user--dropdown" ref={accountRef}>
                <button
                  type="button"
                  id="account-menu-button"
                  className={`nav-user-trigger ${isAccountOpen ? 'nav-user-trigger--active' : ''}`}
                  aria-expanded={isAccountOpen}
                  aria-haspopup="true"
                  aria-controls="account-menu"
                  onClick={() => setIsAccountOpen((o) => !o)}
                >
                  <span className="user-avatar" aria-hidden="true">
                    {userInitial}
                  </span>
                  <div className="nav-user-info-brief">
                    <span className="user-name user-name--trigger">{user?.fullName || 'My Account'}</span>
                    <span className="user-role-micro">{isAdmin ? 'Admin' : 'Candidate'}</span>
                  </div>
                  <span className={`nav-user-chevron ${isAccountOpen ? 'nav-user-chevron--open' : ''}`} aria-hidden="true">
                    <NavIcon type="chevron" className="nav-chevron-icon" />
                  </span>
                </button>

                {isAccountOpen && (
                  <div id="account-menu" className="nav-user-panel" role="menu">
                    <div className="nav-user-panel-header">
                      <div className="user-avatar-wrap">
                        <span className="user-avatar user-avatar--panel" aria-hidden="true">
                          {userInitial}
                        </span>
                        <span className="user-status-dot" aria-hidden="true" />
                      </div>
                      <div className="nav-user-panel-meta">
                        <span className="nav-user-panel-name">{user?.fullName || 'User'}</span>
                        <span className="nav-user-panel-badge">{isAdmin ? 'Administrator' : 'Medical Candidate'}</span>
                      </div>
                    </div>

                    {!isAdmin && (
                      <>
                        <div className="nav-user-panel-section" role="none">
                          <div className="nav-user-panel-label">Job & Career Portal</div>
                          <Link
                            to="/jobs"
                            role="menuitem"
                            className={`nav-user-panel-link${jobsActive ? ' nav-user-panel-link--active' : ''}`}
                            aria-current={jobsActive ? 'page' : undefined}
                            onClick={closeMenu}
                          >
                            <NavIcon type="jobs" />
                            <span>Jobs Board</span>
                          </Link>
                          <Link
                            to="/applications"
                            role="menuitem"
                            className={`nav-user-panel-link${
                              applicationsActive ? ' nav-user-panel-link--active' : ''
                            }`}
                            onClick={closeMenu}
                          >
                            <NavIcon type="applications" />
                            <span>My Applications</span>
                          </Link>
                          <Link
                            to="/reels"
                            role="menuitem"
                            className={`nav-user-panel-link${reelsActive ? ' nav-user-panel-link--active' : ''}`}
                            onClick={closeMenu}
                          >
                            <NavIcon type="reels" />
                            <span>Applicant Reels</span>
                          </Link>
                          <Link
                            to="/employer/jobs"
                            role="menuitem"
                            className={`nav-user-panel-link${
                              hiringActive ? ' nav-user-panel-link--active' : ''
                            }`}
                            onClick={closeMenu}
                          >
                            <NavIcon type="hiring" />
                            <span>Employer / Hiring</span>
                          </Link>
                          <Link
                            to="/download-app"
                            role="menuitem"
                            className={`nav-user-panel-link${appActive ? ' nav-user-panel-link--active' : ''}`}
                            aria-current={appActive ? 'page' : undefined}
                            onClick={closeMenu}
                          >
                            <NavIcon type="app" />
                            <span>📱 Android App (Free APK)</span>
                          </Link>
                          <Link
                            to="/support"
                            role="menuitem"
                            className={`nav-user-panel-link${supportActive ? ' nav-user-panel-link--active' : ''}`}
                            aria-current={supportActive ? 'page' : undefined}
                            onClick={closeMenu}
                          >
                            <NavIcon type="support" />
                            <span>Candidate Support & SLA</span>
                          </Link>
                        </div>

                        {!hasAnnualJobPortal && (
                          <Link
                            to="/packages"
                            role="menuitem"
                            className="nav-user-panel-cta"
                            onClick={closeMenu}
                          >
                            <span className="nav-cta-sparkle">
                              <NavIcon type="crown" />
                            </span>
                            <div className="nav-cta-text">
                              <span className="nav-cta-title">Upgrade to Annual</span>
                              <span className="nav-cta-sub">Unlimited Job Access & Exams</span>
                            </div>
                            <span className="nav-cta-arrow" aria-hidden="true">→</span>
                          </Link>
                        )}
                      </>
                    )}

                    <div className="nav-user-panel-footer">
                      <button
                        type="button"
                        role="menuitem"
                        className="nav-user-panel-logout"
                        onClick={() => {
                          closeMenu();
                          handleLogout();
                        }}
                      >
                        <NavIcon type="logout" className="logout-icon" />
                        <span>Log out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;

