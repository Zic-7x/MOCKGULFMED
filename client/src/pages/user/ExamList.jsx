import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Clock,
  Award,
  ArrowRight,
  Lock,
  AlertTriangle,
  History,
  CheckCircle2,
  Filter,
  Sparkles,
  Zap,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAvailableExams, canUserTakeExams } from '../../utils/supabaseQueries';
import { syncFreemiusEntitlement } from '../../utils/freemiusEntitlementSync';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import './ExamList.css';

const FREEMIUS_PRODUCT_ID = import.meta.env.VITE_FREEMIUS_PRODUCT_ID || '27532';
const FREEMIUS_PUBLIC_KEY = import.meta.env.VITE_FREEMIUS_PUBLIC_KEY || '';
const FREEMIUS_IMAGE = import.meta.env.VITE_FREEMIUS_IMAGE || '';
const FREEMIUS_WEBHOOK_API_URL = import.meta.env.VITE_FREEMIUS_WEBHOOK_API_URL || '/api/freemius-webhook';

let freemiusScriptPromise;

function ensureFreemiusCheckoutScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Freemius checkout can only run in the browser.'));
  }
  if (window.FS?.Checkout) return Promise.resolve(window.FS);
  if (freemiusScriptPromise) return freemiusScriptPromise;

  freemiusScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-freemius-checkout="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.FS), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Freemius checkout script.')),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.freemius.com/js/v1/';
    script.async = true;
    script.dataset.freemiusCheckout = 'true';
    script.onload = () => resolve(window.FS);
    script.onerror = () => reject(new Error('Failed to load Freemius checkout script.'));
    document.body.appendChild(script);
  });

  return freemiusScriptPromise;
}

