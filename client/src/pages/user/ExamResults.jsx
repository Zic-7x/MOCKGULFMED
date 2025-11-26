import { useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAttempts } from '../../utils/supabaseQueries';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import './ExamResults.css';

const ExamResults = () => {
  const location = useLocation();
  const { id } = useParams();
  const { user } = useAuth();
  const resultsFromState = location.state?.results;

  const { data: attempts, isLoading } = useQuery({
    queryKey: ['userAttempts', user?.id, id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await getUserAttempts(user.id, id || null);
    },
    enabled: !!user?.id && !resultsFromState,
  });

  if (isLoading && !resultsFromState) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  // Show detailed results from just completed exam
  if (resultsFromState) {
    const { attempt, results, score, correctAnswers, totalQuestions } = resultsFromState;

    return (
      <Layout>
        <div className="exam-results">
          <div className="results-header">
            <h1>Exam Results</h1>
            <Link to="/exams" className="back-link">Back to Exams</Link>
          </div>

          <div className="score-summary">
            <div className="score-card">
              <h2>Your Score</h2>
              <div className={`score-value ${score >= 70 ? 'good' : score >= 50 ? 'average' : 'poor'}`}>
                {score.toFixed(1)}%
              </div>
              <p className="score-details">
                {correctAnswers} out of {totalQuestions} questions correct
              </p>
            </div>
            <div className="exam-info-card">
              <h3>{attempt.exam?.title}</h3>
              <p>Type: {attempt.exam?.exam_type}</p>
              <p>Completed: {new Date(attempt.completed_at).toLocaleString()}</p>
              <p>Time Spent: {Math.floor(attempt.time_spent / 60)} minutes</p>
            </div>
          </div>

          <div className="results-details">
            <h2>Question Review</h2>
            {results.map((result, index) => (
              <div
                key={index}
                className={`result-item ${result.isCorrect ? 'correct' : 'incorrect'}`}
              >
                <div className="result-header">
                  <span className="result-number">Question {index + 1}</span>
                  <span className={`result-status ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                    {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
                <p className="result-question">{result.question}</p>
                <div className="result-answers">
                  <div className="answer-item">
                    <span className="answer-label">Your Answer:</span>
                    <span className={`answer-value ${!result.isCorrect ? 'wrong' : ''}`}>
                      {result.userAnswer || 'Not answered'}
                    </span>
                  </div>
                  {!result.isCorrect && (
                    <div className="answer-item">
                      <span className="answer-label">Correct Answer:</span>
                      <span className="answer-value correct-answer">{result.correctAnswer}</span>
                    </div>
                  )}
                </div>
                {result.explanation && (
                  <div className="explanation">
                    <strong>Explanation:</strong> {result.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Show list of all attempts
  if (!attempts || attempts.length === 0) {
    return (
      <Layout>
        <div className="exam-results">
          <div className="results-header">
            <h1>{id ? 'Exam Attempts' : 'All Results'}</h1>
            <Link to="/exams" className="back-link">Back to Exams</Link>
          </div>
          <div className="no-results">
            <p>No exam attempts found.</p>
            <Link to="/exams" className="btn-primary">Take an Exam</Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="exam-results">
        <div className="results-header">
          <h1>{id ? 'Exam Attempts' : 'All Results'}</h1>
          <Link to="/exams" className="back-link">Back to Exams</Link>
        </div>
        <div className="attempts-list">
          {attempts.map((attempt) => (
            <div key={attempt.id} className="attempt-card">
              <div className="attempt-header">
                <h3>{attempt.exam?.title}</h3>
                <span className={`score-badge ${attempt.score >= 70 ? 'good' : attempt.score >= 50 ? 'average' : 'poor'}`}>
                  {attempt.score.toFixed(1)}%
                </span>
              </div>
              <div className="attempt-details">
                <div className="detail-row">
                  <span>Type: {attempt.exam?.exam_type}</span>
                  <span>{attempt.correct_answers}/{attempt.total_questions} correct</span>
                </div>
                <div className="detail-row">
                  <span>Completed: {new Date(attempt.completed_at).toLocaleString()}</span>
                  <span>Time: {Math.floor(attempt.time_spent / 60)} min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ExamResults;
