import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserDashboard from './pages/user/UserDashboard';
import UserProfile from './pages/user/UserProfile';
import ExamList from './pages/user/ExamList';
import TakeExam from './pages/user/TakeExam';
import ExamResults from './pages/user/ExamResults';
import Packages from './pages/user/Packages';
import EligibilityAssessment from './pages/user/EligibilityAssessment';
import ApplicantReels from './pages/user/ApplicantReels';
import LicensingDataflowService from './pages/user/LicensingDataflowService';
import JobsList from './pages/jobs/JobsList';
import JobDetail from './pages/jobs/JobDetail';
import MyApplications from './pages/jobs/MyApplications';
import EmployerJobs from './pages/employer/EmployerJobs';
import EmployerJobForm from './pages/employer/EmployerJobForm';
import EmployerJobApplications from './pages/employer/EmployerJobApplications';
import RequireAnnualForJobPortal from './components/RequireAnnualForJobPortal';
import PublicEligibilityChecker from './pages/PublicEligibilityChecker';
import UserManagement from './pages/admin/UserManagement';
import ExamManagement from './pages/admin/ExamManagement';
import AccessManagement from './pages/admin/AccessManagement';
import ProfessionManagement from './pages/admin/ProfessionManagement';
import HealthAuthorityManagement from './pages/admin/HealthAuthorityManagement';
import LoadingSpinner from './components/LoadingSpinner';
import PolicyLayout from './pages/policies/PolicyLayout';
import PoliciesIndex from './pages/policies/PoliciesIndex';
import RefundPolicy from './pages/policies/RefundPolicy';
import TermsAndConditions from './pages/policies/TermsAndConditions';
import FeaturesHub from './pages/features/FeaturesHub';
import PublicFeaturePage from './pages/features/PublicFeaturePage';

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
        <Route
          path="/register"
          element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} /> : <Register />}
        />

        <Route path="/packages" element={<Packages />} />
        <Route path="/features" element={<FeaturesHub />} />
        <Route path="/features/:slug" element={<PublicFeaturePage />} />
        <Route path="/eligibility-check" element={<PublicEligibilityChecker />} />
        <Route
          path="/services/licensing-dataflow"
          element={
            !user ? (
              <Navigate to="/login" replace state={{ from: '/services/licensing-dataflow' }} />
            ) : user.role === 'ADMIN' ? (
              <Navigate to="/admin" replace />
            ) : (
              <LicensingDataflowService />
            )
          }
        />

        <Route path="/policies" element={<PolicyLayout />}>
          <Route index element={<PoliciesIndex />} />
          <Route path="terms" element={<TermsAndConditions />} />
          <Route path="refund" element={<RefundPolicy />} />
        </Route>

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
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/exams" element={<ExamList />} />
            <Route path="/exams/:id" element={<TakeExam />} />
            <Route path="/exams/:id/results" element={<ExamResults />} />
            <Route path="/results/attempt/:attemptId" element={<ExamResults />} />
            <Route path="/results" element={<ExamResults />} />
            <Route path="/eligibility-assessment" element={<EligibilityAssessment />} />
            <Route
              path="/reels"
              element={
                <RequireAnnualForJobPortal>
                  <ApplicantReels />
                </RequireAnnualForJobPortal>
              }
            />
            <Route
              path="/jobs"
              element={
                <RequireAnnualForJobPortal>
                  <JobsList />
                </RequireAnnualForJobPortal>
              }
            />
            <Route
              path="/jobs/:id"
              element={
                <RequireAnnualForJobPortal>
                  <JobDetail />
                </RequireAnnualForJobPortal>
              }
            />
            <Route
              path="/applications"
              element={
                <RequireAnnualForJobPortal>
                  <MyApplications />
                </RequireAnnualForJobPortal>
              }
            />
            <Route
              path="/employer/jobs"
              element={
                <RequireAnnualForJobPortal>
                  <EmployerJobs />
                </RequireAnnualForJobPortal>
              }
            />
            <Route
              path="/employer/jobs/new"
              element={
                <RequireAnnualForJobPortal>
                  <EmployerJobForm />
                </RequireAnnualForJobPortal>
              }
            />
            <Route
              path="/employer/jobs/:id/edit"
              element={
                <RequireAnnualForJobPortal>
                  <EmployerJobForm />
                </RequireAnnualForJobPortal>
              }
            />
            <Route
              path="/employer/jobs/:id/applications"
              element={
                <RequireAnnualForJobPortal>
                  <EmployerJobApplications />
                </RequireAnnualForJobPortal>
              }
            />
          </>
        )}

        <Route
          path="/"
          element={
            user ? (
              <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} />
            ) : (
              <Index />
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
