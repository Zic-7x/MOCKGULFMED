import { useState, useEffect, useMemo } from 'react';
import { useLocation, useParams, Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  RotateCcw,
  Printer,
  ChevronLeft,
  ChevronRight,
  Search,
  TrendingUp,
  BarChart3,
  BookOpen,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAttemptReview, getUserAttempts } from '../../utils/supabaseQueries';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import './ExamResults.css';

// Helper to safely format numbers as percentages
const formatPercent = (val) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '0.0';
  return Number(val).toFixed(1);
};

// =========================================================================
// SUB-COMPONENT 1: Instant Results from just-completed session
// =========================================================================
const InstantResultsView = ({ resultsData, examId }) => {
  const [reviewFilter, setReviewFilter] = useState('ALL'); // 'ALL' | 'CORRECT' | 'INCORRECT' | 'UNANSWERED'
  const [reviewSearch, setReviewSearch] = useState('');

  const {
    attempt,
    results = [],
    score,
    mainScore,
    attemptOverview,
    overallResult,
    correctAnswers = 0,
    totalQuestionsAnswered = 0,
    totalExamQuestions = 0,
    dailyLimit,
  } = resultsData;

  const readinessThreshold = 80;
  const effectiveScoreNum = Number(mainScore ?? score ?? attemptOverview ?? 0);
  const isReady = effectiveScoreNum >= readinessThreshold;

  const mainScoreNum = mainScore !== null && mainScore !== undefined ? Number(mainScore) : null;
  const attemptOverviewNum = Number(attemptOverview || 0);
  const overallResultNum = Number(overallResult || 0);

  const correctCount = results.filter((r) => r.isCorrect).length;
  const incorrectCount = results.filter(
    (r) => !r.isCorrect && r.userAnswer !== null && r.userAnswer !== undefined
  ).length;
  const unansweredCount = results.filter(
    (r) => r.userAnswer === null || r.userAnswer === undefined
  ).length;

  useEffect(() => {
    if (effectiveScoreNum >= 70) {
      try {
        confetti({
          particleCount: 85,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6'],
        });
      } catch {
        // gracefully ignore if unsupported
      }
    }
  }, [effectiveScoreNum]);

  const handlePrint = () => {
    window.print();
  };

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const matchesFilter =
        reviewFilter === 'ALL' ||
        (reviewFilter === 'CORRECT' && r.isCorrect) ||
        (reviewFilter === 'INCORRECT' && !r.isCorrect && r.userAnswer !== null && r.userAnswer !== undefined) ||
        (reviewFilter === 'UNANSWERED' && (r.userAnswer === null || r.userAnswer === undefined));

      const matchesSearch =
        !reviewSearch.trim() ||
        r.question?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
        r.explanation?.toLowerCase().includes(reviewSearch.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [results, reviewFilter, reviewSearch]);

  const resolvedExamId = attempt?.exam_id || examId;
  const examTitle = attempt?.exam?.title || 'Practice Exam';

  return (
    <div className="exam-results" id="exam-results-page">
      {/* Header & Quick Action Buttons */}
      <div className="results-header-wrapper no-print">
        <div className="results-title-group">
          <span className="results-badge-pill">
            <ShieldCheck size={14} /> Performance Analysis Report
          </span>
          <h1>Exam Results &amp; Review</h1>
          <p className="results-subtitle">
            Comprehensive score breakdown, readiness milestone tracking, and question rationales.
          </p>
        </div>

        <div className="results-top-actions">
          <button
            type="button"
            className="action-btn action-btn--secondary"
            onClick={handlePrint}
            id="print-results-btn"
            title="Print or Save PDF"
          >
            <Printer size={15} /> Print / Save PDF
          </button>
          {resolvedExamId && (
            <Link
              to={`/exams/${resolvedExamId}`}
              className="action-btn action-btn--retake"
              id="retake-exam-btn"
            >
              <RotateCcw size={15} /> Retake Exam
            </Link>
          )}
          <Link to="/exams" className="action-btn action-btn--primary">
            Back to Exams <ChevronRight size={15} />
          </Link>
        </div>
      </div>

      {/* Readiness Milestone Banner */}
      <div className={`readiness-banner ${isReady ? 'ready' : 'in-progress'}`} id="readiness-milestone-banner">
        <div className="readiness-icon-col">
          {isReady ? <Sparkles size={24} /> : <TrendingUp size={24} />}
        </div>
        <div className="readiness-content-col">
          <h3>
            {isReady
              ? 'Congratulations! You Met the 80% Readiness Standard'
              : `Target: ${readinessThreshold}% Passing Readiness`}
          </h3>
          <p>
            {isReady
              ? 'Your performance meets the clinical readiness benchmark for Gulf Licensing Prometric & Pearson VUE examinations.'
              : `You scored ${formatPercent(effectiveScoreNum)}%. Continue practicing with daily question sets to reach the 80% benchmark.`}
          </p>
        </div>
      </div>

      {/* Hero Score Overview */}
      <div className="score-summary-grid">
        <div className="score-hero-card">
          <span className="hero-card-tag">Performance Score</span>
          <div className="score-radial-wrapper">
            <div
              className={`score-big-number ${
                effectiveScoreNum >= 80 ? 'good' : effectiveScoreNum >= 60 ? 'average' : 'poor'
              }`}
            >
              {formatPercent(effectiveScoreNum)}
              <span className="score-percent-sign">%</span>
            </div>
            <span
              className={`grade-badge ${
                effectiveScoreNum >= 80 ? 'grade-good' : effectiveScoreNum >= 60 ? 'grade-avg' : 'grade-poor'
              }`}
            >
              {effectiveScoreNum >= 80 ? 'Exam Ready' : effectiveScoreNum >= 60 ? 'On Track' : 'Needs Practice'}
            </span>
          </div>
          <p className="score-details-text">
            {mainScoreNum !== null && dailyLimit
              ? `${correctAnswers} correct out of ${dailyLimit} daily question target`
              : `${correctAnswers} correct out of ${totalQuestionsAnswered} questions completed`}
          </p>
        </div>

        <div className="exam-meta-card">
          <h3>{examTitle}</h3>
          <div className="meta-specs-list">
            <div className="meta-spec-row">
              <span className="meta-spec-lbl">
                <Award size={14} /> Exam Format:
              </span>
              <span className="meta-spec-val font-semibold">{attempt?.exam?.exam_type || 'Prometric'}</span>
            </div>
            <div className="meta-spec-row">
              <span className="meta-spec-lbl">
                <Clock size={14} /> Time Spent:
              </span>
              <span className="meta-spec-val">
                {Math.floor((attempt?.time_spent || 0) / 60)} min {(attempt?.time_spent || 0) % 60} sec
              </span>
            </div>
            <div className="meta-spec-row">
              <span className="meta-spec-lbl">
                <Calendar size={14} /> Completed Date:
              </span>
              <span className="meta-spec-val">
                {attempt?.completed_at ? new Date(attempt.completed_at).toLocaleString() : 'Just now'}
              </span>
            </div>
            <div className="meta-spec-row">
              <span className="meta-spec-lbl">
                <BookOpen size={14} /> Questions Answered:
              </span>
              <span className="meta-spec-val">
                {correctCount} correct / {totalQuestionsAnswered} total
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Three Metrics System */}
      <div className="percentage-breakdown-wrapper">
        <h2 className="section-heading">
          <BarChart3 size={18} /> Detailed Metric Dimensions
        </h2>
        <div className="percentage-breakdown-grid">
          {/* 1. Main Score */}
          {mainScoreNum !== null && dailyLimit && (
            <div className="metric-dimension-card main-score-card">
              <div className="dim-card-top">
                <span className="dim-title">Main Score</span>
                <span className="dim-badge dim-badge-primary">Daily Benchmark</span>
              </div>
              <div className={`dim-value ${mainScoreNum >= 80 ? 'good' : mainScoreNum >= 60 ? 'average' : 'poor'}`}>
                {formatPercent(mainScoreNum)}%
              </div>
              <div className="dim-progress-track">
                <div
                  className={`dim-progress-fill ${mainScoreNum >= 80 ? 'fill-good' : mainScoreNum >= 60 ? 'fill-avg' : 'fill-poor'}`}
                  style={{ width: `${Math.min(mainScoreNum, 100)}%` }}
                />
              </div>
              <p className="dim-detail">
                {correctAnswers} correct out of {dailyLimit} daily allowance
              </p>
              <span className="dim-subtitle">Primary daily performance milestone</span>
            </div>
          )}

          {/* 2. Attempt Overview */}
          <div className="metric-dimension-card">
            <div className="dim-card-top">
              <span className="dim-title">Attempt Overview</span>
              <span className="dim-badge">Cumulative Accuracy</span>
            </div>
            <div className={`dim-value ${attemptOverviewNum >= 80 ? 'good' : attemptOverviewNum >= 60 ? 'average' : 'poor'}`}>
              {formatPercent(attemptOverviewNum)}%
            </div>
            <div className="dim-progress-track">
              <div
                className={`dim-progress-fill ${attemptOverviewNum >= 80 ? 'fill-good' : attemptOverviewNum >= 60 ? 'fill-avg' : 'fill-poor'}`}
                style={{ width: `${Math.min(attemptOverviewNum, 100)}%` }}
              />
            </div>
            <p className="dim-detail">
              {resultsData.cumulativeCorrectAnswers ?? correctAnswers} correct of {resultsData.cumulativeAnsweredQuestions ?? totalQuestionsAnswered} answered (all sessions)
            </p>
            <span className="dim-subtitle">Overall accuracy across all attempts</span>
          </div>

          {/* 3. Overall Result */}
          <div className="metric-dimension-card">
            <div className="dim-card-top">
              <span className="dim-title">Exam Coverage</span>
              <span className="dim-badge">Total Bank Mastery</span>
            </div>
            <div className={`dim-value ${overallResultNum >= 80 ? 'good' : overallResultNum >= 60 ? 'average' : 'poor'}`}>
              {formatPercent(overallResultNum)}%
            </div>
            <div className="dim-progress-track">
              <div
                className={`dim-progress-fill ${overallResultNum >= 80 ? 'fill-good' : overallResultNum >= 60 ? 'fill-avg' : 'fill-poor'}`}
                style={{ width: `${Math.min(overallResultNum, 100)}%` }}
              />
            </div>
            <p className="dim-detail">
              {resultsData.cumulativeCorrectAnswers ?? correctAnswers} of {totalExamQuestions || totalQuestionsAnswered} total MCQs mastered
            </p>
            <span className="dim-subtitle">Progress toward completing the entire question bank</span>
          </div>
        </div>
      </div>

      {/* Question Review Section */}
      <div className="results-details-section">
        <div className="review-section-header">
          <div>
            <h2>Clinical Rationale &amp; Question Review</h2>
            <p className="review-subtitle">
              Review explanations, key concepts, and identify areas for revision.
            </p>
          </div>

          {/* Review Filter Tabs & Search */}
          <div className="review-controls no-print">
            <div className="review-filter-tabs">
              <button
                type="button"
                className={`review-tab ${reviewFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setReviewFilter('ALL')}
              >
                All ({results.length})
              </button>
              <button
                type="button"
                className={`review-tab tab-correct ${reviewFilter === 'CORRECT' ? 'active' : ''}`}
                onClick={() => setReviewFilter('CORRECT')}
              >
                <CheckCircle2 size={13} /> Correct ({correctCount})
              </button>
              <button
                type="button"
                className={`review-tab tab-incorrect ${reviewFilter === 'INCORRECT' ? 'active' : ''}`}
                onClick={() => setReviewFilter('INCORRECT')}
              >
                <XCircle size={13} /> Incorrect ({incorrectCount})
              </button>
              {unansweredCount > 0 && (
                <button
                  type="button"
                  className={`review-tab tab-unanswered ${reviewFilter === 'UNANSWERED' ? 'active' : ''}`}
                  onClick={() => setReviewFilter('UNANSWERED')}
                >
                  Unanswered ({unansweredCount})
                </button>
              )}
            </div>

            <div className="review-search-box">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search rationale or keywords..."
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                className="review-search-input"
              />
              {reviewSearch && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setReviewSearch('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {filteredResults.length === 0 ? (
          <div className="no-review-matches">
            <p>No questions match your filter criteria.</p>
            <button
              type="button"
              className="btn-secondary text-sm mt-2"
              onClick={() => {
                setReviewFilter('ALL');
                setReviewSearch('');
              }}
            >
              Reset Review Filters
            </button>
          </div>
        ) : (
          <div className="results-review-list">
            {filteredResults.map((result, index) => (
              <div
                key={result.questionId || index}
                className={`result-item-card ${result.isCorrect ? 'item-correct' : 'item-incorrect'}`}
                id={`review-item-${index + 1}`}
              >
                <div className="result-item-header">
                  <div className="item-header-left">
                    <span className="result-number">Question {index + 1}</span>
                    <span
                      className={`result-status-tag ${
                        result.isCorrect ? 'status-correct' : 'status-incorrect'
                      }`}
                    >
                      {result.isCorrect ? (
                        <>
                          <CheckCircle2 size={13} /> Correct
                        </>
                      ) : (
                        <>
                          <XCircle size={13} /> Incorrect
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <p className="result-question-text">{result.question}</p>

                <div className="result-answers-comparison">
                  <div className="answer-card user-answer-card">
                    <span className="ans-card-label">Your Answer:</span>
                    <span className={`ans-card-val ${!result.isCorrect ? 'text-rose-600 font-semibold' : 'text-emerald-700 font-semibold'}`}>
                      {result.userAnswer || 'Not Answered'}
                    </span>
                  </div>

                  {!result.isCorrect && (
                    <div className="answer-card correct-answer-card">
                      <span className="ans-card-label text-emerald-800">Official Correct Answer:</span>
                      <span className="ans-card-val text-emerald-800 font-bold">
                        {result.correctAnswer}
                      </span>
                    </div>
                  )}
                </div>

                {result.explanation && (
                  <div className="result-explanation-box">
                    <div className="explanation-title">
                      <BookOpen size={14} /> Clinical Rationale &amp; Explanatory Notes:
                    </div>
                    <p className="explanation-text">{result.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT 2: Detailed Review of a past attempt
// =========================================================================
const PastAttemptReviewView = ({ attemptReview, isReviewError, refetchReview }) => {
  const [reviewFilter, setReviewFilter] = useState('ALL');
  const [reviewSearch, setReviewSearch] = useState('');

  if (isReviewError || !attemptReview?.attempt) {
    return (
      <div className="exam-results" id="attempt-not-found">
        <div className="results-header-wrapper">
          <div className="results-title-group">
            <h1>Attempt Review</h1>
            <p className="results-subtitle">Historical exam session details</p>
          </div>
          <Link to="/results" className="action-btn action-btn--secondary">
            <ChevronLeft size={16} /> Back to Results
          </Link>
        </div>
        <div className="no-results-card">
          <AlertCircle size={40} className="text-amber-500 mb-3" />
          <h3>Attempt Not Found or Load Failed</h3>
          <p>The requested exam attempt could not be located or has expired.</p>
          <div className="mt-4 flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => refetchReview()}
              className="action-btn action-btn--secondary"
            >
              Retry Loading
            </button>
            <Link to="/results" className="action-btn action-btn--primary">
              View All Results
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const attempt = attemptReview.attempt;
  const results = attemptReview.results || [];

  const effectiveScoreNum = Number(
    attempt.mainScore !== null && attempt.mainScore !== undefined && attempt.dailyLimit
      ? attempt.mainScore
      : (attempt.score ?? attempt.attemptOverview ?? 0)
  );

  const mainScoreNum = attempt.mainScore !== null && attempt.mainScore !== undefined ? Number(attempt.mainScore) : null;
  const attemptOverviewNum = Number(attempt.attemptOverview || 0);
  const overallResultNum = Number(attempt.overallResult || 0);

  const correctCount = results.filter((r) => r.isCorrect).length;
  const incorrectCount = results.filter(
    (r) => !r.isCorrect && r.userAnswer !== null && r.userAnswer !== undefined
  ).length;

  const handlePrint = () => {
    window.print();
  };

  const filteredResults = results.filter((r) => {
    const matchesFilter =
      reviewFilter === 'ALL' ||
      (reviewFilter === 'CORRECT' && r.isCorrect) ||
      (reviewFilter === 'INCORRECT' && !r.isCorrect);

    const matchesSearch =
      !reviewSearch.trim() ||
      r.question?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.explanation?.toLowerCase().includes(reviewSearch.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="exam-results" id="past-attempt-review-page">
      <div className="results-header-wrapper no-print">
        <div className="results-title-group">
          <span className="results-badge-pill">
            <ShieldCheck size={14} /> Historical Attempt Review
          </span>
          <h1>{attempt.exam?.title || 'Exam Attempt Review'}</h1>
          <p className="results-subtitle">
            Completed on {attempt.completed_at ? new Date(attempt.completed_at).toLocaleString() : 'N/A'}
          </p>
        </div>

        <div className="results-top-actions">
          <button
            type="button"
            className="action-btn action-btn--secondary"
            onClick={handlePrint}
            title="Print or Save PDF"
          >
            <Printer size={15} /> Print
          </button>
          {attempt.exam_id && (
            <Link
              to={`/exams/${attempt.exam_id}`}
              className="action-btn action-btn--retake"
            >
              <RotateCcw size={15} /> Retake Exam
            </Link>
          )}
          <Link to="/results" className="action-btn action-btn--primary">
            <ChevronLeft size={15} /> All Attempts
          </Link>
        </div>
      </div>

      {/* Score Summary */}
      <div className="score-summary-grid">
        <div className="score-hero-card">
          <span className="hero-card-tag">Attempt Score</span>
          <div className="score-radial-wrapper">
            <div
              className={`score-big-number ${
                effectiveScoreNum >= 80 ? 'good' : effectiveScoreNum >= 60 ? 'average' : 'poor'
              }`}
            >
              {formatPercent(effectiveScoreNum)}
              <span className="score-percent-sign">%</span>
            </div>
            <span
              className={`grade-badge ${
                effectiveScoreNum >= 80 ? 'grade-good' : effectiveScoreNum >= 60 ? 'grade-avg' : 'grade-poor'
              }`}
            >
              {effectiveScoreNum >= 80 ? 'Exam Ready' : effectiveScoreNum >= 60 ? 'On Track' : 'Needs Practice'}
            </span>
          </div>
          <p className="score-details-text">
            {mainScoreNum !== null && attempt.dailyLimit
              ? `${attempt.correct_answers || 0} correct out of ${attempt.dailyLimit} daily limit`
              : `${attempt.correct_answers || 0} correct out of ${attempt.totalQuestionsAnswered || attempt.total_questions || results.length} questions completed`}
          </p>
        </div>

        <div className="exam-meta-card">
          <h3>{attempt.exam?.title || 'Practice Exam'}</h3>
          <div className="meta-specs-list">
            <div className="meta-spec-row">
              <span className="meta-spec-lbl">
                <Award size={14} /> Exam Format:
              </span>
              <span className="meta-spec-val font-semibold">{attempt.exam?.exam_type || 'Prometric'}</span>
            </div>
            <div className="meta-spec-row">
              <span className="meta-spec-lbl">
                <Clock size={14} /> Time Spent:
              </span>
              <span className="meta-spec-val">
                {Math.floor((attempt.time_spent || 0) / 60)} min {(attempt.time_spent || 0) % 60} sec
              </span>
            </div>
            <div className="meta-spec-row">
              <span className="meta-spec-lbl">
                <Calendar size={14} /> Date Taken:
              </span>
              <span className="meta-spec-val">
                {attempt.completed_at ? new Date(attempt.completed_at).toLocaleString() : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Three Metrics System */}
      <div className="percentage-breakdown-wrapper">
        <h2 className="section-heading">
          <BarChart3 size={18} /> Performance Breakdown
        </h2>
        <div className="percentage-breakdown-grid">
          {mainScoreNum !== null && attempt.dailyLimit && (
            <div className="metric-dimension-card main-score-card">
              <div className="dim-card-top">
                <span className="dim-title">Main Score</span>
                <span className="dim-badge dim-badge-primary">Daily Limit</span>
              </div>
              <div className={`dim-value ${mainScoreNum >= 80 ? 'good' : mainScoreNum >= 60 ? 'average' : 'poor'}`}>
                {formatPercent(mainScoreNum)}%
              </div>
              <div className="dim-progress-track">
                <div
                  className={`dim-progress-fill ${mainScoreNum >= 80 ? 'fill-good' : mainScoreNum >= 60 ? 'fill-avg' : 'fill-poor'}`}
                  style={{ width: `${Math.min(mainScoreNum, 100)}%` }}
                />
              </div>
              <p className="dim-detail">
                {attempt.correct_answers || 0} of {attempt.dailyLimit} daily allowance
              </p>
            </div>
          )}

          <div className="metric-dimension-card">
            <div className="dim-card-top">
              <span className="dim-title">Attempt Overview</span>
              <span className="dim-badge">Cumulative Accuracy</span>
            </div>
            <div className={`dim-value ${attemptOverviewNum >= 80 ? 'good' : attemptOverviewNum >= 60 ? 'average' : 'poor'}`}>
              {formatPercent(attemptOverviewNum)}%
            </div>
            <div className="dim-progress-track">
              <div
                className={`dim-progress-fill ${attemptOverviewNum >= 80 ? 'fill-good' : attemptOverviewNum >= 60 ? 'fill-avg' : 'fill-poor'}`}
                style={{ width: `${Math.min(attemptOverviewNum, 100)}%` }}
              />
            </div>
            <p className="dim-detail">
              {attempt.cumulativeCorrectAnswers ?? attempt.correct_answers ?? 0} of {attempt.cumulativeAnsweredQuestions ?? attempt.totalQuestionsAnswered ?? results.length} questions (all sessions)
            </p>
          </div>

          <div className="metric-dimension-card">
            <div className="dim-card-top">
              <span className="dim-title">Exam Pool Coverage</span>
              <span className="dim-badge">Mastery</span>
            </div>
            <div className={`dim-value ${overallResultNum >= 80 ? 'good' : overallResultNum >= 60 ? 'average' : 'poor'}`}>
              {formatPercent(overallResultNum)}%
            </div>
            <div className="dim-progress-track">
              <div
                className={`dim-progress-fill ${overallResultNum >= 80 ? 'fill-good' : overallResultNum >= 60 ? 'fill-avg' : 'fill-poor'}`}
                style={{ width: `${Math.min(overallResultNum, 100)}%` }}
              />
            </div>
            <p className="dim-detail">
              {attempt.cumulativeCorrectAnswers ?? attempt.correct_answers ?? 0} of {attempt.totalExamQuestions || results.length} total MCQs
            </p>
          </div>
        </div>
      </div>

      {/* Question Review Section */}
      <div className="results-details-section">
        <div className="review-section-header">
          <div>
            <h2>Answered Questions &amp; Explanations</h2>
            <p className="review-subtitle">Review every question answered during this attempt.</p>
          </div>

          <div className="review-controls no-print">
            <div className="review-filter-tabs">
              <button
                type="button"
                className={`review-tab ${reviewFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setReviewFilter('ALL')}
              >
                All ({results.length})
              </button>
              <button
                type="button"
                className={`review-tab tab-correct ${reviewFilter === 'CORRECT' ? 'active' : ''}`}
                onClick={() => setReviewFilter('CORRECT')}
              >
                <CheckCircle2 size={13} /> Correct ({correctCount})
              </button>
              <button
                type="button"
                className={`review-tab tab-incorrect ${reviewFilter === 'INCORRECT' ? 'active' : ''}`}
                onClick={() => setReviewFilter('INCORRECT')}
              >
                <XCircle size={13} /> Incorrect ({incorrectCount})
              </button>
            </div>

            <div className="review-search-box">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search questions..."
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                className="review-search-input"
              />
              {reviewSearch && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setReviewSearch('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="no-review-matches">
            <p>No answers were recorded for this attempt.</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="no-review-matches">
            <p>No questions match your current search or filter.</p>
          </div>
        ) : (
          <div className="results-review-list">
            {filteredResults.map((result, index) => (
              <div
                key={result.questionId || index}
                className={`result-item-card ${result.isCorrect ? 'item-correct' : 'item-incorrect'}`}
              >
                <div className="result-item-header">
                  <span className="result-number">Question {index + 1}</span>
                  <span
                    className={`result-status-tag ${
                      result.isCorrect ? 'status-correct' : 'status-incorrect'
                    }`}
                  >
                    {result.isCorrect ? (
                      <>
                        <CheckCircle2 size={13} /> Correct
                      </>
                    ) : (
                      <>
                        <XCircle size={13} /> Incorrect
                      </>
                    )}
                  </span>
                </div>

                <p className="result-question-text">{result.question}</p>

                {/* Option Choices breakdown if available */}
                <div className="result-options-list">
                  {[
                    ['A', result.option_a],
                    ['B', result.option_b],
                    ['C', result.option_c],
                    ['D', result.option_d],
                  ]
                    .filter(([, text]) => text !== null && text !== undefined && String(text).trim() !== '')
                    .map(([label, text]) => {
                      const isUser = (result.userAnswer || '').toString().trim().toUpperCase() === label;
                      const isCorrect = (result.correctAnswer || '').toString().trim().toUpperCase() === label;

                      let optionClass = 'review-option-pill';
                      if (isCorrect) optionClass += ' review-option-correct';
                      if (isUser && !isCorrect) optionClass += ' review-option-user-wrong';
                      if (isUser && isCorrect) optionClass += ' review-option-user-correct';

                      return (
                        <div key={label} className={optionClass}>
                          <span className="review-opt-letter">{label}.</span>
                          <span className="review-opt-text">{text}</span>
                          {isCorrect && (
                            <span className="review-opt-badge badge-correct">Correct Option</span>
                          )}
                          {isUser && (
                            <span className="review-opt-badge badge-user">Your Choice</span>
                          )}
                        </div>
                      );
                    })}
                </div>

                <div className="result-answers-comparison">
                  <div className="answer-card user-answer-card">
                    <span className="ans-card-label">Your Submitted Answer:</span>
                    <span className={`ans-card-val ${!result.isCorrect ? 'text-rose-600 font-semibold' : 'text-emerald-700 font-semibold'}`}>
                      {result.userAnswer || 'Not answered'}
                    </span>
                  </div>

                  {!result.isCorrect && (
                    <div className="answer-card correct-answer-card">
                      <span className="ans-card-label text-emerald-800">Correct Answer:</span>
                      <span className="ans-card-val text-emerald-800 font-bold">{result.correctAnswer}</span>
                    </div>
                  )}
                </div>

                {result.explanation && (
                  <div className="result-explanation-box">
                    <div className="explanation-title">
                      <BookOpen size={14} /> Clinical Explanation:
                    </div>
                    <p className="explanation-text">{result.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT 3: List of All Past Exam Attempts
// =========================================================================
const AttemptsHistoryListView = ({ attempts, isAttemptsError, refetchAttempts, examId }) => {
  const [attemptSearch, setAttemptSearch] = useState('');

  const totalAttemptsCount = attempts?.length || 0;

  const averageScore = useMemo(() => {
    if (!attempts || attempts.length === 0) return 0;
    const sum = attempts.reduce((acc, a) => acc + (Number(a.score) || 0), 0);
    return sum / attempts.length;
  }, [attempts]);

  const highestScore = useMemo(() => {
    if (!attempts || attempts.length === 0) return 0;
    const validScores = attempts.map((a) => Number(a.score) || 0);
    return validScores.length > 0 ? Math.max(...validScores) : 0;
  }, [attempts]);

  const filteredAttempts = useMemo(() => {
    if (!attempts) return [];
    return attempts.filter((att) => {
      if (!attemptSearch.trim()) return true;
      return (
        att.exam?.title?.toLowerCase().includes(attemptSearch.toLowerCase()) ||
        att.exam?.exam_type?.toLowerCase().includes(attemptSearch.toLowerCase())
      );
    });
  }, [attempts, attemptSearch]);

  if (isAttemptsError) {
    return (
      <div className="exam-results" id="attempts-error-page">
        <div className="results-header-wrapper">
          <div className="results-title-group">
            <span className="results-badge-pill">
              <BarChart3 size={14} /> Exam Activity
            </span>
            <h1>{examId ? 'Exam Attempts' : 'Past Results & Analytics'}</h1>
          </div>
        </div>
        <div className="no-results-card">
          <AlertCircle size={36} className="text-amber-500 mb-2" />
          <h3>Unable to Load Attempts</h3>
          <p>We encountered an issue fetching your historical attempts. Please check your network or try again.</p>
          <button
            type="button"
            onClick={() => refetchAttempts()}
            className="action-btn action-btn--primary inline-flex mt-3"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!attempts || attempts.length === 0) {
    return (
      <div className="exam-results" id="no-attempts-page">
        <div className="results-header-wrapper">
          <div className="results-title-group">
            <span className="results-badge-pill">
              <BarChart3 size={14} /> Exam Activity
            </span>
            <h1>{examId ? 'Exam Attempts' : 'Past Results & Analytics'}</h1>
            <p className="results-subtitle">Review your historical test performance and question rationales.</p>
          </div>
          <Link to="/exams" className="action-btn action-btn--primary">
            <BookOpen size={16} /> Available Exams
          </Link>
        </div>

        <div className="no-results-card">
          <div className="no-results-icon">
            <BookOpen size={36} />
          </div>
          <h3>No Exam Attempts Recorded Yet</h3>
          <p>You haven't completed any practice exam modules yet. Start practicing today to build your readiness profile.</p>
          <Link to="/exams" className="action-btn action-btn--primary inline-flex mt-3">
            Start an Exam <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-results" id="all-attempts-list-page">
      <div className="results-header-wrapper">
        <div className="results-title-group">
          <span className="results-badge-pill">
            <BarChart3 size={14} /> Practice History &amp; Analytics
          </span>
          <h1>{examId ? 'Exam Attempt History' : 'Your Exam Results'}</h1>
          <p className="results-subtitle">
            Detailed tracking of your test performance, accuracy trends, and Prometric readiness.
          </p>
        </div>

        <div className="results-top-actions">
          <Link to="/exams" className="action-btn action-btn--primary">
            <BookOpen size={16} /> Practice More Exams
          </Link>
        </div>
      </div>

      {/* Analytics Top Strip */}
      <div className="attempts-analytics-strip">
        <div className="analytics-stat-card">
          <div className="analytics-icon icon-blue">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="stat-value">{totalAttemptsCount}</div>
            <div className="stat-label">Total Attempts</div>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-icon icon-green">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="stat-value">{formatPercent(averageScore)}%</div>
            <div className="stat-label">Average Score</div>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-icon icon-amber">
            <Award size={20} />
          </div>
          <div>
            <div className="stat-value">{formatPercent(highestScore)}%</div>
            <div className="stat-label">Highest Score</div>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-icon icon-purple">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="stat-value">80% Pass</div>
            <div className="stat-label">Benchmark Goal</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="attempts-toolbar">
        <div className="search-box-wrapper max-w-md">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search attempts by exam name or type..."
            value={attemptSearch}
            onChange={(e) => setAttemptSearch(e.target.value)}
            className="search-input"
          />
          {attemptSearch && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setAttemptSearch('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Attempts Grid List */}
      <div className="attempts-grid-list">
        {filteredAttempts.map((attempt) => {
          const scoreVal = Number(attempt.score) || 0;
          const isGood = scoreVal >= 80;
          const isAvg = scoreVal >= 60 && scoreVal < 80;

          return (
            <Link
              key={attempt.id}
              to={`/results/attempt/${attempt.id}`}
              className="attempt-overview-card"
              id={`attempt-card-${attempt.id}`}
            >
              <div className="attempt-card-top">
                <div className="attempt-title-area">
                  <span className="attempt-type-badge">
                    {attempt.exam?.exam_type || 'PROMETRIC'}
                  </span>
                  <h3>{attempt.exam?.title || 'Practice Exam'}</h3>
                </div>

                <div className={`attempt-score-pill ${isGood ? 'good' : isAvg ? 'average' : 'poor'}`}>
                  <span className="score-num">{formatPercent(scoreVal)}%</span>
                  <span className="score-lbl">
                    {isGood ? 'Ready' : isAvg ? 'On Track' : 'Review'}
                  </span>
                </div>
              </div>

              <div className="attempt-card-metrics">
                {attempt.mainScore !== null && attempt.mainScore !== undefined && attempt.dailyLimit && (
                  <div className="att-metric-item highlight-metric">
                    <span className="att-metric-label">Main Score (Daily):</span>
                    <span className="att-metric-val font-semibold">
                      {formatPercent(attempt.mainScore)}% ({attempt.correct_answers || 0}/{attempt.dailyLimit} MCQs)
                    </span>
                  </div>
                )}

                <div className="att-metric-item">
                  <span className="att-metric-label">Cumulative Accuracy:</span>
                  <span className="att-metric-val">
                    {formatPercent(attempt.attemptOverview || 0)}%
                  </span>
                </div>

                <div className="att-metric-item">
                  <span className="att-metric-label">Exam Pool Coverage:</span>
                  <span className="att-metric-val">
                    {formatPercent(attempt.overallResult || 0)}%
                  </span>
                </div>
              </div>

              <div className="attempt-card-footer">
                <div className="attempt-time-meta">
                  <span>
                    <Calendar size={13} /> {attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString() : '-'}
                  </span>
                  <span>
                    <Clock size={13} /> {Math.floor((attempt.time_spent || 0) / 60)} mins
                  </span>
                </div>

                <span className="review-action-text">
                  Review Answers &amp; Rationale <ChevronRight size={14} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// =========================================================================
// MAIN CONTAINER COMPONENT
// =========================================================================
const ExamResults = () => {
  const location = useLocation();
  const { id, attemptId } = useParams();
  const { user, loading: authLoading } = useAuth();

  // Results passed directly from TakeExam completion
  const resultsFromState = location.state?.results;

  // Query past attempts when viewing list (/results or /exams/:id/results without direct submission state)
  const {
    data: attempts = [],
    isLoading: isAttemptsLoading,
    isError: isAttemptsError,
    refetch: refetchAttempts,
  } = useQuery({
    queryKey: ['userAttempts', user?.id, id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await getUserAttempts(user.id, id || null);
    },
    enabled: !!user?.id && !resultsFromState && !attemptId,
  });

  // Query specific attempt details for in-depth review (/results/attempt/:attemptId)
  const {
    data: attemptReview,
    isLoading: isReviewLoading,
    isError: isReviewError,
    refetch: refetchReview,
  } = useQuery({
    queryKey: ['attemptReview', user?.id, attemptId],
    queryFn: async () => {
      if (!user?.id || !attemptId) return null;
      return await getAttemptReview(user.id, attemptId);
    },
    enabled: !!user?.id && !!attemptId && !resultsFromState,
  });

  // Auth guard: wait while auth is initialising
  if (authLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Loading spinner for data queries
  if ((isAttemptsLoading || isReviewLoading) && !resultsFromState) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      {resultsFromState ? (
        <InstantResultsView resultsData={resultsFromState} examId={id} />
      ) : attemptId ? (
        <PastAttemptReviewView
          attemptReview={attemptReview}
          isReviewError={isReviewError}
          refetchReview={refetchReview}
        />
      ) : (
        <AttemptsHistoryListView
          attempts={attempts}
          isAttemptsError={isAttemptsError}
          refetchAttempts={refetchAttempts}
          examId={id}
        />
      )}
    </Layout>
  );
};

export default ExamResults;
