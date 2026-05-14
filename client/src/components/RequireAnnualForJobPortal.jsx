import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from './Layout';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { getAnnualJobPortalQueryOptions } from '../utils/annualJobPortalQuery';

/**
 * Wraps job portal routes (jobs, applications, employer tools, intro reels).
 * Only users with an active annual-tier package may access children.
 */
export default function RequireAnnualForJobPortal({ children }) {
  const { user } = useAuth();

  const { data: hasAnnual, isLoading } = useQuery(getAnnualJobPortalQueryOptions(user?.id));

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!hasAnnual) {
    return (
      <Layout>
        <div className="job-portal-gate">
          <h1 className="job-portal-gate-title">Job portal</h1>
          <p className="job-portal-gate-lead">
            The job portal, intro reels, and hiring tools are included for subscribers on an active{' '}
            <strong>annual (12‑month)</strong> study plan. Upgrade your package to unlock this area.
          </p>
          <div className="job-portal-gate-actions">
            <Link to="/packages" className="job-portal-gate-btn job-portal-gate-btn--primary">
              View packages
            </Link>
            <Link to="/dashboard" className="job-portal-gate-btn job-portal-gate-btn--secondary">
              Back to dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return children;
}
