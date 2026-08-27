import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Grid,
  Type,
  AlertCircle,
  Award,
  ShieldCheck,
  Send,
  Flag,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
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
  const [flaggedQuestions, setFlaggedQuestions] = useState({}); // questionId -> boolean
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPaletteModal, setShowPaletteModal] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);
  const [submitContext, setSubmitContext] = useState('manual'); // 'manual' | 'time'
  const [fontSize, setFontSize] = useState('normal'); // 'normal' | 'large' | 'xlarge'

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
    mutationFn: async ({ answers, timeSpent, clientCorrectCount }) => {
      if (!user?.id) throw new Error('Not logged in');
      return await submitExam(id, user.id, answers, timeSpent, clientCorrectCount);
    },
    onSuccess: (results) => {
      navigate(`/exams/${id}/results`, { state: { results } });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit exam');
      setIsSubmitting(false);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  useEffect(() => {
    if (examData?.exam) {
      const duration = (examData.exam.duration || 60) * 60; // Convert to seconds
      setTimeRemaining(duration);
      setStartTime(Date.now());
    }
  }, [examData]);

  const handleAutoSubmit = useCallback(() => {
    if (isSubmitting) return;
    openSubmitConfirmModal('time');
  }, [isSubmitting]);

  useEffect(() => {
    if (!startTime || !examData?.exam) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = (examData.exam.duration || 60) * 60 - elapsed;
      setTimeRemaining(Math.max(0, remaining));

      if (remaining <= 0) {
        clearInterval(timer);
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, examData, handleAutoSubmit]);

  const { exam, dailyUsage } = examData || {};
  const totalQuestions = exam?.questions?.length || 0;
  const currentQuestion = exam?.questions?.[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flaggedQuestions).filter(Boolean).length;

  const handleAnswerChange = (questionId, answerPosition) => {
    // Prevent changing answer after the question has been submitted
    if (submittedQuestions[questionId]) return;
    setAnswers((prev) => ({ ...prev, [questionId]: answerPosition }));
  };

  const toggleFlag = (questionId) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const getOptionText = (question, position) => {
    if (!question) return '';
    const optionKeys = ['a', 'b', 'c', 'd'];
    return question[`option_${optionKeys[position]}`] || '';
  };

  const getOptionLabel = (position) => {
    return ['A', 'B', 'C', 'D'][position];
  };

  const performSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    const mappedAnswers = {};
    let clientCorrectCount = 0;

    if (exam?.questions) {
      exam.questions.forEach((question) => {
        let questionId = question.id;
        if (typeof questionId !== 'string') {
          questionId = String(questionId);
        }
        questionId = questionId.trim();

        const selectedPosition = answers[question.id];
        if (selectedPosition !== undefined) {
          if (question.optionMapping) {
            mappedAnswers[questionId] = question.optionMapping[selectedPosition];
          } else {
            mappedAnswers[questionId] = selectedPosition;
          }

          if (
            typeof question.randomizedCorrectAnswer === 'number' &&
            selectedPosition === question.randomizedCorrectAnswer
          ) {
            clientCorrectCount += 1;
          }
        }
      });
    }

    submitMutation.mutate({ answers: mappedAnswers, timeSpent, clientCorrectCount });
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
    if (submitContext === 'time') return;
    setShowConfirmModal(false);
  };

  // Per-question 30 second timer
  useEffect(() => {
    if (!currentQuestion) return;

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
        setSubmittedQuestions((prev) => ({
          ...prev,
          [currentQuestion.id]: true,
        }));
        setCurrentIndex((prev) => (prev < totalQuestions - 1 ? prev + 1 : prev));
      } else {
        setQuestionTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, submittedQuestions, totalQuestions]);

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

  const jumpToQuestion = (index) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentIndex(index);
      setShowPaletteModal(false);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in a modal or input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (showConfirmModal || showPaletteModal) return;

      if (currentQuestion && !submittedQuestions[currentQuestion.id]) {
        if (e.key === 'a' || e.key === 'A' || e.key === '1') {
          handleAnswerChange(currentQuestion.id, 0);
        } else if (e.key === 'b' || e.key === 'B' || e.key === '2') {
          handleAnswerChange(currentQuestion.id, 1);
        } else if (e.key === 'c' || e.key === 'C' || e.key === '3') {
          handleAnswerChange(currentQuestion.id, 2);
        } else if (e.key === 'd' || e.key === 'D' || e.key === '4') {
          handleAnswerChange(currentQuestion.id, 3);
        } else if (e.key === 'Enter' && answers[currentQuestion.id] !== undefined) {
          handleQuestionSubmit(currentQuestion.id);
        }
      }

      if (e.key === 'f' || e.key === 'F') {
        if (currentQuestion) toggleFlag(currentQuestion.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, submittedQuestions, answers, showConfirmModal, showPaletteModal]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = useMemo(() => {
    if (totalQuestions === 0) return 0;
    return Math.round((answeredCount / totalQuestions) * 100);
  }, [answeredCount, totalQuestions]);

  const toggleFontSize = () => {
    setFontSize((prev) => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'xlarge';
      return 'normal';
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="take-exam" id="take-exam-error">
          <div className="error-card">
            <AlertCircle size={44} className="text-amber-500 mb-3" />
            <h2>Access Restricted or Load Failed</h2>
            <p>{error.message || 'Failed to load exam. Please try again later.'}</p>
            <button onClick={() => navigate('/exams')} className="btn-primary-return">
              <ChevronLeft size={16} /> Return to Exam List
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!examData?.exam) {
    return (
      <Layout>
        <div className="take-exam" id="take-exam-not-found">
          <div className="error-card">
            <HelpCircle size={44} className="text-slate-400 mb-3" />
            <h2>Exam Not Found</h2>
            <p>The requested exam module could not be found or is no longer accessible.</p>
            <button onClick={() => navigate('/exams')} className="btn-primary-return">
              <ChevronLeft size={16} /> Return to Exam List
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const isCurrentFlagged = currentQuestion ? !!flaggedQuestions[currentQuestion.id] : false;
  const isCurrentSubmitted = currentQuestion ? !!submittedQuestions[currentQuestion.id] : false;
  const isCurrentCorrect =
    currentQuestion &&
    answers[currentQuestion.id] !== undefined &&
    answers[currentQuestion.id] === currentQuestion.randomizedCorrectAnswer;

  return (
    <Layout>
      <div className={`take-exam font-scale-${fontSize}`} id="take-exam-wrapper">
        {/* Top Control & Status Bar */}
        <div className="exam-header-bar" id="exam-header-bar">
          <div className="exam-header-left">
            <div className="exam-title-pill">
              <span className="exam-type-tag">{exam.exam_type || 'PROMETRIC'}</span>
              <h1 title={exam.title}>{exam.title}</h1>
            </div>
            <div className="exam-progress-tracker">
              <span className="question-count-text">
                Question <strong>{currentIndex + 1}</strong> of {totalQuestions}
              </span>
              <div className="progress-bar-track" title={`${progressPercent}% Completed`}>
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="answered-tally-pill">
                {answeredCount}/{totalQuestions} Answered
              </span>
            </div>
          </div>

          <div className="exam-header-right">
            {/* Overall Exam Timer */}
            <div className={`exam-timer-card ${timeRemaining < 300 ? 'timer-urgent' : ''}`} id="overall-timer">
              <Clock size={18} className="timer-icon" />
              <div className="timer-texts">
                <span className="timer-label">Exam Timer</span>
                <span className="timer-value">{formatTime(timeRemaining)}</span>
              </div>
            </div>

            {/* Quick Tools: Text size & Question Palette */}
            <div className="exam-quick-tools">
              <button
                type="button"
                className="tool-btn"
                onClick={toggleFontSize}
                title={`Text size: ${fontSize.toUpperCase()} (Click to toggle)`}
                aria-label="Toggle text size"
                id="toggle-font-size-btn"
              >
                <Type size={16} />
                <span className="tool-btn-label">{fontSize === 'normal' ? 'A' : fontSize === 'large' ? 'A+' : 'A++'}</span>
              </button>

              <button
                type="button"
                className="tool-btn tool-btn--palette"
                onClick={() => setShowPaletteModal(true)}
                title="Open Question Palette"
                id="open-question-palette-btn"
              >
                <Grid size={16} />
                <span className="tool-btn-label">Questions</span>
                {flaggedCount > 0 && (
                  <span className="flag-badge-pill">{flaggedCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Daily Allowance Notice if present */}
        {dailyUsage && dailyUsage.remaining !== null && (
          <div className="daily-usage-warning" id="daily-usage-bar">
            <ShieldCheck size={16} />
            <span>
              Daily MCQ Allowance: <strong>{dailyUsage.mcqCount}</strong> / {dailyUsage.limit} questions solved today ({dailyUsage.remaining} remaining).
            </span>
          </div>
        )}

        {/* Main Question Display Arena */}
        <div className="questions-container" id="question-arena">
          {currentQuestion && (
            <div key={currentQuestion.id} className="question-card" id={`q-card-${currentQuestion.id}`}>
              {/* Question Subheader */}
              <div className="question-card-header">
                <div className="question-meta-left">
                  <span className="question-badge">Question {currentIndex + 1}</span>
                  {answers[currentQuestion.id] !== undefined && (
                    <span className="status-badge status-badge--answered">
                      <CheckCircle2 size={13} /> Selected
                    </span>
                  )}
                  {isCurrentSubmitted && (
                    <span className="status-badge status-badge--submitted">
                      Locked
                    </span>
                  )}
                </div>

                <div className="question-meta-right">
                  {/* Flag button */}
                  <button
                    type="button"
                    className={`flag-toggle-btn ${isCurrentFlagged ? 'flagged' : ''}`}
                    onClick={() => toggleFlag(currentQuestion.id)}
                    title={isCurrentFlagged ? 'Remove review flag (Press F)' : 'Flag for review (Press F)'}
                    id="flag-question-btn"
                  >
                    <Bookmark size={15} />
                    <span>{isCurrentFlagged ? 'Flagged for Review' : 'Flag Question'}</span>
                  </button>

                  {/* 30s Pace countdown */}
                  {!isCurrentSubmitted && (
                    <div
                      className={`question-pace-timer ${questionTimeRemaining <= 5 ? 'pace-urgent' : ''}`}
                      title="Prometric practice pacing: 30 seconds per question recommended"
                    >
                      <Clock size={14} />
                      <span>{questionTimeRemaining}s Pace</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Case / Question Text */}
              <div className="question-section">
                <div className="section-label-bar">
                  <span className="section-label">Clinical Scenario &amp; Question</span>
                  <span className="shortcut-hint">Shortcuts: A, B, C, D / 1, 2, 3, 4</span>
                </div>
                <div className="question-text-box">
                  <p className="question-text">{currentQuestion.question}</p>
                </div>
              </div>

              {/* Options Radio List */}
              <div className="options-section">
                <span className="section-label">Select the best answer:</span>
                <div className="options-grid">
                  {[0, 1, 2, 3].map((position) => {
                    const optionLabel = getOptionLabel(position);
                    const isSelected = answers[currentQuestion.id] === position;
                    const optionText = getOptionText(currentQuestion, position);

                    return (
                      <label
                        key={position}
                        className={`option-label ${isSelected ? 'selected' : ''} ${
                          isCurrentSubmitted ? 'disabled-option' : ''
                        }`}
                        id={`option-${currentQuestion.id}-${position}`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={position}
                          checked={isSelected}
                          onChange={() => handleAnswerChange(currentQuestion.id, position)}
                          disabled={isCurrentSubmitted}
                        />
                        <span className="option-letter-badge">{optionLabel}</span>
                        <span className="option-text-content">{optionText}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit / Check Answer Button */}
              <div className="question-actions">
                <button
                  type="button"
                  className="submit-answer-button"
                  onClick={() => handleQuestionSubmit(currentQuestion.id)}
                  disabled={isCurrentSubmitted || answers[currentQuestion.id] === undefined}
                  id="submit-single-answer-btn"
                >
                  {isCurrentSubmitted ? (
                    <>
                      <CheckCircle2 size={16} /> Rationale Unlocked
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Submit &amp; Verify Answer
                    </>
                  )}
                </button>
              </div>

              {/* Detailed Rationale & Medical Feedback Box */}
              {isCurrentSubmitted && (
                <div
                  className={`question-feedback ${isCurrentCorrect ? 'correct' : 'incorrect'}`}
                  id="question-feedback-box"
                >
                  <div className="feedback-headline">
                    {isCurrentCorrect ? (
                      <>
                        <CheckCircle2 size={20} className="text-emerald-600" />
                        <span className="feedback-status font-bold text-emerald-800">
                          Correct Answer! Well done.
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle size={20} className="text-rose-600" />
                        <span className="feedback-status font-bold text-rose-800">
                          {answers[currentQuestion.id] !== undefined
                            ? 'Incorrect Selection'
                            : 'Time Expired - Not Answered'}
                        </span>
                      </>
                    )}
                  </div>

                  {!isCurrentCorrect && currentQuestion.randomizedCorrectAnswer !== undefined && (
                    <div className="feedback-correct-callout">
                      <span className="callout-label">Official Correct Choice:</span>
                      <div className="callout-content">
                        <strong>Option {getOptionLabel(currentQuestion.randomizedCorrectAnswer)}:</strong>{' '}
                        {getOptionText(currentQuestion, currentQuestion.randomizedCorrectAnswer)}
                      </div>
                    </div>
                  )}

                  {currentQuestion.explanation && (
                    <div className="feedback-explanation-box">
                      <div className="explanation-title">
                        <Award size={16} /> Clinical Rationale &amp; Key Concept:
                      </div>
                      <p className="feedback-explanation">{currentQuestion.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Exam Bottom Navigation Bar */}
        <div className="exam-footer" id="exam-footer-toolbar">
          <div className="nav-step-buttons">
            <button
              type="button"
              className="nav-button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              id="prev-question-btn"
            >
              <ChevronLeft size={18} /> Previous
            </button>

            <button
              type="button"
              className="nav-button nav-button--next"
              onClick={handleNext}
              disabled={currentIndex === totalQuestions - 1}
              id="next-question-btn"
            >
              Next <ChevronRight size={18} />
            </button>
          </div>

          <div className="footer-palette-toggle">
            <button
              type="button"
              className="palette-open-footer-btn"
              onClick={() => setShowPaletteModal(true)}
            >
              <Grid size={16} /> Question Palette ({answeredCount}/{totalQuestions})
            </button>
          </div>

          <div className="finish-exam-wrapper">
            <button
              type="button"
              onClick={() => openSubmitConfirmModal('manual')}
              disabled={isSubmitting}
              className="finish-exam-cta-btn"
              id="finish-exam-btn"
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  Finish Exam &amp; View Results <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Question Palette Modal / Drawer */}
        {showPaletteModal && (
          <div className="modal-overlay" onClick={() => setShowPaletteModal(false)}>
            <div className="modal-content palette-modal" onClick={(e) => e.stopPropagation()}>
              <div className="palette-modal-header">
                <div>
                  <h3>Question Navigator</h3>
                  <p>Click any question number to jump directly to it.</p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowPaletteModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="palette-legend">
                <div className="legend-item">
                  <span className="legend-dot dot-current" /> Current
                </div>
                <div className="legend-item">
                  <span className="legend-dot dot-answered" /> Answered ({answeredCount})
                </div>
                <div className="legend-item">
                  <span className="legend-dot dot-unanswered" /> Unanswered ({totalQuestions - answeredCount})
                </div>
                <div className="legend-item">
                  <span className="legend-dot dot-flagged" /> Flagged ({flaggedCount})
                </div>
              </div>

              <div className="palette-grid">
                {exam?.questions?.map((q, idx) => {
                  const isAns = answers[q.id] !== undefined;
                  const isFlag = !!flaggedQuestions[q.id];
                  const isCurr = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      className={`palette-num-btn ${isCurr ? 'curr' : ''} ${isAns ? 'ans' : 'unans'} ${
                        isFlag ? 'flag' : ''
                      }`}
                      onClick={() => jumpToQuestion(idx)}
                      id={`palette-btn-${idx + 1}`}
                    >
                      {idx + 1}
                      {isFlag && <Bookmark size={10} className="palette-flag-icon" />}
                    </button>
                  );
                })}
              </div>

              <div className="palette-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowPaletteModal(false)}
                >
                  Close Navigator
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submission Confirmation Modal */}
        {showConfirmModal && (
          <div className="modal-overlay" onClick={handleCancelSubmit}>
            <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="confirm-modal-header">
                <div className="confirm-icon-circle">
                  <Award size={28} />
                </div>
                <h2>{submitContext === 'time' ? 'Time Expired' : 'Complete Practice Exam?'}</h2>
              </div>

              <p className="confirm-modal-desc">
                {submitContext === 'time'
                  ? 'Your total exam time limit has ended. Your responses will now be evaluated and scored.'
                  : 'You are about to finish your exam session. Your cumulative metrics and detailed rationale review will be prepared immediately.'}
              </p>

              {/* Tally Breakdown */}
              <div className="submission-breakdown-card">
                <div className="breakdown-stat">
                  <span className="stat-label">Total Questions</span>
                  <span className="stat-val">{totalQuestions}</span>
                </div>
                <div className="breakdown-stat text-blue-600">
                  <span className="stat-label">Answered</span>
                  <span className="stat-val font-bold">{answeredCount}</span>
                </div>
                <div className="breakdown-stat text-amber-600">
                  <span className="stat-label">Unanswered</span>
                  <span className="stat-val font-bold">{unansweredCount}</span>
                </div>
                <div className="breakdown-stat text-purple-600">
                  <span className="stat-label">Flagged</span>
                  <span className="stat-val font-bold">{flaggedCount}</span>
                </div>
              </div>

              {unansweredCount > 0 && submitContext !== 'time' && (
                <div className="unanswered-warning-banner">
                  <AlertCircle size={16} />
                  <span>
                    You still have <strong>{unansweredCount}</strong> unanswered questions. Unanswered questions will be scored as incorrect.
                  </span>
                </div>
              )}

              <div className="modal-actions">
                {submitContext !== 'time' && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCancelSubmit}
                    id="cancel-submit-btn"
                  >
                    Return to Exam
                  </button>
                )}
                <button
                  type="button"
                  className="btn-primary-confirm"
                  onClick={handleConfirmSubmit}
                  disabled={isSubmitting}
                  id="confirm-submit-btn"
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      Confirm &amp; Generate Results <ChevronRight size={16} />
                    </>
                  )}
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
