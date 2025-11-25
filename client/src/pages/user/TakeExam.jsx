import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { getExam, submitExam } from '../../utils/supabaseQueries';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import './TakeExam.css';

const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: examData, isLoading } = useQuery({
    queryKey: ['exam', id, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await getExam(id, user.id);
    },
    enabled: !!user?.id,
    onError: (error) => {
      if (error.message?.toLowerCase().includes('access')) {
        toast.error(error.message);
        navigate('/exams');
      }
    },
  });

  const submitMutation = useMutation(
    async ({ answers, timeSpent }) => {
      if (!user?.id) throw new Error('Not logged in');
      return await submitExam(id, user.id, answers, timeSpent);
    },
    {
      onSuccess: (results) => {
        navigate(`/exams/${id}/results`, { state: { results } });
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to submit exam');
        setIsSubmitting(false);
      },
    }
  );

  useEffect(() => {
    if (examData?.exam) {
      const duration = examData.exam.duration * 60; // Convert to seconds
      setTimeRemaining(duration);
      setStartTime(Date.now());
    }
  }, [examData]);

  useEffect(() => {
    if (timeRemaining > 0 && startTime) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = examData.exam.duration * 60 - elapsed;
        setTimeRemaining(Math.max(0, remaining));

        if (remaining <= 0) {
          handleAutoSubmit();
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, startTime, examData]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleAutoSubmit = () => {
    if (!isSubmitting) {
      toast.info('Time is up! Submitting your exam...');
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const unanswered = examData.exam.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      const confirm = window.confirm(
        `You have ${unanswered.length} unanswered questions. Are you sure you want to submit?`
      );
      if (!confirm) return;
    }

    setIsSubmitting(true);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    submitMutation.mutate({ answers, timeSpent });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!examData?.exam) {
    return (
      <Layout>
        <div className="take-exam">
          <p>Exam not found</p>
        </div>
      </Layout>
    );
  }

  const { exam, dailyUsage } = examData;
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = exam.questions.length;

  return (
    <Layout>
      <div className="take-exam">
        <div className="exam-header-bar">
          <div className="exam-title-section">
            <h1>{exam.title}</h1>
            <span className="exam-type">{exam.exam_type}</span>
          </div>
          <div className="exam-info-section">
            <div className="timer">
              <span className="timer-label">Time Remaining:</span>
              <span className={`timer-value ${timeRemaining < 300 ? 'warning' : ''}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <div className="progress-info">
              <span>
                {answeredCount} / {totalQuestions} answered
              </span>
            </div>
          </div>
        </div>

        {dailyUsage && dailyUsage.remaining !== null && (
          <div className="daily-usage-warning">
            <span>
              Daily MCQ Usage: {dailyUsage.mcqCount} / {dailyUsage.limit} (Remaining: {dailyUsage.remaining})
            </span>
          </div>
        )}

        <div className="questions-container">
          {exam.questions.map((question, index) => (
            <div key={question.id} className="question-card">
              <div className="question-header">
                <span className="question-number">Question {index + 1}</span>
                {answers[question.id] && (
                  <span className="answered-badge">Answered</span>
                )}
              </div>
              <p className="question-text">{question.question}</p>
              <div className="options">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <label
                    key={option}
                    className={`option-label ${answers[question.id] === option ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={() => handleAnswerChange(question.id, option)}
                    />
                    <span className="option-letter">{option}.</span>
                    <span className="option-text">{question[`option_${option.toLowerCase()}`]}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="exam-footer">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="submit-button"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default TakeExam;
