import { useQuery } from '@tanstack/react-query';
import { getAdminStats } from '../../utils/supabaseQueries';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['adminStats'],
    queryFn: getAdminStats,
    retry: 1,
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

  return (
    <Layout>
      <div className="admin-dashboard">
        <h1>Admin Dashboard</h1>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-number">{stats?.totalUsers || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Exams</h3>
            <p className="stat-number">{stats?.totalExams || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Attempts</h3>
            <p className="stat-number">{stats?.totalAttempts || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Professions</h3>
            <p className="stat-number">{stats?.totalProfessions || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Health Authorities</h3>
            <p className="stat-number">{stats?.totalHealthAuthorities || 0}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
