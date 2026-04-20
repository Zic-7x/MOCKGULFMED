import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import logoUrl from '../image/Gemini_Generated_Image_wtgqj3wtgqj3wtgq-removebg-preview.png';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const isAdmin = user?.role === 'ADMIN';
  const userInitial = user?.fullName?.trim()?.charAt(0)?.toUpperCase() || 'U';
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="layout">
      <nav className="navbar">
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
              <>
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
                  className={location.pathname === '/admin/health-authorities' ? 'nav-link active' : 'nav-link'}
                  onClick={closeMenu}
                >
                  Health Authorities
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className={location.pathname === '/dashboard' ? 'nav-link active' : 'nav-link'}
                  onClick={closeMenu}
                >
                  Dashboard
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
              </>
            )}
            <div className="nav-user">
              <span className="user-avatar" aria-hidden="true">
                {userInitial}
              </span>
              <span className="user-name">{user?.fullName}</span>
              <button
                onClick={() => {
                  closeMenu();
                  handleLogout();
                }}
                className="logout-button"
              >
                Logout
              </button>
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
