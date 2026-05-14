import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { fetchMyJobPostings } from '../../utils/jobPortalQueries';
import '../jobs/job-portal.css';

export default function EmployerJobs() {
  const { user } = useAuth();

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['myJobPostings', user?.id],
    queryFn: () => fetchMyJobPostings(user.id),
    enabled: !!user?.id,
  });

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <div className="job-portal">
        <h1>My job listings</h1>
        <p className="job-portal-lead">
          Create and publish listings, then review applicants. Access is limited to active annual subscribers.
        </p>
        <div className="job-btn-row" style={{ marginBottom: 20 }}>
          <Link to="/employer/jobs/new" className="job-btn job-btn--primary">
            New listing
          </Link>
          <Link to="/jobs" className="job-btn job-btn--secondary">
            Browse open roles
          </Link>
        </div>

        {error && (
          <div className="job-alert job-alert--error" role="alert">
            {error.message}
          </div>
        )}
        {isLoading && <LoadingSpinner />}

        {!isLoading && (!jobs || jobs.length === 0) && (
          <p className="job-portal-lead">You have not created any listings yet.</p>
        )}

        {!isLoading &&
          (jobs || []).map((job) => (
            <div key={job.id} className="job-card" style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2 className="job-card-title">{job.title}</h2>
                  <div className="job-card-meta">
                    <span className="job-pill">{job.status}</span>
                    {job.location && <span>{job.location}</span>}
                    {job.profession?.name && <span className="job-pill">{job.profession.name}</span>}
                  </div>
                </div>
                <div className="job-btn-row">
                  <Link to={`/employer/jobs/${job.id}/edit`} className="job-btn job-btn--secondary">
                    Edit
                  </Link>
                  <Link to={`/employer/jobs/${job.id}/applications`} className="job-btn job-btn--primary">
                    Applicants
                  </Link>
                </div>
              </div>
            </div>
          ))}
      </div>
    </Layout>
  );
}
