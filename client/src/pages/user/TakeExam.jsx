import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
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
  if (!user) {
    return <Navigate to="/login" />;
  }
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0); // overall exam timer
  const [startTime, setStartTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState(30); // per-question timer
  const [submittedQuestions, setSubmittedQuestions] = useState({}); // questionId -> submitted
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);
  const [submitContext, setSubmitContext] = useState('manual'); // 'manual' | 'time'

  const { data: examData, isLoading, error } = useQuery({
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

  const submitMutation = useMutation({
    mutationFn: async ({ answers, timeSpent }) => {
      if (!user?.id) throw new Error('Not logged in');
      return await submitExam(id, user.id, answers, timeSpent);
    },
    onSuccess: (results) => {
      navigate(`/exams/${id}/results`, { state: { results } });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit exam');
      setIsSubmitting(false);
    },
    onSettled: () => {
      // Always release the submitting state so the button recovers even if the mutation errors mid-way
      setIsSubmitting(false);
    },
  });

  useEffect(() => {
    if (examData?.exam) {
      const duration = examData.exam.duration * 60; // Convert to seconds
      setTimeRemaining(duration);
      setStartTime(Date.now());
    }
  }, [examData]);

  useEffect(() => {
    if (!startTime || !examData?.exam) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = examData.exam.duration * 60 - elapsed;
      setTimeRemaining(Math.max(0, remaining));

      if (remaining <= 0) {
        clearInterval(timer);
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, examData]);

  const handleAnswerChange = (questionId, answer) => {
    // Prevent changing answer after the question has been submitted
    if (submittedQuestions[questionId]) return;
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const getOptionText = (question, position) => {
    // position is 0, 1, 2, 3 corresponding to randomized options
    const optionKeys = ['a', 'b', 'c', 'd'];
    return question[`option_${optionKeys[position]}`];
  };

  const getOptionLabel = (position) => {
    // Return A, B, C, D labels for positions 0, 1, 2, 3
    return ['A', 'B', 'C', 'D'][position];
  };

  const handleAutoSubmit = () => {
    if (isSubmitting) return;
    openSubmitConfirmModal('time');
  };

  const performSubmit = () => {
    if (isSubmitting) return; // Prevent duplicate submissions/race conditions
    setIsSubmitting(true);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    // Map randomized positions (0-3) back to original option labels (A-D)
    const mappedAnswers = {};
    if (exam?.questions) {
      exam.questions.forEach((question) => {
        // Normalize question ID to string to ensure consistent storage
        let questionId = question.id;
        if (typeof questionId !== 'string') {
          questionId = String(questionId);
        }
        questionId = questionId.trim();
        
        const selectedPosition = answers[question.id];
        if (selectedPosition !== undefined && question.optionMapping) {
          // Convert position (0-3) to original option (A-D)
          mappedAnswers[questionId] = question.optionMapping[selectedPosition];
        } else if (selectedPosition !== undefined) {
          // Fallback: if no mapping, assume it's already in correct format
          mappedAnswers[questionId] = selectedPosition;
        }
      });
    }
    
    submitMutation.mutate({ answers: mappedAnswers, timeSpent });
  };

  const openSubmitConfirmModal = (context = 'manual') => {
    if (!examData?.exam) return;
    const unanswered = examData.exam.questions.filter((q) => answers[q.id] === undefined);
    setUnansweredCount(unanswered.length);
    setSubmitContext(context);
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    if (!isSubmitting) {
      performSubmit();
    }
  };

  const handleCancelSubmit = () => {
    // For automatic (time-based) submission, we don't allow cancelling
    if (submitContext === 'time') return;
    setShowConfirmModal(false);
  };

  const { exam, dailyUsage } = examData || {};
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = exam?.questions?.length || 0;
  const currentQuestion = exam?.questions?.[currentIndex];

  // Per-question 30 second timer
  useEffect(() => {
    if (!currentQuestion) return;

    // If question already submitted, no timer
    if (submittedQuestions[currentQuestion.id]) {
      setQuestionTimeRemaining(0);
      return;
    }

    setQuestionTimeRemaining(30);
    const start = Date.now();

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = 30 - elapsed;

      if (remaining <= 0) {
        clearInterval(timer);
        setQuestionTimeRemaining(0);
        // Auto-submit this question as "not answered" and move on
        setSubmittedQuestions((prev) => ({
          ...prev,
          [currentQuestion.id]: true,
        }));
        setCurrentIndex((prev) =>
          prev < totalQuestions - 1 ? prev + 1 : prev
        );
      } else {
        setQuestionTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, submittedQuestions, totalQuestions]);

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

  // Check for access errors first
  if (error) {
    if (error.message?.toLowerCase().includes('access')) {
      return (
        <Layout>
          <div className="take-exam">
            <div className="error-message">
              <h2>Access Denied</h2>
              <p>{error.message}</p>
              <button onClick={() => navigate('/exams')} className="btn-primary">
                Back to Exams
              </button>
            </div>
          </div>
        </Layout>
      );
    }
    // For other errors, show generic error
    return (
      <Layout>
        <div className="take-exam">
          <div className="error-message">
            <h2>Error</h2>
            <p>{error.message || 'Failed to load exam. Please try again later.'}</p>
            <button onClick={() => navigate('/exams')} className="btn-primary">
              Back to Exams
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!examData?.exam) {
    return (
      <Layout>
        <div className="take-exam">
          <div className="error-message">
            <h2>Exam Not Found</h2>
            <p>The exam you're looking for doesn't exist or is no longer available.</p>
            <button onClick={() => navigate('/exams')} className="btn-primary">
              Back to Exams
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleQuestionSubmit = (questionId) => {
    if (submittedQuestions[questionId]) return;
    setSubmittedQuestions((prev) => ({
      ...prev,
      [questionId]: true,
    }));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

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
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <span className="answered-count">
                ({answeredCount} / {totalQuestions} answered)
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
          {currentQuestion && (
            <div key={currentQuestion.id} className="question-card">
              <div className="question-header">
                <span className="question-number">Question {currentIndex + 1}</span>
                {answers[currentQuestion.id] && (
                  <span className="answered-badge">Answered</span>
                )}
                <span className="question-timer">
                  Time left for this question: {questionTimeRemaining}s
                </span>
              </div>

              <div className="question-section">
                <span className="section-label">Question</span>
                <p className="question-text">{currentQuestion.question}</p>
              </div>

              <div className="options-section">
                <span className="section-label">Options</span>
                <div className="options">
                  {[0, 1, 2, 3].map((position) => {
                    const optionLabel = getOptionLabel(position);
                    const isSelected = answers[currentQuestion.id] === position;
                    return (
                      <label
                        key={position}
                        className={`option-label ${isSelected ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={position}
                          checked={isSelected}
                          onChange={() => handleAnswerChange(currentQuestion.id, position)}
                          disabled={submittedQuestions[currentQuestion.id]}
                        />
                        <span className="option-letter">{optionLabel}.</span>
                        <span className="option-text">
                          {getOptionText(currentQuestion, position)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="question-actions">
                <button
                  type="button"
                  className="submit-answer-button"
                  onClick={() => handleQuestionSubmit(currentQuestion.id)}
                  disabled={submittedQuestions[currentQuestion.id] || answers[currentQuestion.id] === undefined}
                >
                  {submittedQuestions[currentQuestion.id]
                    ? 'Answer Submitted'
                    : 'Submit Answer'}
                </button>
              </div>

              {submittedQuestions[currentQuestion.id] && (
                <div
                  className={`question-feedback ${
                    answers[currentQuestion.id] !== undefined &&
                    answers[currentQuestion.id] === currentQuestion.randomizedCorrectAnswer
                      ? 'correct'
                      : 'incorrect'
                  }`}
                >
                  <p className="feedback-status">
                    {answers[currentQuestion.id] !== undefined
                      ? answers[currentQuestion.id] === currentQuestion.randomizedCorrectAnswer
                        ? 'Correct answer!'
                        : 'Incorrect answer.'
                      : 'Not answered.'}
                  </p>
                  {answers[currentQuestion.id] !== undefined &&
                    answers[currentQuestion.id] !== currentQuestion.randomizedCorrectAnswer &&
                    currentQuestion.randomizedCorrectAnswer !== undefined && (
                      <p className="feedback-answer">
                        Correct Option:{' '}
                        <strong>{getOptionLabel(currentQuestion.randomizedCorrectAnswer)}.</strong>{' '}
                        {getOptionText(currentQuestion, currentQuestion.randomizedCorrectAnswer)}
                      </p>
                    )}
                  {currentQuestion.explanation && (
                    <p className="feedback-explanation">{currentQuestion.explanation}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="exam-footer">
          <div className="navigation-buttons">
            <button
              type="button"
              className="nav-button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              Previous
            </button>
            <button
              type="button"
              className="nav-button"
              onClick={handleNext}
              disabled={currentIndex === totalQuestions - 1}
            >
              Next
            </button>
          </div>

          <div className="finish-exam-wrapper">
            <button
              type="button"
              onClick={() => openSubmitConfirmModal('manual')}
              disabled={isSubmitting}
              className="submit-button submit-button-small"
            >
              {isSubmitting ? 'Submitting...' : 'Finish Exam & Get Result'}
            </button>
          </div>
        </div>

        {showConfirmModal && (
          <div className="modal-overlay" onClick={handleCancelSubmit}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{submitContext === 'time' ? 'Time is up' : 'Confirm Exam Submission'}</h2>
              <p>
                {submitContext === 'time'
                  ? 'Your exam time has ended. Your exam will now be submitted.'
                  : unansweredCount > 0
                    ? `You have ${unansweredCount} unanswered questions. Are you sure you want to finish the exam and view your results?`
                    : 'You have answered all questions. Do you want to finish the exam and view your results?'}
              </p>
              <div className="modal-actions">
                {submitContext !== 'time' && (
                  <button type="button" className="btn-secondary" onClick={handleCancelSubmit}>
                    Cancel
                  </button>
                )}
                <button type="button" className="btn-primary" onClick={handleConfirmSubmit}>
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TakeExam;
