import { useLocation, useParams, Navigate } from 'react-router-dom';
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
  if (!user) {
    return <Navigate to="/login" />;
  }
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
    const {
      attempt,
      results,
      score,
      mainScore,
      attemptOverview,
      overallResult,
      correctAnswers,
      totalQuestionsAnswered,
      totalExamQuestions,
      answeredCount,
      dailyLimit,
    } = resultsFromState;

    const readinessThreshold = 80;
    // Use main score (or attempt overview if no daily limit) for readiness check
    const isReady = (mainScore !== null ? mainScore : attemptOverview) >= readinessThreshold;

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
                {mainScore !== null 
                  ? `${correctAnswers} out of ${dailyLimit} daily limit correct`
                  : `${correctAnswers} out of ${totalQuestionsAnswered} questions answered correct`
                }
              </p>
            </div>
            <div className="exam-info-card">
              <h3>{attempt.exam?.title}</h3>
              <p>Type: {attempt.exam?.exam_type}</p>
              <p>Completed: {new Date(attempt.completed_at).toLocaleString()}</p>
              <p>Time Spent: {Math.floor(attempt.time_spent / 60)} minutes</p>
            </div>
          </div>

          {/* Three Metrics System */}
          <div className="percentage-breakdown">
            {/* 1. Main Score: Correct / Daily Limit */}
            {mainScore !== null && (
              <div className="percentage-card main-score">
                <h3>Main Score</h3>
                <div className={`percentage-value ${mainScore >= 70 ? 'good' : mainScore >= 50 ? 'average' : 'poor'}`}>
                  {mainScore.toFixed(1)}%
                </div>
                <p className="percentage-details">
                  {correctAnswers} out of {dailyLimit} daily limit
                </p>
                <p className="percentage-label">Primary performance metric</p>
              </div>
            )}
            
            {/* 2. Attempt Overview: Cumulative Correct / Cumulative Questions Answered */}
            <div className="percentage-card attempt-overview">
              <h3>Attempt Overview</h3>
              <div className={`percentage-value ${attemptOverview >= 70 ? 'good' : attemptOverview >= 50 ? 'average' : 'poor'}`}>
                {attemptOverview.toFixed(1)}%
              </div>
              <p className="percentage-details">
                {resultsFromState.cumulativeCorrectAnswers ?? correctAnswers} out of {resultsFromState.cumulativeAnsweredQuestions ?? totalQuestionsAnswered} questions answered (all attempts)
              </p>
              <p className="percentage-label">Cumulative performance across all attempts</p>
            </div>

            {/* 3. Overall Result: Correct / Total MCQs in Database */}
            <div className="percentage-card overall-result">
              <h3>Overall Result</h3>
              <div className={`percentage-value ${overallResult >= 70 ? 'good' : overallResult >= 50 ? 'average' : 'poor'}`}>
                {overallResult.toFixed(1)}%
              </div>
              <p className="percentage-details">
                {correctAnswers} out of {totalExamQuestions} total MCQs in exam
              </p>
              <p className="percentage-label">Progress against entire exam pool</p>
            </div>
          </div>

          {/* Readiness message */}
          <div className={`readiness-banner ${isReady ? 'ready' : 'not-ready'}`}>
            <div className="readiness-message">
              {isReady ? (
                <>
                  <span className="celebrate">🎉</span> You're ready for your exam!
                </>
              ) : (
                <>
                  Keep practicing — aim for {readinessThreshold}%+ to unlock your exam.
                </>
              )}
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
                  <span
                    className={`score-badge ${attempt.score >= 70 ? 'good' : attempt.score >= 50 ? 'average' : 'poor'}`}
                  >
                    {attempt.score.toFixed(1)}%
                  </span>
              </div>
              <div className="attempt-details">
                  <div className="detail-row">
                    <span>Type: {attempt.exam?.exam_type}</span>
                  </div>
                  {/* Main Score: Correct / Daily Limit */}
                  {attempt.mainScore !== null && attempt.dailyLimit && (
                    <div className="detail-row main-metric">
                      <strong>Main Score:</strong> {attempt.mainScore.toFixed(1)}% 
                      ({attempt.correct_answers} out of {attempt.dailyLimit} daily limit)
                    </div>
                  )}
                  {/* Attempt Overview: Cumulative Correct / Cumulative Questions Answered */}
                  <div className="detail-row">
                    <strong>Attempt Overview:</strong> {attempt.attemptOverview.toFixed(1)}% 
                    ({attempt.cumulativeCorrectAnswers ?? attempt.correct_answers} out of {attempt.cumulativeAnsweredQuestions ?? attempt.totalQuestionsAnswered} questions answered in all attempts)
                  </div>
                  {/* Overall Result: Correct / Total MCQs in Database */}
                  <div className="detail-row">
                    <strong>Overall Result:</strong> {attempt.overallResult.toFixed(1)}% 
                    ({attempt.correct_answers} out of {attempt.totalExamQuestions} total MCQs in exam)
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
