import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAvailableExams } from '../../utils/supabaseQueries';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import './ExamList.css';

const ExamList = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  const { data: exams, isLoading, error } = useQuery({
    queryKey: ['availableExams', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await getAvailableExams(user.id);
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

  if (error) {
    toast.error('Failed to load exams');
    return (
      <Layout>
        <div className="exam-list">
          <h1>Available Exams</h1>
          <p>Error loading exams. Please try again later.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="exam-list">
        <h1>Available Exams</h1>
        {exams && exams.length === 0 ? (
          <div className="no-exams">
            <p>No exams available at the moment. Please contact admin for access.</p>
          </div>
        ) : (
          <div className="exams-grid">
            {exams?.map((exam) => (
              <div key={exam.id} className="exam-card">
                <div className="exam-header">
                  <h3>{exam.title}</h3>
                  <span className={`exam-type-badge ${exam.exam_type?.toLowerCase() || 'prometric'}`}>
                    {exam.exam_type}
                  </span>
                </div>
                {exam.description && (
                  <p className="exam-description">{exam.description}</p>
                )}
                <div className="exam-details">
                  <div className="detail-item">
                    <span className="detail-label">Total MCQs:</span>
                    <span className="detail-value">{exam._questionCount ?? exam.questions?.length ?? 0}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{exam.duration} minutes</span>
                  </div>
                </div>
                <Link to={`/exams/${exam.id}`} className="start-exam-button">
                  Start Exam
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExamList;
