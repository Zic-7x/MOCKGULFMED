import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-container">
          <Link to={isAdmin ? '/admin' : '/dashboard'} className="nav-logo">
            Mock Gulf Med
          </Link>
          <div className="nav-menu">
            {isAdmin ? (
              <>
                <Link
                  to="/admin"
                  className={location.pathname === '/admin' ? 'nav-link active' : 'nav-link'}
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin/users"
                  className={location.pathname === '/admin/users' ? 'nav-link active' : 'nav-link'}
                >
                  Users
                </Link>
                <Link
                  to="/admin/exams"
                  className={location.pathname === '/admin/exams' ? 'nav-link active' : 'nav-link'}
                >
                  Exams
                </Link>
                <Link
                  to="/admin/access"
                  className={location.pathname === '/admin/access' ? 'nav-link active' : 'nav-link'}
                >
                  Access Control
                </Link>
                <Link
                  to="/admin/professions"
                  className={location.pathname === '/admin/professions' ? 'nav-link active' : 'nav-link'}
                >
                  Professions
                </Link>
                <Link
                  to="/admin/health-authorities"
                  className={location.pathname === '/admin/health-authorities' ? 'nav-link active' : 'nav-link'}
                >
                  Health Authorities
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className={location.pathname === '/dashboard' ? 'nav-link active' : 'nav-link'}
                >
                  Dashboard
                </Link>
                <Link
                  to="/exams"
                  className={location.pathname.startsWith('/exams') ? 'nav-link active' : 'nav-link'}
                >
                  Exams
                </Link>
                <Link
                  to="/results"
                  className={location.pathname === '/results' ? 'nav-link active' : 'nav-link'}
                >
                  Results
                </Link>
              </>
            )}
            <div className="nav-user">
              <span className="user-name">{user?.fullName}</span>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
