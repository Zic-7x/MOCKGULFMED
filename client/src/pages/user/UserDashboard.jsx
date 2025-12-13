import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDashboard } from '../../utils/supabaseQueries';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  const { data, isLoading } = useQuery({
    queryKey: ['userDashboard', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await getUserDashboard(user.id);
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  const { user: dashboardUser, recentAttempts, dailyUsage } = data || {};

  return (
    <Layout>
      <div className="user-dashboard">
        <h1>Welcome, {dashboardUser?.fullName || user?.fullName}</h1>

        <div className="dashboard-grid">
          <div className="info-card">
            <h3>Your Profile</h3>
            <div className="info-item">
              <span className="label">Profession:</span>
              <span className="value">{dashboardUser?.profession?.name || 'Not assigned'}</span>
            </div>
            <div className="info-item">
              <span className="label">Health Authority:</span>
              <span className="value">{dashboardUser?.healthAuthority?.name || 'Not assigned'}</span>
            </div>
            <div className="info-item">
              <span className="label">Daily MCQ Limit:</span>
              <span className="value">{dashboardUser?.dailyMcqLimit || 'Unlimited'}</span>
            </div>
          </div>

          <div className="info-card">
            <h3>Today's Usage</h3>
            <div className="usage-stats">
              <div className="usage-item">
                <span className="usage-label">Used:</span>
                <span className="usage-value">{data?.dailyUsage?.used || 0} MCQs</span>
              </div>
              {data?.dailyUsage?.limit && (
                <>
                  <div className="usage-item">
                    <span className="usage-label">Limit:</span>
                    <span className="usage-value">{data?.dailyUsage?.limit} MCQs</span>
                  </div>
                  <div className="usage-item">
                    <span className="usage-label">Remaining:</span>
                    <span className={`usage-value ${data?.dailyUsage?.remaining === 0 ? 'warning' : ''}`}>
                      {data?.dailyUsage?.remaining} MCQs
                    </span>
                  </div>
                </>
              )}
            </div>
            {data?.dailyUsage?.limit && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(100, (data.dailyUsage.used / data.dailyUsage.limit) * 100)}%`,
                  }}
                ></div>
              </div>
            )}
          </div>
        </div>

        <div className="quick-actions">
          <Link to="/exams" className="action-card">
            <h3>Take Exam</h3>
            <p>Start a new mock exam</p>
          </Link>
          <Link to="/results" className="action-card">
            <h3>View Results</h3>
            <p>Check your exam history</p>
          </Link>
        </div>

        {data?.recentAttempts && data.recentAttempts.length > 0 && (
          <div className="recent-attempts">
            <h2>Recent Attempts</h2>
            <div className="attempts-list">
              {data.recentAttempts.map((attempt) => (
                <div key={attempt.id} className="attempt-card">
                  <div className="attempt-header">
                    <h4>{attempt.exam?.title}</h4>
                    <span className={`score-badge ${attempt.score >= 70 ? 'good' : attempt.score >= 50 ? 'average' : 'poor'}`}>
                      {attempt.score.toFixed(1)}%
                    </span>
                  </div>
                  <div className="attempt-details">
                    <span>{attempt.correct_answers}/{attempt.total_questions} correct</span>
                    <span>{new Date(attempt.completed_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserDashboard;
