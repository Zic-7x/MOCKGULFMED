import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { canUserAccessEligibilityAssessment, getUserDashboard } from '../../utils/supabaseQueries';
import { getAnnualJobPortalQueryOptions } from '../../utils/annualJobPortalQuery';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import './UserDashboard.css';

// Crisp inline SVG Icons
const Icons = {
  Stethoscope: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  ),
  Building: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" />
      <path d="M12 10h.01" /><path d="M12 14h.01" />
      <path d="M16 10h.01" /><path d="M16 14h.01" />
      <path d="M8 10h.01" /><path d="M8 14h.01" />
    </svg>
  ),
  Award: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  ),
  BookOpen: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  BarChart3: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  FileCheck: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  ),
  Briefcase: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Users: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  PassBadge: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="14" x="3" y="5" rx="2" />
      <circle cx="9" cy="12" r="2" />
      <path d="M15 9h2" />
      <path d="M15 12h2" />
      <path d="M15 15h2" />
    </svg>
  ),
  Smartphone: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  CheckCircle2: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Target: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  ),
  Flame: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z" />
    </svg>
  ),
};

const UserDashboard = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['userDashboard', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await getUserDashboard(user.id);
    },
    enabled: !!user?.id,
  });

  const { data: eligibilityAccess } = useQuery({
    queryKey: ['eligibilityAssessmentAccess', user?.id],
    queryFn: () => canUserAccessEligibilityAssessment(user.id),
    enabled: !!user?.id,
  });

  const { data: jobPortalAnnual } = useQuery({
    ...getAnnualJobPortalQueryOptions(user?.id),
    enabled: !!user?.id,
  });

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  const { user: dashboardUser, recentAttempts, dailyUsage } = data || {};

  // Compute usage metrics
  const usedCount = dailyUsage?.used || 0;
  const limitCount = dailyUsage?.limit;
  const hasNoPlan = limitCount === 0;
  const hasPositiveLimit = typeof limitCount === 'number' && limitCount > 0;
  const remainingCount = hasPositiveLimit
    ? (dailyUsage?.remaining !== undefined && dailyUsage?.remaining !== null
        ? dailyUsage.remaining
        : Math.max(0, limitCount - usedCount))
    : 0;
  const usagePercentage = hasPositiveLimit ? Math.min(100, Math.round((usedCount / limitCount) * 100)) : 0;
  const isLimitReached = hasPositiveLimit && remainingCount <= 0;

  // Calculate summary metrics from recent attempts if available
  const totalAttemptsCount = recentAttempts?.length || 0;
  const averageScore = totalAttemptsCount > 0
    ? (recentAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / totalAttemptsCount).toFixed(1)
    : null;
  const bestScore = totalAttemptsCount > 0
    ? Math.max(...recentAttempts.map((a) => a.score || 0)).toFixed(1)
    : null;

  return (
    <Layout>
      <div className="user-dashboard-shell">
        {/* Welcome Header */}
        <section className="dashboard-hero-card">
          <div className="hero-welcome-content">
            <div className="hero-avatar-pill">
              <span className="hero-avatar-letter">
                {(dashboardUser?.fullName || user?.fullName || 'U').charAt(0).toUpperCase()}
              </span>
              <span className="hero-status-dot" title="Active Study Session" />
            </div>
            <div className="hero-text-block">
              <div className="hero-subtitle-row">
                <span className="hero-badge">Candidate Dashboard</span>
                {dashboardUser?.profession?.name && (
                  <span className="hero-tag">
                    <Icons.Stethoscope />
                    {dashboardUser.profession.name}
                  </span>
                )}
                {dashboardUser?.healthAuthority?.name && (
                  <span className="hero-tag">
                    <Icons.Building />
                    {dashboardUser.healthAuthority.name}
                  </span>
                )}
              </div>
              <h1 className="hero-title">
                Welcome, {dashboardUser?.fullName || user?.fullName}
              </h1>
              <p className="hero-description">
                Prepare for your Prometric &amp; Pearson VUE licensing exam with targeted daily questions, verified credentials, and performance analytics.
              </p>
            </div>
          </div>
          <div className="hero-cta-group">
            <Link to="/exams" className="hero-primary-cta">
              <Icons.BookOpen />
              <span>Start Mock Exam</span>
              <Icons.ArrowRight />
            </Link>
            <Link to="/results" className="hero-secondary-cta">
              <Icons.BarChart3 />
              <span>View Results</span>
            </Link>
          </div>
        </section>

        {/* Official Exam Banner (if enabled) */}
        {data?.officialExamProfileEnabled && (
          <section className="official-exam-banner">
            <div className="official-exam-badge">
              <Icons.PassBadge />
            </div>
            <div className="official-exam-body">
              <div className="official-exam-status-tag">CONFIRMED BOOKING &amp; PASS ACTIVE</div>
              <h2 className="official-exam-title">Official Exam Pass (Prometric / Pearson VUE)</h2>
              <p className="official-exam-desc">
                Your official examination booking profile and national verification details are verified. You can review your booking confirmation, identity IDs, and print your official exam pass.
              </p>
            </div>
            <Link to="/profile" className="official-exam-btn">
              <span>View Exam Pass</span>
              <Icons.ArrowRight />
            </Link>
          </section>
        )}

        {/* Top KPI / Status Grid */}
        <section className="kpi-grid">
          {/* Daily MCQ Usage Meter */}
          <div className="kpi-card kpi-card--usage">
            <div className="kpi-card-header">
              <div className="kpi-header-info">
                <span className="kpi-label">Today's MCQ Quota</span>
                <h2 className="kpi-title">Daily Practice Limit</h2>
              </div>
              <span
                className={`kpi-status-chip ${
                  hasNoPlan
                    ? 'chip-warning'
                    : isLimitReached
                      ? 'chip-danger'
                      : 'chip-primary'
                }`}
              >
                {hasNoPlan
                  ? 'No Active Plan'
                  : hasPositiveLimit
                    ? isLimitReached
                      ? 'Limit Reached'
                      : `${remainingCount} Remaining`
                    : 'Unlimited'}
              </span>
            </div>

            <div className="quota-stats-row">
              <div className="quota-metric">
                <span className="quota-num">{usedCount}</span>
                <span className="quota-sub">MCQs Used Today</span>
              </div>
              <div className="quota-divider" />
              <div className="quota-metric">
                <span className="quota-num">{hasNoPlan ? '0' : hasPositiveLimit ? limitCount : '∞'}</span>
                <span className="quota-sub">Daily Cap</span>
              </div>
              {hasPositiveLimit && (
                <>
                  <div className="quota-divider" />
                  <div className="quota-metric">
                    <span className={`quota-num ${isLimitReached ? 'text-danger' : 'text-primary'}`}>
                      {remainingCount}
                    </span>
                    <span className="quota-sub">Available Today</span>
                  </div>
                </>
              )}
            </div>

            {hasNoPlan ? (
              <div className="unlimited-quota-notice no-plan-notice flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Icons.BookOpen />
                  <span className="text-sm">No active package. Unlock mock exams with a plan.</span>
                </div>
                <Link
                  to="/packages"
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold whitespace-nowrap"
                >
                  View Packages →
                </Link>
              </div>
            ) : hasPositiveLimit ? (
              <div className="quota-progress-container">
                <div className="quota-progress-meta">
                  <span>Usage: {usagePercentage}%</span>
                  <span>Resets at 00:00 UTC</span>
                </div>
                <div className="quota-progress-track">
                  <div
                    className={`quota-progress-bar ${isLimitReached ? 'bar-danger' : usagePercentage > 75 ? 'bar-warning' : 'bar-primary'}`}
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="unlimited-quota-notice">
                <Icons.Sparkles />
                <span>You have unlimited MCQ practice access enabled on your account.</span>
              </div>
            )}
          </div>

          {/* User Profile & Examination Track */}
          <div className="kpi-card kpi-card--profile">
            <div className="kpi-card-header">
              <div className="kpi-header-info">
                <span className="kpi-label">Study Pathway</span>
                <h2 className="kpi-title">Your Profile &amp; Target</h2>
              </div>
              <Link to="/profile" className="kpi-edit-link">
                Edit Profile →
              </Link>
            </div>

            <div className="profile-details-list">
              <div className="profile-detail-item">
                <div className="detail-icon-box">
                  <Icons.Stethoscope />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Profession</span>
                  <span className="detail-value">{dashboardUser?.profession?.name || 'Not assigned'}</span>
                </div>
              </div>

              <div className="profile-detail-item">
                <div className="detail-icon-box">
                  <Icons.Building />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Target Health Authority</span>
                  <span className="detail-value">{dashboardUser?.healthAuthority?.name || 'Not assigned'}</span>
                </div>
              </div>

              <div className="profile-detail-item">
                <div className="detail-icon-box">
                  <Icons.Target />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Daily Limit Configuration</span>
                  <span className="detail-value">
                    {dashboardUser?.dailyMcqLimit ? `${dashboardUser.dailyMcqLimit} MCQs / day` : 'Unlimited practice'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Performance Snapshot (if user has attempts) */}
          <div className="kpi-card kpi-card--stats">
            <div className="kpi-card-header">
              <div className="kpi-header-info">
                <span className="kpi-label">Performance Overview</span>
                <h2 className="kpi-title">Mock Exam Stats</h2>
              </div>
              <span className="kpi-status-chip chip-neutral">
                {totalAttemptsCount} {totalAttemptsCount === 1 ? 'Attempt' : 'Attempts'}
              </span>
            </div>

            {totalAttemptsCount > 0 ? (
              <div className="exam-summary-grid">
                <div className="summary-stat-box">
                  <span className="summary-stat-num">{averageScore}%</span>
                  <span className="summary-stat-label">Average Score</span>
                </div>
                <div className="summary-stat-box">
                  <span className="summary-stat-num">{bestScore}%</span>
                  <span className="summary-stat-label">Highest Score</span>
                </div>
                <div className="summary-stat-box">
                  <span className="summary-stat-num">
                    {recentAttempts.filter((a) => a.score >= 70).length}
                  </span>
                  <span className="summary-stat-label">Passing Exams</span>
                </div>
              </div>
            ) : (
              <div className="no-stats-prompt">
                <div className="no-stats-icon">
                  <Icons.Award />
                </div>
                <p>Take your first mock exam to unlock personalized accuracy metrics and passing insights.</p>
                <Link to="/exams" className="no-stats-cta">
                  Start Practice →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions Hub */}
        <section className="hub-section">
          <div className="section-title-row">
            <div>
              <span className="section-eyebrow">Portal Services</span>
              <h2 className="section-heading">Quick Actions &amp; Workflows</h2>
            </div>
            <span className="section-note">Direct access to study tools, verification, and jobs</span>
          </div>

          <div className="hub-grid">
            {/* Take Exam */}
            <Link to="/exams" className="hub-card hub-card--primary">
              <div className="hub-card-top">
                <div className="hub-icon-container">
                  <Icons.BookOpen />
                </div>
                <span className="hub-badge hub-badge--primary">Exam Bank</span>
              </div>
              <div className="hub-card-body">
                <h3 className="hub-card-title">Take Mock Exam</h3>
                <p className="hub-card-desc">
                  Simulate Prometric, Pearson VUE, DHA, MOH, &amp; SCFHS tests with timed questions and realistic scoring.
                </p>
              </div>
              <div className="hub-card-footer">
                <span className="hub-card-link">Launch Practice</span>
                <Icons.ArrowRight />
              </div>
            </Link>

            {/* View Results */}
            <Link to="/results" className="hub-card">
              <div className="hub-card-top">
                <div className="hub-icon-container">
                  <Icons.BarChart3 />
                </div>
                <span className="hub-badge">Analytics</span>
              </div>
              <div className="hub-card-body">
                <h3 className="hub-card-title">View Results</h3>
                <p className="hub-card-desc">
                  Inspect comprehensive performance reports, review question explanations, and monitor cumulative progress.
                </p>
              </div>
              <div className="hub-card-footer">
                <span className="hub-card-link">Review History</span>
                <Icons.ArrowRight />
              </div>
            </Link>

            {/* Licensing & Dataflow Services */}
            <Link to="/services/licensing-dataflow" className="hub-card">
              <div className="hub-card-top">
                <div className="hub-icon-container">
                  <Icons.ShieldCheck />
                </div>
                <span className="hub-badge hub-badge--teal">Dataflow &amp; Licensure</span>
              </div>
              <div className="hub-card-body">
                <h3 className="hub-card-title">Licensing &amp; Dataflow Services</h3>
                <p className="hub-card-desc">
                  Upload credential documents for primary source verification (PSV) support and licensing processing across Gulf authorities.
                </p>
              </div>
              <div className="hub-card-footer">
                <span className="hub-card-link">Explore Services</span>
                <Icons.ArrowRight />
              </div>
            </Link>

            {/* Eligibility Assessment */}
            <Link
              to={eligibilityAccess?.allowed === false ? '/packages' : '/eligibility-assessment'}
              className="hub-card"
            >
              <div className="hub-card-top">
                <div className="hub-icon-container">
                  <Icons.FileCheck />
                </div>
                <span className={`hub-badge ${eligibilityAccess?.allowed === false ? 'hub-badge--warning' : 'hub-badge--success'}`}>
                  {eligibilityAccess?.allowed === false ? 'Upgrade Plan' : 'Assessment'}
                </span>
              </div>
              <div className="hub-card-body">
                <h3 className="hub-card-title">Eligibility Assessment</h3>
                <p className="hub-card-desc">
                  {eligibilityAccess?.allowed === false
                    ? 'Included on 3-month and annual plans — view packages to unlock formal qualification review.'
                    : eligibilityAccess?.allowed
                      ? 'Submit your medical degree, certificates, and experience documents for eligibility review.'
                      : 'Open the full assessment workflow to submit qualifications and documents for verification.'}
                </p>
              </div>
              <div className="hub-card-footer">
                <span className="hub-card-link">
                  {eligibilityAccess?.allowed === false ? 'View Packages' : 'Submit Qualifications'}
                </span>
                <Icons.ArrowRight />
              </div>
            </Link>

            {/* Job Portal */}
            {jobPortalAnnual ? (
              <>
                <Link to="/jobs" className="hub-card">
                  <div className="hub-card-top">
                    <div className="hub-icon-container">
                      <Icons.Briefcase />
                    </div>
                    <span className="hub-badge hub-badge--indigo">Active Plan</span>
                  </div>
                  <div className="hub-card-body">
                    <h3 className="hub-card-title">Healthcare Job Portal</h3>
                    <p className="hub-card-desc">
                      Browse open hospital &amp; clinic positions across Dubai, Abu Dhabi, and the GCC. Track applications and upload video reels.
                    </p>
                  </div>
                  <div className="hub-card-footer">
                    <span className="hub-card-link">Browse Jobs</span>
                    <Icons.ArrowRight />
                  </div>
                </Link>

                <Link to="/employer/jobs" className="hub-card">
                  <div className="hub-card-top">
                    <div className="hub-icon-container">
                      <Icons.Users />
                    </div>
                    <span className="hub-badge hub-badge--indigo">Recruiting</span>
                  </div>
                  <div className="hub-card-body">
                    <h3 className="hub-card-title">Employer &amp; Hiring Tools</h3>
                    <p className="hub-card-desc">
                      Post open healthcare listings, screen medical candidates, and review verified applicant profiles and intro reels.
                    </p>
                  </div>
                  <div className="hub-card-footer">
                    <span className="hub-card-link">Hiring Dashboard</span>
                    <Icons.ArrowRight />
                  </div>
                </Link>
              </>
            ) : (
              <Link to="/packages" className="hub-card hub-card--gated">
                <div className="hub-card-top">
                  <div className="hub-icon-container">
                    <Icons.Briefcase />
                  </div>
                  <span className="hub-badge hub-badge--warning">Annual Plan Exclusive</span>
                </div>
                <div className="hub-card-body">
                  <h3 className="hub-card-title">Healthcare Job Portal</h3>
                  <p className="hub-card-desc">
                    Included with an active <strong>annual (12-month)</strong> package. Upgrade to access Gulf job openings, direct applications, and applicant intro reels.
                  </p>
                </div>
                <div className="hub-card-footer">
                  <span className="hub-card-link">Unlock with Annual Plan</span>
                  <Icons.ArrowRight />
                </div>
              </Link>
            )}

            {/* Android App Direct Download */}
            <Link to="/download-app" className="hub-card" id="dashboard-android-app-card">
              <div className="hub-card-top">
                <div className="hub-icon-container" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                  <Icons.Smartphone />
                </div>
                <span className="hub-badge hub-badge--teal">Free Mobile APK</span>
              </div>
              <div className="hub-card-body">
                <h3 className="hub-card-title">Android App (Direct APK)</h3>
                <p className="hub-card-desc">
                  Download the MockGulfMed Android application directly to practice offline, eliminate browser bars, and test on the go.
                </p>
              </div>
              <div className="hub-card-footer">
                <span className="hub-card-link">Download APK (~1MB)</span>
                <Icons.ArrowRight />
              </div>
            </Link>
          </div>
        </section>

        {/* Recent Attempts Section */}
        <section className="recent-attempts-section">
          <div className="section-title-row">
            <div>
              <span className="section-eyebrow">Practice History</span>
              <h2 className="section-heading">Recent Exam Attempts</h2>
            </div>
            {recentAttempts && recentAttempts.length > 0 && (
              <Link to="/results" className="section-action-link">
                <span>View Full Results</span>
                <Icons.ArrowRight />
              </Link>
            )}
          </div>

          {recentAttempts && recentAttempts.length > 0 ? (
            <div className="attempts-card-list">
              {recentAttempts.map((attempt) => {
                const scoreValue = attempt.score || 0;
                const scoreClass = scoreValue >= 70 ? 'score-pass' : scoreValue >= 50 ? 'score-avg' : 'score-fail';
                const scoreLabel = scoreValue >= 70 ? 'Passed' : scoreValue >= 50 ? 'Review Needed' : 'Needs Practice';

                return (
                  <Link
                    key={attempt.id}
                    to={`/results/attempt/${attempt.id}`}
                    className="attempt-item-card"
                  >
                    <div className="attempt-main-header">
                      <div className="attempt-title-group">
                        <div className="attempt-type-tag">
                          {attempt.exam?.exam_type || 'MOCK EXAM'}
                        </div>
                        <h3 className="attempt-exam-title">{attempt.exam?.title}</h3>
                        <div className="attempt-meta-date">
                          <Icons.Clock />
                          <span>Completed on {new Date(attempt.completed_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}</span>
                        </div>
                      </div>

                      <div className="attempt-score-block">
                        <div className={`score-badge-large ${scoreClass}`}>
                          <span className="score-percentage">{scoreValue.toFixed(1)}%</span>
                          <span className="score-status-text">{scoreLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="attempt-metrics-grid">
                      {/* Metric 1: Main Score */}
                      {attempt.mainScore !== null && attempt.dailyLimit && (
                        <div className="attempt-metric-cell metric-cell--highlight">
                          <span className="metric-cell-label">Main Score (Daily Limit)</span>
                          <div className="metric-cell-value">
                            <strong>{attempt.mainScore.toFixed(1)}%</strong>
                            <span className="metric-cell-sub">
                              {attempt.correct_answers} / {attempt.dailyLimit} limit
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Metric 2: Attempt Overview */}
                      <div className="attempt-metric-cell">
                        <span className="metric-cell-label">Attempt Overview (All Sessions)</span>
                        <div className="metric-cell-value">
                          <strong>{attempt.attemptOverview.toFixed(1)}%</strong>
                          <span className="metric-cell-sub">
                            {attempt.cumulativeCorrectAnswers ?? attempt.correct_answers} / {attempt.cumulativeAnsweredQuestions ?? attempt.totalQuestionsAnswered} answered
                          </span>
                        </div>
                      </div>

                      {/* Metric 3: Overall Bank Result */}
                      <div className="attempt-metric-cell">
                        <span className="metric-cell-label">Exam Bank Coverage</span>
                        <div className="metric-cell-value">
                          <strong>{attempt.overallResult.toFixed(1)}%</strong>
                          <span className="metric-cell-sub">
                            {attempt.cumulativeCorrectAnswers ?? attempt.correct_answers} / {attempt.totalExamQuestions} total MCQs
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="attempt-card-footer">
                      <span className="review-action-tag">
                        <Icons.CheckCircle2 />
                        <span>Review answered MCQs &amp; explanations</span>
                      </span>
                      <span className="review-btn">
                        <span>Review</span>
                        <Icons.ArrowRight />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-attempts-state">
              <div className="empty-attempts-icon">
                <Icons.BookOpen />
              </div>
              <h3 className="empty-attempts-title">No Exam Attempts Yet</h3>
              <p className="empty-attempts-desc">
                Start practicing with our high-yield medical MCQ question banks to assess your exam readiness and track your scores.
              </p>
              <Link to="/exams" className="empty-attempts-cta">
                <Icons.BookOpen />
                <span>Browse &amp; Start Practice Exams</span>
              </Link>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default UserDashboard;
