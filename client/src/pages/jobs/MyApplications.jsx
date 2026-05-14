import { Link, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { fetchMyApplications, withdrawApplication } from '../../utils/jobPortalQueries';
import './job-portal.css';

const STATUS_LABEL = {
  SUBMITTED: 'Submitted',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW: 'Interview',
  OFFERED: 'Offered',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

export default function MyApplications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: rows, isLoading, error } = useQuery({
    queryKey: ['myApplications', user?.id],
    queryFn: () => fetchMyApplications(user.id),
    enabled: !!user?.id,
  });

  const onWithdraw = async (applicationId) => {
    try {
      await withdrawApplication(applicationId);
      toast.success('Application withdrawn.');
      queryClient.invalidateQueries({ queryKey: ['myApplications', user.id] });
    } catch (e) {
      toast.error(e?.message || 'Could not withdraw.');
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <div className="job-portal">
        <h1>My applications</h1>
        <p className="job-portal-lead">
          Track roles you have applied for. You can withdraw while the employer has not marked a final decision.
        </p>
        <Link to="/jobs" className="job-btn job-btn--secondary" style={{ marginBottom: 16, display: 'inline-block' }}>
          Browse jobs
        </Link>

        {error && (
          <div className="job-alert job-alert--error" role="alert">
            {error.message}
          </div>
        )}
        {isLoading && <LoadingSpinner />}

        {!isLoading && (!rows || rows.length === 0) && (
          <p className="job-portal-lead">You have not applied to any roles yet.</p>
        )}

        {!isLoading && rows && rows.length > 0 && (
          <table className="job-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Status</th>
                <th>Applied</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/jobs/${r.job_id}`}>{r.job?.title || 'Job'}</Link>
                    {r.job?.location && (
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{r.job.location}</div>
                    )}
                  </td>
                  <td>{STATUS_LABEL[r.status] || r.status}</td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>
                    {r.status === 'SUBMITTED' && (
                      <button type="button" className="job-btn job-btn--secondary" onClick={() => onWithdraw(r.id)}>
                        Withdraw
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
