import { Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getAnnualJobPortalQueryOptions } from '../utils/annualJobPortalQuery';
import logoUrl from '../image/Gemini_Generated_Image_wtgqj3wtgqj3wtgq-removebg-preview.png';
import './Layout.css';

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

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-shell">
          <div className="nav-container">
            <Link to={isAdmin ? '/admin' : '/dashboard'} className="nav-logo">
              <img className="nav-logo-image" src={logoUrl} alt="MockGulfMed" />
              <span className="sr-only">MockGulfMed</span>
            </Link>
            <button
              className="nav-toggle"
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label="Toggle navigation menu"
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
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/users"
                    className={location.pathname === '/admin/users' ? 'nav-link active' : 'nav-link'}
                    onClick={closeMenu}
                  >
                    Users
                  </Link>
                  <Link
                    to="/admin/exams"
                    className={location.pathname === '/admin/exams' ? 'nav-link active' : 'nav-link'}
                    onClick={closeMenu}
                  >
                    Exams
                  </Link>
                  <Link
                    to="/admin/access"
                    className={location.pathname === '/admin/access' ? 'nav-link active' : 'nav-link'}
                    onClick={closeMenu}
                  >
                    Access Control
                  </Link>
                  <Link
                    to="/admin/professions"
                    className={location.pathname === '/admin/professions' ? 'nav-link active' : 'nav-link'}
                    onClick={closeMenu}
                  >
                    Professions
                  </Link>
                  <Link
                    to="/admin/health-authorities"
                    className={
                      location.pathname === '/admin/health-authorities' ? 'nav-link active' : 'nav-link'
                    }
                    onClick={closeMenu}
                  >
                    Health Authorities
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
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className={location.pathname === '/profile' ? 'nav-link active' : 'nav-link'}
                      onClick={closeMenu}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/exams"
                      className={location.pathname.startsWith('/exams') ? 'nav-link active' : 'nav-link'}
                      onClick={closeMenu}
                    >
                      Exams
                    </Link>
                    <Link
                      to="/packages"
                      className={location.pathname === '/packages' ? 'nav-link active' : 'nav-link'}
                      onClick={closeMenu}
                    >
                      Packages
                    </Link>
                    <Link
                      to="/eligibility-assessment"
                      className={
                        location.pathname === '/eligibility-assessment' ? 'nav-link active' : 'nav-link'
                      }
                      onClick={closeMenu}
                    >
                      Eligibility
                    </Link>
                    <Link
                      to="/results"
                      className={location.pathname === '/results' ? 'nav-link active' : 'nav-link'}
                      onClick={closeMenu}
                    >
                      Results
                    </Link>
                  </div>
                </div>
              )}
              <div className="nav-user nav-user--dropdown" ref={accountRef}>
                <button
                  type="button"
                  id="account-menu-button"
                  className="nav-user-trigger"
                  aria-expanded={isAccountOpen}
                  aria-haspopup="true"
                  aria-controls="account-menu"
                  onClick={() => setIsAccountOpen((o) => !o)}
                >
                  <span className="user-avatar" aria-hidden="true">
                    {userInitial}
                  </span>
                  <span className="user-name user-name--trigger">{user?.fullName}</span>
                  <span className="nav-user-chevron" aria-hidden="true" />
                </button>
                {isAccountOpen && (
                  <div id="account-menu" className="nav-user-panel" role="menu">
                    <div className="nav-user-panel-header">
                      <span className="user-avatar user-avatar--panel" aria-hidden="true">
                        {userInitial}
                      </span>
                      <div className="nav-user-panel-meta">
                        <span className="nav-user-panel-name">{user?.fullName}</span>
                      </div>
                    </div>
                    {!isAdmin && (
                      <>
                        <div className="nav-user-panel-section" role="none">
                          <div className="nav-user-panel-label">Job portal</div>
                          <Link
                            to="/jobs"
                            role="menuitem"
                            className={`nav-user-panel-link${jobsActive ? ' nav-user-panel-link--active' : ''}`}
                            aria-current={jobsActive ? 'page' : undefined}
                            onClick={closeMenu}
                          >
                            Jobs
                          </Link>
                          <Link
                            to="/applications"
                            role="menuitem"
                            className={`nav-user-panel-link${
                              applicationsActive ? ' nav-user-panel-link--active' : ''
                            }`}
                            onClick={closeMenu}
                          >
                            Applications
                          </Link>
                          <Link
                            to="/reels"
                            role="menuitem"
                            className={`nav-user-panel-link${reelsActive ? ' nav-user-panel-link--active' : ''}`}
                            onClick={closeMenu}
                          >
                            Reels
                          </Link>
                          <Link
                            to="/employer/jobs"
                            role="menuitem"
                            className={`nav-user-panel-link${
                              hiringActive ? ' nav-user-panel-link--active' : ''
                            }`}
                            onClick={closeMenu}
                          >
                            Hiring
                          </Link>
                        </div>
                        {!hasAnnualJobPortal && (
                          <Link
                            to="/packages"
                            role="menuitem"
                            className="nav-user-panel-cta"
                            onClick={closeMenu}
                          >
                            Annual plan
                          </Link>
                        )}
                      </>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      className="nav-user-panel-logout"
                      onClick={() => {
                        closeMenu();
                        handleLogout();
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="announcement-banner" role="status" aria-live="polite">
          <div className="announcement-banner-inner">
            <span className="announcement-badge">Announcement</span>
            <span className="announcement-text">
              <strong>Mega Update</strong> coming soon on the portal.
            </span>
          </div>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