const ExamList = () => {
  const { user } = useAuth();
  const [activeAddonExamId, setActiveAddonExamId] = useState(null);
  const [unlockingExamIds, setUnlockingExamIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [sortBy, setSortBy] = useState('default');

  if (!user) {
    return <Navigate to="/login" />;
  }

  const { data: accessGate } = useQuery({
    queryKey: ['examAccessGate', user?.id],
    queryFn: async () => {
      if (!user?.id) return { allowed: true };
      return await canUserTakeExams(user.id);
    },
    enabled: !!user?.id,
  });

  const { data: exams, isLoading, error } = useQuery({
    queryKey: ['availableExams', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await getAvailableExams(user.id);
    },
    enabled: !!user?.id && !!accessGate?.allowed,
  });

  const markExamAsUnlocked = (examId) => {
    setUnlockingExamIds((prev) => {
      const next = new Set(prev);
      next.add(examId);
      return next;
    });
  };

  const handleAddonPurchase = async (exam) => {
    if (!FREEMIUS_PRODUCT_ID || !FREEMIUS_PUBLIC_KEY) {
      toast.error('Checkout is not configured yet. Please contact support.');
      return;
    }

    if (!exam?.addon_freemius_plan_id) {
      toast.error('Addon plan ID is missing for this exam.');
      return;
    }

    try {
      setActiveAddonExamId(exam.id);
      const FS = await ensureFreemiusCheckoutScript();
      const handler = new FS.Checkout({
        product_id: String(FREEMIUS_PRODUCT_ID),
        plan_id: String(exam.addon_freemius_plan_id),
        public_key: FREEMIUS_PUBLIC_KEY,
        image: FREEMIUS_IMAGE || undefined,
      });

      handler.open({
        name: `${exam.title} Addon`,
        licenses: 1,
        purchaseCompleted: (response) => {
          const externalRef =
            response?.subscription?.id ||
            response?.license?.id ||
            response?.license?.key ||
            response?.order?.id ||
            null;
          syncFreemiusEntitlement(
            {
              userId: user?.id,
              examId: exam.id,
              scope: 'EXAM',
              status: 'ACTIVE',
              externalRef: externalRef || null,
            },
            FREEMIUS_WEBHOOK_API_URL
          )
            .then(() => {
              markExamAsUnlocked(exam.id);
              toast.success('Addon purchase completed. You can now start the exam.');
            })
            .catch((syncErr) => {
              console.error('[Exam addon] entitlement sync failed:', syncErr);
              toast.error('Purchase was completed, but we could not sync access yet.');
            });
        },
      });
    } catch (addonErr) {
      console.error('[Exam addon] checkout error:', addonErr);
      toast.error(addonErr?.message || 'Failed to open addon checkout.');
    } finally {
      setActiveAddonExamId(null);
    }
  };

  // Distinct exam types available in the loaded exams
  const availableTypes = useMemo(() => {
    if (!exams) return [];
    const types = new Set();
    exams.forEach((exam) => {
      if (exam.exam_type) types.add(exam.exam_type);
    });
    return Array.from(types);
  }, [exams]);

  // Filtered and sorted exams
  const filteredExams = useMemo(() => {
    if (!exams) return [];
    return exams
      .filter((exam) => {
        const matchesSearch =
          !searchQuery.trim() ||
          exam.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exam.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exam.exam_type?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType =
          selectedType === 'ALL' ||
          exam.exam_type?.toLowerCase() === selectedType.toLowerCase();

        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        const countA = a._questionCount ?? a.questions?.length ?? 0;
        const countB = b._questionCount ?? b.questions?.length ?? 0;
        if (sortBy === 'questions-desc') return countB - countA;
        if (sortBy === 'questions-asc') return countA - countB;
        if (sortBy === 'duration-desc') return (b.duration || 0) - (a.duration || 0);
        if (sortBy === 'duration-asc') return (a.duration || 0) - (b.duration || 0);
        if (sortBy === 'title-asc') return (a.title || '').localeCompare(b.title || '');
        return 0; // default order
      });
  }, [exams, searchQuery, selectedType, sortBy]);

  const totalQuestionsPool = useMemo(() => {
    if (!exams) return 0;
    return exams.reduce(
      (sum, e) => sum + (e._questionCount ?? e.questions?.length ?? 0),
      0
    );
  }, [exams]);

  if (!accessGate || isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (accessGate && !accessGate.allowed && accessGate.reason === 'subscription_required') {
    return (
      <Layout>
        <div className="exam-list" id="exam-list-subscription-gate">
          <div className="exam-list-header-wrapper">
            <div className="exam-list-title-group">
              <span className="exam-badge-pill">
                <Sparkles size={14} /> Medical Licensing Exams
              </span>
              <h1>Available Exams</h1>
              <p className="exam-list-subtitle">
                Access curated Gulf Prometric &amp; Pearson VUE practice banks aligned with DHA, HAAD, MOH, SMLE, and OMSB blueprints.
              </p>
            </div>
          </div>

          <div className="no-exams no-exams-subscription-gate">
            <div className="subscription-gate-icon">
              <Lock size={32} />
            </div>
            <div className="subscription-gate-section">
              <h3>Subscription Required</h3>
              <p>
                Complete your package subscription to unlock full exam banks, real-time rationale breakdowns, and your daily MCQ allowance.
              </p>
              <div className="subscription-gate-actions">
                <Link to="/packages" className="start-exam-button subscription-gate-button">
                  View Packages &amp; Unlock Exams <ArrowRight size={16} />
                </Link>
              </div>
            </div>
            <div className="subscription-gate-section subscription-gate-section--trial">
              <div className="trial-badge">
                <Zap size={14} /> Free 3-Day Trial Available
              </div>
              <h4>Start Your 3-Day Risk-Free Trial</h4>
              <p>Experience the Basic Monthly tier with full MCQ practice questions before committing.</p>
              <Link to="/packages" className="start-exam-button subscription-gate-button subscription-gate-button--trial">
                Get 3 Days Free Trial
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const packageLocked = accessGate?.examAccessLocked === true;
  const renewalWarning = accessGate?.renewalWarning;

  if (error) {
    toast.error('Failed to load exams');
    return (
      <Layout>
        <div className="exam-list" id="exam-list-error">
          <div className="exam-list-header-wrapper">
            <h1>Available Exams</h1>
          </div>
          <div className="no-exams">
            <AlertTriangle size={36} className="text-amber-500 mb-3" />
            <p>Error loading exams. Please try refreshing or contact support.</p>
            <button
              onClick={() => window.location.reload()}
              className="start-exam-button inline-flex items-center gap-2 mt-4 max-w-xs"
            >
              <RotateCcw size={16} /> Refresh Page
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="exam-list" id="exam-list-page">
        {/* Header Hero Area */}
        <div className="exam-list-header-wrapper">
          <div className="exam-list-header-main">
            <div className="exam-list-title-group">
              <span className="exam-badge-pill">
                <ShieldCheck size={14} /> Medical Licensing Test Center
              </span>
              <h1>Available Practice Exams</h1>
              <p className="exam-list-subtitle">
                Authentic Prometric &amp; Pearson VUE simulation tests tailored to your healthcare profession and Gulf health authority.
              </p>
            </div>

            <div className="exam-header-actions">
              <Link to="/results" className="exam-results-link-btn" id="view-past-results-btn">
                <History size={16} /> Past Results &amp; Analytics
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          {exams && exams.length > 0 && (
            <div className="exam-metrics-strip" id="exam-metrics-strip">
              <div className="metric-strip-item">
                <div className="metric-strip-icon metric-icon-blue">
                  <BookOpen size={18} />
                </div>
                <div>
                  <div className="metric-strip-val">{exams.length}</div>
                  <div className="metric-strip-lbl">Active Exams</div>
                </div>
              </div>

              <div className="metric-strip-item">
                <div className="metric-strip-icon metric-icon-green">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className="metric-strip-val">{totalQuestionsPool}</div>
                  <div className="metric-strip-lbl">Question Bank Pool</div>
                </div>
              </div>

              <div className="metric-strip-item">
                <div className="metric-strip-icon metric-icon-purple">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="metric-strip-val">30s / MCQ</div>
                  <div className="metric-strip-lbl">Exam Timing Pace</div>
                </div>
              </div>

              <div className="metric-strip-item">
                <div className="metric-strip-icon metric-icon-amber">
                  <Award size={18} />
                </div>
                <div>
                  <div className="metric-strip-val">80% Pass</div>
                  <div className="metric-strip-lbl">Readiness Benchmark</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Warning Banners */}
        {renewalWarning && (
          <div className="exam-list-banner exam-list-banner--warning" role="status" id="renewal-warning-banner">
            <div className="banner-icon-col">
              <AlertTriangle size={20} />
            </div>
            <div className="banner-content-col">
              <div>
                <strong>Package Renewal Notice:</strong>{' '}
                {renewalWarning.daysRemaining === 1
                  ? 'Your access expires tomorrow.'
                  : `You have approximately ${renewalWarning.daysRemaining} days of access left.`}{' '}
                Renew now to maintain uninterrupted practice and streak history.
              </div>
              <Link to="/packages" className="exam-list-banner-link">
                Renew Package <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {packageLocked && (
          <div className="exam-list-banner exam-list-banner--locked" role="status" id="package-locked-banner">
            <div className="banner-icon-col">
              <Lock size={20} />
            </div>
            <div className="banner-content-col">
              <div>
                <strong>Package Access Expired:</strong> Your account, answered questions, and past results are securely preserved. Renew your package to resume exam practice immediately.
              </div>
              <Link to="/packages" className="exam-list-banner-link">
                Renew Package Now <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* Search, Filter & Sorting Bar */}
        {exams && exams.length > 0 && (
          <div className="exam-filters-bar" id="exam-filters-toolbar">
            <div className="search-box-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search exams by title, specialty, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                id="exam-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="search-clear-btn"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="filter-controls-group">
              {availableTypes.length > 1 && (
                <div className="filter-pill-group" role="radiogroup" aria-label="Filter by exam type">
                  <button
                    type="button"
                    className={`filter-pill ${selectedType === 'ALL' ? 'active' : ''}`}
                    onClick={() => setSelectedType('ALL')}
                  >
                    All Types
                  </button>
                  {availableTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`filter-pill ${selectedType.toLowerCase() === type.toLowerCase() ? 'active' : ''}`}
                      onClick={() => setSelectedType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}

              <div className="sort-wrapper">
                <Filter size={15} className="sort-icon" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                  id="exam-sort-select"
                  aria-label="Sort exams"
                >
                  <option value="default">Default Order</option>
                  <option value="questions-desc">Most MCQs First</option>
                  <option value="questions-asc">Fewest MCQs First</option>
                  <option value="duration-desc">Longest Duration</option>
                  <option value="duration-asc">Shortest Duration</option>
                  <option value="title-asc">Title (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Exams Grid */}
        {exams && exams.length === 0 ? (
          <div className="no-exams" id="no-exams-available-msg">
            <div className="no-exams-icon">
              <BookOpen size={40} />
            </div>
            <h3>No Exams Found for Your Current Profession</h3>
            <p>
              We are regularly adding new question sets. If you believe this is an error with your profession setup, please contact our support team.
            </p>
            <Link to="/profile" className="start-exam-button inline-flex items-center gap-2 max-w-xs mt-3">
              Check Profile Profession <ArrowRight size={16} />
            </Link>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="no-exams" id="no-matching-exams-msg">
            <div className="no-exams-icon">
              <Search size={36} />
            </div>
            <h3>No exams match your search criteria</h3>
            <p>Try clearing your search query or selecting "All Types".</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedType('ALL');
              }}
              className="start-exam-button inline-flex items-center gap-2 max-w-xs mt-3"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="exams-grid" id="exams-grid-container">
            {filteredExams.map((exam) => {
              const questionCount = exam._questionCount ?? exam.questions?.length ?? 0;
              const isPrometric = exam.exam_type?.toLowerCase().includes('prometric');
              const isPearson = exam.exam_type?.toLowerCase().includes('pearson');

              return (
                <div
                  key={exam.id}
                  id={`exam-card-${exam.id}`}
                  className={`exam-card ${packageLocked ? 'exam-card--locked' : ''} ${
                    exam.addon_enabled && !exam.addonPurchased && !unlockingExamIds.has(exam.id)
                      ? 'exam-card--addon'
                      : ''
                  }`}
                >
                  <div className="exam-card-top">
                    <div className="exam-header">
                      <h3>{exam.title}</h3>
                      <span
                        className={`exam-type-badge ${
                          isPrometric ? 'prometric' : isPearson ? 'pearson' : 'custom'
                        }`}
                      >
                        {exam.exam_type || 'Prometric'}
                      </span>
                    </div>

                    {exam.description && (
                      <p className="exam-description">{exam.description}</p>
                    )}
                  </div>

                  <div className="exam-card-body">
                    <div className="exam-spec-grid">
                      <div className="spec-item">
                        <span className="spec-label">
                          <BookOpen size={14} /> Total MCQs
                        </span>
                        <span className="spec-value">{questionCount}</span>
                      </div>

                      <div className="spec-item">
                        <span className="spec-label">
                          <Clock size={14} /> Duration
                        </span>
                        <span className="spec-value">{exam.duration} mins</span>
                      </div>

                      <div className="spec-item">
                        <span className="spec-label">
                          <Zap size={14} /> Format
                        </span>
                        <span className="spec-value">Multiple Choice</span>
                      </div>

                      <div className="spec-item">
                        <span className="spec-label">
                          <ShieldCheck size={14} /> Rationale
                        </span>
                        <span className="spec-value text-emerald-600 font-semibold">Included</span>
                      </div>
                    </div>

                    {/* Addon details / status if applicable */}
                    {exam.addon_enabled && !exam.addonPurchased && !unlockingExamIds.has(exam.id) && (
                      <div className="addon-notice-box">
                        <span className="addon-tag">Premium Add-on Required</span>
                        <p className="addon-desc">
                          {exam.addon_price_display ? `Special Addon Price: ${exam.addon_price_display}. ` : ''}
                          {exam.addonExpired
                            ? 'Your previous addon subscription has expired.'
                            : 'Unlock this specialized test module.'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="exam-card-actions">
                    {packageLocked ? (
                      <Link
                        to="/packages"
                        className="start-exam-button start-exam-button--secondary"
                        id={`btn-renew-${exam.id}`}
                      >
                        <Lock size={15} /> Renew Package to Unlock
                      </Link>
                    ) : exam.addon_enabled && !exam.addonPurchased && !unlockingExamIds.has(exam.id) ? (
                      <button
                        type="button"
                        className="start-exam-button start-exam-button--addon"
                        onClick={() => handleAddonPurchase(exam)}
                        disabled={activeAddonExamId === exam.id}
                        id={`btn-addon-${exam.id}`}
                      >
                        {activeAddonExamId === exam.id ? (
                          'Opening Checkout...'
                        ) : exam.addonExpired ? (
                          <>
                            <RotateCcw size={15} /> Renew Addon to Start
                          </>
                        ) : (
                          <>
                            <Sparkles size={15} /> Buy Addon to Start
                          </>
                        )}
                      </button>
                    ) : (
                      <Link
                        to={`/exams/${exam.id}`}
                        className="start-exam-button"
                        id={`btn-start-${exam.id}`}
                      >
                        Start Exam <ArrowRight size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExamList;
