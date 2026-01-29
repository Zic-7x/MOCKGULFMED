import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserDashboard from './pages/user/UserDashboard';
import ExamList from './pages/user/ExamList';
import TakeExam from './pages/user/TakeExam';
import ExamResults from './pages/user/ExamResults';
import UserManagement from './pages/admin/UserManagement';
import ExamManagement from './pages/admin/ExamManagement';
import AccessManagement from './pages/admin/AccessManagement';
import ProfessionManagement from './pages/admin/ProfessionManagement';
import HealthAuthorityManagement from './pages/admin/HealthAuthorityManagement';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} /> : <Login />}
        />
        
        {/* Admin Routes */}
        {user?.role === 'ADMIN' && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/exams" element={<ExamManagement />} />
            <Route path="/admin/access" element={<AccessManagement />} />
            <Route path="/admin/professions" element={<ProfessionManagement />} />
            <Route path="/admin/health-authorities" element={<HealthAuthorityManagement />} />
          </>
        )}

        {/* User Routes - Only for non-admin users */}
        {user && user.role !== 'ADMIN' && (
          <>
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/exams" element={<ExamList />} />
            <Route path="/exams/:id" element={<TakeExam />} />
            <Route path="/exams/:id/results" element={<ExamResults />} />
            <Route path="/results/attempt/:attemptId" element={<ExamResults />} />
            <Route path="/results" element={<ExamResults />} />
          </>
        )}

        <Route
          path="/"
          element={
            user ? (
              <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        {/* Redirect admins trying to access /dashboard to /admin */}
        {user?.role === 'ADMIN' && (
          <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
        )}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
