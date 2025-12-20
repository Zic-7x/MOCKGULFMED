import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAdminStats } from '../../utils/supabaseQueries';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['adminStats'],
    queryFn: getAdminStats,
    retry: 1,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (error) {
    console.error('Error loading admin stats:', error);
    return (
      <Layout>
        <div className="admin-dashboard">
          <h1>Admin Dashboard</h1>
          <div style={{ padding: '20px', background: '#fee', color: '#c33', borderRadius: '8px' }}>
            <p><strong>Error loading dashboard data:</strong></p>
            <p>{error.message || 'Failed to load statistics. Please try refreshing the page.'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Calculate max count for chart scaling
  const maxActivity = Math.max(...(stats?.dailyActivity?.map(d => d.count) || [0]), 1);

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Layout>
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p className="dashboard-subtitle">Overview of system activity and performance</p>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <Link to="/admin/users" className="action-card">
            <span className="action-icon">👥</span>
            <span>Manage Users</span>
          </Link>
          <Link to="/admin/exams" className="action-card">
            <span className="action-icon">📝</span>
            <span>Manage Exams</span>
          </Link>
          <Link to="/admin/access" className="action-card">
            <span className="action-icon">🔐</span>
            <span>Access Control</span>
          </Link>
          <Link to="/admin/professions" className="action-card">
            <span className="action-icon">💼</span>
            <span>Professions</span>
          </Link>
          <Link to="/admin/health-authorities" className="action-card">
            <span className="action-icon">🏥</span>
            <span>Health Authorities</span>
          </Link>
        </div>

        {/* Main Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>Total Users</h3>
              <p className="stat-number">{stats?.totalUsers || 0}</p>
              <p className="stat-change">
                <span className="positive">+{stats?.newUsersThisWeek || 0}</span> this week
              </p>
            </div>
          </div>
          <div className="stat-card primary">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <h3>Total Exams</h3>
              <p className="stat-number">{stats?.totalExams || 0}</p>
            </div>
          </div>
          <div className="stat-card primary">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Total Attempts</h3>
              <p className="stat-number">{stats?.totalAttempts || 0}</p>
              <p className="stat-change">
                <span className="positive">{stats?.attemptsToday || 0}</span> today
              </p>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Average Score</h3>
              <p className="stat-number">{stats?.averageScore?.toFixed(1) || '0.0'}%</p>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3>Pass Rate</h3>
              <p className="stat-number">{stats?.passRate?.toFixed(1) || '0.0'}%</p>
            </div>
          </div>
          <div className="stat-card info">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <h3>Active Users</h3>
              <p className="stat-number">{stats?.activeUsers || 0}</p>
              <p className="stat-change">Last 7 days</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💼</div>
            <div className="stat-content">
              <h3>Professions</h3>
              <p className="stat-number">{stats?.totalProfessions || 0}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏥</div>
            <div className="stat-content">
              <h3>Health Authorities</h3>
              <p className="stat-number">{stats?.totalHealthAuthorities || 0}</p>
            </div>
          </div>
        </div>

        {/* Charts and Analytics Section */}
        <div className="dashboard-sections">
          {/* Activity Chart */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Activity Overview (Last 7 Days)</h2>
            </div>
            <div className="activity-chart">
              <div className="chart-bars">
                {stats?.dailyActivity?.map((day, index) => (
                  <div key={index} className="chart-bar-container">
                    <div className="chart-bar-wrapper">
                      <div
                        className="chart-bar"
                        style={{
                          height: `${(day.count / maxActivity) * 100}%`,
                        }}
                        title={`${day.count} attempts on ${day.label}`}
                      >
                        <span className="chart-bar-value">{day.count}</span>
                      </div>
                    </div>
                    <div className="chart-label">{day.label.split(',')[0]}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="chart-stats">
              <div className="chart-stat-item">
                <span className="chart-stat-label">This Week:</span>
                <span className="chart-stat-value">{stats?.attemptsThisWeek || 0}</span>
              </div>
              <div className="chart-stat-item">
                <span className="chart-stat-label">This Month:</span>
                <span className="chart-stat-value">{stats?.attemptsThisMonth || 0}</span>
              </div>
            </div>
          </div>

          {/* Top Exams */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Most Popular Exams</h2>
            </div>
            <div className="top-exams-list">
              {stats?.topExams && stats.topExams.length > 0 ? (
                stats.topExams.map((exam, index) => (
                  <div key={exam.id} className="top-exam-item">
                    <div className="top-exam-rank">#{index + 1}</div>
                    <div className="top-exam-info">
                      <h4>{exam.title}</h4>
                      <p className="top-exam-type">{exam.exam_type}</p>
                    </div>
                    <div className="top-exam-count">
                      <span className="count-number">{exam.attemptCount}</span>
                      <span className="count-label">attempts</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">No exam attempts yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="dashboard-sections">
          {/* Recent Exam Attempts */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Exam Attempts</h2>
              <Link to="/admin/exams" className="view-all-link">View All →</Link>
            </div>
            <div className="recent-activity-list">
              {stats?.recentAttempts && stats.recentAttempts.length > 0 ? (
                stats.recentAttempts.slice(0, 5).map((attempt) => (
                  <div key={attempt.id} className="activity-item">
                    <div className="activity-icon">📝</div>
                    <div className="activity-content">
                      <div className="activity-main">
                        <strong>{attempt.user?.full_name || 'Unknown User'}</strong>
                        {' completed '}
                        <strong>{attempt.exam?.title || 'Exam'}</strong>
                      </div>
                      <div className="activity-details">
                        <div className="activity-metrics">
                          {attempt.dailyLimitPercentage !== null ? (
                            <>
                              <span className="activity-score">
                                Daily Limit: <strong>{attempt.dailyLimitPercentage.toFixed(1)}%</strong>
                                {' '}({attempt.correct_answers}/{attempt.dailyLimit})
                              </span>
                              <span className="activity-score-secondary">
                                Total: <strong>{attempt.totalPercentage.toFixed(1)}%</strong>
                                {' '}({attempt.correct_answers}/{attempt.total_questions})
                              </span>
                            </>
                          ) : (
                            <span className="activity-score">
                              Score: <strong>{attempt.totalPercentage.toFixed(1)}%</strong>
                              {' '}({attempt.correct_answers}/{attempt.total_questions})
                            </span>
                          )}
                          <span className="activity-answered">
                            Answered: {attempt.answeredCount}/{attempt.total_questions}
                          </span>
                        </div>
                        <span className="activity-time">
                          {new Date(attempt.completed_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className={`activity-badge ${attempt.dailyLimitPercentage !== null 
                      ? (attempt.dailyLimitPercentage >= 70 ? 'success' : attempt.dailyLimitPercentage >= 50 ? 'warning' : 'danger')
                      : (attempt.totalPercentage >= 70 ? 'success' : attempt.totalPercentage >= 50 ? 'warning' : 'danger')
                    }`}>
                      {attempt.dailyLimitPercentage !== null 
                        ? `${attempt.dailyLimitPercentage.toFixed(0)}%`
                        : `${attempt.totalPercentage.toFixed(0)}%`
                      }
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">No recent exam attempts</p>
              )}
            </div>
          </div>

          {/* New Users */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>New Users (This Week)</h2>
              <Link to="/admin/users" className="view-all-link">View All →</Link>
            </div>
            <div className="recent-activity-list">
              {stats?.newUsers && stats.newUsers.length > 0 ? (
                stats.newUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className="activity-item">
                    <div className="activity-icon">👤</div>
                    <div className="activity-content">
                      <div className="activity-main">
                        <strong>{user.full_name || 'Unknown'}</strong>
                      </div>
                      <div className="activity-details">
                        <span className="activity-email">{user.email}</span>
                        <span className="activity-time">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">No new users this week</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
