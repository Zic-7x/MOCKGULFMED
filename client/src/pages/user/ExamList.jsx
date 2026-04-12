import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
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
        <div className="exam-list">
          <h1>Available Exams</h1>
          <div className="no-exams">
            <p>
              <strong>Subscription required.</strong> Complete your package purchase to unlock exams and your daily
              MCQ allowance.
            </p>
            <p>
              <Link to="/packages" className="start-exam-button" style={{ display: 'inline-block', marginTop: '1rem' }}>
                View packages &amp; pay
              </Link>
            </p>
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
        {renewalWarning && (
          <div className="exam-list-banner exam-list-banner--warning" role="status">
            <strong>Your package access is ending soon.</strong>{' '}
            {renewalWarning.daysRemaining === 1
              ? 'Access expires tomorrow.'
              : `About ${renewalWarning.daysRemaining} days left.`}{' '}
            Renew now to avoid interruption.
            <Link to="/packages" className="exam-list-banner-link">
              Renew package
            </Link>
          </div>
        )}
        {packageLocked && (
          <div className="exam-list-banner exam-list-banner--locked" role="status">
            <strong>Your package access has ended.</strong> Your account and past exam activity are still here — renew your
            package to unlock exams again.
            <Link to="/packages" className="exam-list-banner-link">
              Renew package
            </Link>
          </div>
        )}
        {exams && exams.length === 0 ? (
          <div className="no-exams">
            <p>No exams are available for your profession yet. Please contact support if you believe this is a mistake.</p>
          </div>
        ) : (
          <div className="exams-grid">
            {exams?.map((exam) => (
              <div
                key={exam.id}
                className={`exam-card${packageLocked ? ' exam-card--locked' : ''}`}
              >
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
                {packageLocked ? (
                  <Link to="/packages" className="start-exam-button start-exam-button--secondary">
                    Renew package to unlock
                  </Link>
                ) : exam.addon_enabled && !exam.addonPurchased && !unlockingExamIds.has(exam.id) ? (
                  <>
                    <p className="exam-description">
                      Addon required{exam.addon_price_display ? `: ${exam.addon_price_display}` : ''}.
                      {exam.addonExpired ? ' Your previous addon period has ended.' : ''}
                    </p>
                    <button
                      type="button"
                      className="start-exam-button"
                      onClick={() => handleAddonPurchase(exam)}
                      disabled={activeAddonExamId === exam.id}
                    >
                      {activeAddonExamId === exam.id
                        ? 'Opening Checkout...'
                        : exam.addonExpired
                          ? 'Renew addon to start'
                          : 'Buy addon to start'}
                    </button>
                  </>
                ) : (
                  <Link to={`/exams/${exam.id}`} className="start-exam-button">
                    Start exam
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExamList;
