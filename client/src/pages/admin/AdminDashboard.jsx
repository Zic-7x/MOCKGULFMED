import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAdminStats } from '../../utils/supabaseQueries';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import './AdminDashboard.css';

// Crisp inline SVG Icons for Admin
const AdminIcons = {
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  FileText: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Lock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Briefcase: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Building2: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
    </svg>
  ),
  BarChart2: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Target: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Flame: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z" />
    </svg>
  ),
  CreditCard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  ),
  Clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  ),
  RefreshCw: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  ),
};

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
          <div className="admin-header-card">
            <h1>Admin Dashboard</h1>
            <div className="admin-error-banner">
              <p><strong>Error loading dashboard data:</strong></p>
              <p>{error.message || 'Failed to load statistics. Please try refreshing the page.'}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Calculate max count for chart scaling
  const maxActivity = Math.max(...(stats?.dailyActivity?.map(d => d.count) || [0]), 1);

  return (
    <Layout>
      <div className="admin-dashboard-shell">
        {/* Admin Header */}
        <div className="admin-header-card">
          <div className="admin-header-main">
            <div className="admin-badge-row">
              <span className="admin-role-badge">System Administrator</span>
              <span className="admin-live-pill">
                <AdminIcons.RefreshCw />
                <span>Live sync active (30s)</span>
              </span>
            </div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">
              Comprehensive metrics, candidate attempts, subscription intents, and curriculum management.
            </p>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="admin-actions-grid">
          <Link to="/admin/users" className="admin-action-btn">
            <div className="action-btn-icon">
              <AdminIcons.Users />
            </div>
            <div className="action-btn-text">
              <span className="action-btn-title">Manage Users</span>
              <span className="action-btn-sub">Profiles &amp; Quotas</span>
            </div>
          </Link>
          <Link to="/admin/exams" className="admin-action-btn">
            <div className="action-btn-icon">
              <AdminIcons.FileText />
            </div>
            <div className="action-btn-text">
              <span className="action-btn-title">Manage Exams</span>
              <span className="action-btn-sub">Banks &amp; Questions</span>
            </div>
          </Link>
          <Link to="/admin/access" className="admin-action-btn">
            <div className="action-btn-icon">
              <AdminIcons.Lock />
            </div>
            <div className="action-btn-text">
              <span className="action-btn-title">Access Control</span>
              <span className="action-btn-sub">Grants &amp; Rules</span>
            </div>
          </Link>
          <Link to="/admin/professions" className="admin-action-btn">
            <div className="action-btn-icon">
              <AdminIcons.Briefcase />
            </div>
            <div className="action-btn-text">
              <span className="action-btn-title">Professions</span>
              <span className="action-btn-sub">Categories</span>
            </div>
          </Link>
          <Link to="/admin/health-authorities" className="admin-action-btn">
            <div className="action-btn-icon">
              <AdminIcons.Building2 />
            </div>
            <div className="action-btn-text">
              <span className="action-btn-title">Health Authorities</span>
              <span className="action-btn-sub">DHA, MOH, SCFHS</span>
            </div>
          </Link>
          <Link to="/admin/tickets" className="admin-action-btn">
            <div className="action-btn-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <AdminIcons.CheckCircle />
            </div>
            <div className="action-btn-text">
              <span className="action-btn-title">Support Queries</span>
              <span className="action-btn-sub">Candidate SLAs</span>
            </div>
          </Link>
        </div>

        {/* Main Stats Grid */}
        <div className="admin-stats-grid">
          <div className="stat-card stat-card--primary">
            <div className="stat-icon-wrap">
              <AdminIcons.Users />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Users</span>
              <span className="stat-value">{stats?.totalUsers || 0}</span>
              <span className="stat-trend positive">
                +{stats?.newUsersThisWeek || 0} this week
              </span>
            </div>
          </div>

          <div className="stat-card stat-card--primary">
            <div className="stat-icon-wrap">
              <AdminIcons.FileText />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Exams</span>
              <span className="stat-value">{stats?.totalExams || 0}</span>
              <span className="stat-sub">Active question banks</span>
            </div>
          </div>

          <div className="stat-card stat-card--primary">
            <div className="stat-icon-wrap">
              <AdminIcons.BarChart2 />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Attempts</span>
              <span className="stat-value">{stats?.totalAttempts || 0}</span>
              <span className="stat-trend positive">
                {stats?.attemptsToday || 0} today
              </span>
            </div>
          </div>

          <div className="stat-card stat-card--success">
            <div className="stat-icon-wrap icon-success">
              <AdminIcons.CheckCircle />
            </div>
            <div className="stat-info">
              <span className="stat-label">Average Score</span>
              <span className="stat-value">{stats?.averageScore?.toFixed(1) || '0.0'}%</span>
              <span className="stat-sub">Across all submissions</span>
            </div>
          </div>

          <div className="stat-card stat-card--success">
            <div className="stat-icon-wrap icon-success">
              <AdminIcons.Target />
            </div>
            <div className="stat-info">
              <span className="stat-label">Pass Rate</span>
              <span className="stat-value">{stats?.passRate?.toFixed(1) || '0.0'}%</span>
              <span className="stat-sub">Score &ge; 70% threshold</span>
            </div>
          </div>

          <div className="stat-card stat-card--info">
            <div className="stat-icon-wrap icon-info">
              <AdminIcons.Flame />
            </div>
            <div className="stat-info">
              <span className="stat-label">Active Users</span>
              <span className="stat-value">{stats?.activeUsers || 0}</span>
              <span className="stat-sub">Active in last 7 days</span>
            </div>
          </div>

          <div className="stat-card stat-card--amber">
            <div className="stat-icon-wrap icon-amber">
              <AdminIcons.Clock />
            </div>
            <div className="stat-info">
              <span className="stat-label">Pending Payments</span>
              <span className="stat-value">{stats?.pendingPayments || 0}</span>
              <span className="stat-sub">Intents awaiting checkout</span>
            </div>
          </div>

          <div className="stat-card stat-card--success">
            <div className="stat-icon-wrap icon-success">
              <AdminIcons.CreditCard />
            </div>
            <div className="stat-info">
              <span className="stat-label">Paid Users</span>
              <span className="stat-value">{stats?.paidUsers || 0}</span>
              <span className="stat-trend positive">
                {stats?.readyIntents || 0} ready intents
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap">
              <AdminIcons.Briefcase />
            </div>
            <div className="stat-info">
              <span className="stat-label">Professions</span>
              <span className="stat-value">{stats?.totalProfessions || 0}</span>
              <span className="stat-sub">Medical categories</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap">
              <AdminIcons.Building2 />
            </div>
            <div className="stat-info">
              <span className="stat-label">Health Authorities</span>
              <span className="stat-value">{stats?.totalHealthAuthorities || 0}</span>
              <span className="stat-sub">GCC boards</span>
            </div>
          </div>
        </div>

        {/* Charts and Analytics Section */}
        <div className="admin-panels-row">
          {/* Activity Chart */}
          <div className="admin-panel">
            <div className="panel-header">
              <div>
                <span className="panel-eyebrow">Weekly Velocity</span>
                <h2 className="panel-title">Activity Overview (Last 7 Days)</h2>
              </div>
              <div className="panel-pill-badge">
                {stats?.attemptsThisWeek || 0} Attempts This Week
              </div>
            </div>

            <div className="activity-chart-container">
              <div className="chart-bars-track">
                {stats?.dailyActivity?.map((day, index) => {
                  const barPercent = Math.max(8, Math.round((day.count / maxActivity) * 100));
                  return (
                    <div key={index} className="chart-bar-column">
                      <div className="chart-bar-slot">
                        <div
                          className="chart-bar-fill"
                          style={{ height: `${barPercent}%` }}
                          title={`${day.count} attempts on ${day.label}`}
                        >
                          <span className="chart-bar-tooltip">{day.count}</span>
                        </div>
                      </div>
                      <span className="chart-bar-day">{day.label.split(',')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="chart-footer-metrics">
              <div className="chart-footer-item">
                <span className="footer-metric-label">This Week</span>
                <span className="footer-metric-val">{stats?.attemptsThisWeek || 0}</span>
              </div>
              <div className="chart-footer-divider" />
              <div className="chart-footer-item">
                <span className="footer-metric-label">This Month</span>
                <span className="footer-metric-val">{stats?.attemptsThisMonth || 0}</span>
              </div>
            </div>
          </div>

          {/* Top Exams */}
          <div className="admin-panel">
            <div className="panel-header">
              <div>
                <span className="panel-eyebrow">Curriculum Popularity</span>
                <h2 className="panel-title">Most Popular Exams</h2>
              </div>
            </div>

            <div className="top-exams-feed">
              {stats?.topExams && stats.topExams.length > 0 ? (
                stats.topExams.map((exam, index) => (
                  <div key={exam.id} className="top-exam-row">
                    <div className={`top-exam-rank-pill ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : ''}`}>
                      #{index + 1}
                    </div>
                    <div className="top-exam-meta">
                      <h4 className="top-exam-name">{exam.title}</h4>
                      <span className="top-exam-tag">{exam.exam_type}</span>
                    </div>
                    <div className="top-exam-stat">
                      <span className="exam-attempt-number">{exam.attemptCount}</span>
                      <span className="exam-attempt-label">attempts</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="admin-empty-state">
                  <p>No exam attempts recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="admin-panels-row">
          {/* Recent Exam Attempts */}
          <div className="admin-panel">
            <div className="panel-header">
              <div>
                <span className="panel-eyebrow">Real-Time Submissions</span>
                <h2 className="panel-title">Recent Exam Attempts</h2>
              </div>
              <Link to="/admin/exams" className="panel-view-all">
                <span>View All Exams</span>
                <AdminIcons.ArrowRight />
              </Link>
            </div>

            <div className="admin-activity-feed">
              {stats?.recentAttempts && stats.recentAttempts.length > 0 ? (
                stats.recentAttempts.slice(0, 5).map((attempt) => {
                  const scoreNum = attempt.score || 0;
                  const scoreBadgeClass = scoreNum >= 70 ? 'badge-pass' : scoreNum >= 50 ? 'badge-avg' : 'badge-fail';

                  return (
                    <div key={attempt.id} className="admin-activity-card">
                      <div className="activity-main-info">
                        <div className="activity-user-header">
                          <span className="activity-user-name">
                            {attempt.user?.full_name || 'Candidate'}
                          </span>
                          <span className="activity-action-label">completed</span>
                          <span className="activity-exam-name">
                            {attempt.exam?.title || 'Exam'}
                          </span>
                        </div>

                        <div className="activity-metrics-strip">
                          {attempt.mainScore !== null && attempt.dailyLimit && (
                            <span className="activity-metric-pill">
                              <strong>Main Score:</strong> {attempt.mainScore.toFixed(1)}% ({attempt.correct_answers}/{attempt.dailyLimit})
                            </span>
                          )}
                          <span className="activity-metric-pill">
                            <strong>Accuracy:</strong> {attempt.attemptOverview.toFixed(1)}% ({attempt.cumulativeCorrectAnswers ?? attempt.correct_answers}/{attempt.cumulativeAnsweredQuestions ?? attempt.totalQuestionsAnswered})
                          </span>
                          <span className="activity-metric-pill">
                            <strong>Bank Coverage:</strong> {attempt.overallResult.toFixed(1)}% ({attempt.cumulativeCorrectAnswers ?? attempt.correct_answers}/{attempt.totalExamQuestions})
                          </span>
                        </div>

                        <span className="activity-timestamp">
                          {new Date(attempt.completed_at).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>

                      <div className={`activity-score-badge ${scoreBadgeClass}`}>
                        {scoreNum.toFixed(0)}%
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="admin-empty-state">
                  <p>No recent exam attempts found.</p>
                </div>
              )}
            </div>
          </div>

          {/* New Users */}
          <div className="admin-panel">
            <div className="panel-header">
              <div>
                <span className="panel-eyebrow">User Registrations</span>
                <h2 className="panel-title">New Users (This Week)</h2>
              </div>
              <Link to="/admin/users" className="panel-view-all">
                <span>Manage Users</span>
                <AdminIcons.ArrowRight />
              </Link>
            </div>

            <div className="admin-activity-feed">
              {stats?.newUsers && stats.newUsers.length > 0 ? (
                stats.newUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className="admin-user-card">
                    <div className="admin-user-avatar">
                      {(user.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="admin-user-meta">
                      <strong className="admin-user-name">{user.full_name || 'Unnamed Candidate'}</strong>
                      <span className="admin-user-email">{user.email}</span>
                      <span className="admin-user-date">
                        Joined {new Date(user.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="admin-empty-state">
                  <p>No new users registered this week.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
