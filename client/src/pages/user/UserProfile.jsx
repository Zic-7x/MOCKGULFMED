import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { format, addMonths, startOfMonth } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  bookMyExternalExamPaid,
  fetchUserExternalExamDetails,
  getHealthAuthorities,
} from '../../utils/supabaseQueries';
import {
  getExternalExamStatusLabel,
  getExternalExamStatusPillClass,
  normalizeExternalExamStatusCode,
} from '../../constants/externalExamStatus';
import toast from 'react-hot-toast';
import { useMemo, useState } from 'react';
import './UserProfile.css';

const FREEMIUS_PRODUCT_ID = import.meta.env.VITE_FREEMIUS_PRODUCT_ID || '27532';
const FREEMIUS_PUBLIC_KEY = import.meta.env.VITE_FREEMIUS_PUBLIC_KEY || '';
const FREEMIUS_IMAGE = import.meta.env.VITE_FREEMIUS_IMAGE || '';
const EXTERNAL_EXAM_BOOKING_PLAN_ID = import.meta.env.VITE_EXTERNAL_EXAM_BOOKING_PLAN_ID || '';

let freemiusScriptPromise;

function ensureFreemiusCheckoutScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Checkout can only run in the browser.'));
  }
  if (window.FS?.Checkout) return Promise.resolve(window.FS);
  if (freemiusScriptPromise) return freemiusScriptPromise;

  freemiusScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-freemius-checkout="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.FS), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load checkout script.')), {
        once: true,
      });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.freemius.com/js/v1/';
    script.async = true;
    script.dataset.freemiusCheckout = 'true';
    script.onload = () => resolve(window.FS);
    script.onerror = () => reject(new Error('Failed to load checkout script.'));
    document.body.appendChild(script);
  });

  return freemiusScriptPromise;
}

const formatExamDate = (d) => {
  if (!d) return '—';
  try {
    const parsed = typeof d === 'string' ? new Date(d + (d.length === 10 ? 'T12:00:00' : '')) : new Date(d);
    if (Number.isNaN(parsed.getTime())) return d;
    return format(parsed, 'MMMM d, yyyy');
  } catch {
    return d;
  }
};

/** DB column is `exam_pass_print_enabled` (migration 025); name is historical. */
function isExamDetailsPrintEnabled(row) {
  if (!row) return true;
  if (row.exam_pass_print_enabled !== undefined && row.exam_pass_print_enabled !== null) {
    return !!row.exam_pass_print_enabled;
  }
  if (row.exam_details_print_enabled !== undefined && row.exam_details_print_enabled !== null) {
    return !!row.exam_details_print_enabled;
  }
  return true;
}

const UserProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [bookingAddress, setBookingAddress] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingNationalId, setBookingNationalId] = useState('');
  const [bookingCountry, setBookingCountry] = useState('');
  const [bookingHealthAuthorityId, setBookingHealthAuthorityId] = useState('');

  const { data: examDetails, isLoading } = useQuery({
    queryKey: ['userExternalExamDetails', user?.id],
    queryFn: () => fetchUserExternalExamDetails(user.id),
    enabled: !!user?.id,
  });

  const { data: healthAuthorities } = useQuery({
    queryKey: ['healthAuthoritiesPublic'],
    queryFn: getHealthAuthorities,
  });

  const minBookDate = useMemo(() => {
    const d = addMonths(startOfMonth(new Date()), 2);
    return format(d, 'yyyy-MM-dd');
  }, []);

  const countries = useMemo(() => {
    const set = new Set();
    for (const ha of healthAuthorities || []) {
      if (ha?.country) set.add(String(ha.country));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [healthAuthorities]);

  const authoritiesForCountry = useMemo(() => {
    const c = String(bookingCountry || '').trim();
    if (!c) return [];
    return (healthAuthorities || []).filter((ha) => String(ha?.country || '').trim() === c);
  }, [healthAuthorities, bookingCountry]);

  const selectedAuthority = useMemo(() => {
    const id = String(bookingHealthAuthorityId || '');
    return authoritiesForCountry.find((ha) => String(ha.id) === id) || null;
  }, [authoritiesForCountry, bookingHealthAuthorityId]);

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!FREEMIUS_PUBLIC_KEY || !FREEMIUS_PRODUCT_ID) {
        throw new Error('Checkout is not configured yet. Please contact support.');
      }
      if (!EXTERNAL_EXAM_BOOKING_PLAN_ID) {
        throw new Error('Exam booking plan is not configured yet. Please contact support.');
      }
      const FS = await ensureFreemiusCheckoutScript();
      return await new Promise((resolve, reject) => {
        const handler = new FS.Checkout({
          product_id: String(FREEMIUS_PRODUCT_ID),
          plan_id: String(EXTERNAL_EXAM_BOOKING_PLAN_ID),
          public_key: FREEMIUS_PUBLIC_KEY,
          image: FREEMIUS_IMAGE || undefined,
        });
        handler.open({
          name: 'Exam Booking',
          licenses: 1,
          purchaseCompleted: async (response) => {
            try {
              const externalRef =
                response?.subscription?.id ||
                response?.license?.id ||
                response?.license?.key ||
                response?.order?.id ||
                null;
              const row = await bookMyExternalExamPaid({
                examDate: bookingDate,
                applicantAddress: bookingAddress,
                applicantNationalId: bookingNationalId,
                healthAuthorityCountry: bookingCountry,
                healthAuthorityId: bookingHealthAuthorityId,
                externalRef: externalRef || null,
              });
              resolve(row);
            } catch (err) {
              reject(err);
            }
          },
        });
      });
    },
    onSuccess: async () => {
      toast.success('Payment completed. Your exam booking details are saved.');
      await queryClient.invalidateQueries({ queryKey: ['userExternalExamDetails', user?.id] });
      await queryClient.invalidateQueries({ queryKey: ['userDashboard', user?.id] });
    },
    onError: (e) => {
      toast.error(e.message || 'Could not book exam date');
    },
  });

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  const sectionOn = examDetails?.section_enabled === true;
  const detailsPrintAllowed = isExamDetailsPrintEnabled(examDetails);

  const handlePrintDetails = () => {
    window.print();
  };

  const statusCode = normalizeExternalExamStatusCode(examDetails?.exam_status);
  const statusLabel =
    getExternalExamStatusLabel(statusCode) ||
    (examDetails?.exam_status && String(examDetails.exam_status).trim()) ||
    null;
  const statusPillClass = statusCode ? getExternalExamStatusPillClass(statusCode) : 'exam-status-pill--neutral';
  const pending = 'Yet to be issued';
  const showOrPending = (v) => (v && String(v).trim() ? v : pending);

  return (
    <Layout>
      <div className="user-profile-page">
        <h1>Profile</h1>
        <p className="user-profile-subtitle">
          Account details and your official licensing exam booking (Prometric / Pearson), when applicable.
        </p>

        {!sectionOn && (
          <div className="user-profile-empty">
            <p>
              <strong>Official exam booking (Prometric / Pearson)</strong>
            </p>
            <p>
              This section is not active on your account yet. When you book an official exam through our platform,
              your administrator will enable it here and you will see confirmation details, IDs, and your exam pass
              when available.
            </p>

            <div className="user-profile-booking no-print">
              <h3>Book your exam date</h3>
              <p className="hint">
                You can select a date starting from <strong>{format(new Date(minBookDate), 'MMMM d, yyyy')}</strong> (two
                months after the current month). Admin will issue the remaining exam details later.
              </p>
              <div className="form-group">
                <label>Applicant name</label>
                <input type="text" value={user?.fullName || ''} disabled />
              </div>
              <div className="form-group">
                <label>Exam date</label>
                <input
                  type="date"
                  min={minBookDate}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Health Authority Country</label>
                <select
                  value={bookingCountry}
                  onChange={(e) => {
                    const c = e.target.value;
                    setBookingCountry(c);
                    const list = (healthAuthorities || []).filter(
                      (ha) => String(ha?.country || '').trim() === String(c || '').trim()
                    );
                    const first = list?.[0]?.id ? String(list[0].id) : '';
                    setBookingHealthAuthorityId(first);
                  }}
                >
                  <option value="">Select country</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <p className="hint">
                  When you select a country, we automatically pick the first matching health authority.
                </p>
              </div>
              <div className="form-group">
                <label>Health Authority</label>
                <input type="text" value={selectedAuthority?.name || ''} disabled />
              </div>
              <div className="form-group">
                <label>CNIC / National ID number</label>
                <input
                  type="text"
                  value={bookingNationalId}
                  onChange={(e) => setBookingNationalId(e.target.value)}
                  placeholder="Enter your CNIC / National ID"
                />
              </div>
              <div className="form-group">
                <label>Applicant address</label>
                <textarea
                  rows={3}
                  value={bookingAddress}
                  onChange={(e) => setBookingAddress(e.target.value)}
                  placeholder="Enter your full address exactly as required by the exam authority"
                />
              </div>
              <div className="official-exam-actions">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={
                    bookMutation.isPending ||
                    !bookingDate ||
                    bookingDate < minBookDate ||
                    !bookingCountry.trim() ||
                    !bookingHealthAuthorityId ||
                    !bookingNationalId.trim() ||
                    !bookingAddress.trim()
                  }
                  onClick={() => bookMutation.mutate()}
                >
                  {bookMutation.isPending ? 'Opening checkout…' : 'Pay & book exam'}
                </button>
              </div>
            </div>
          </div>
        )}

        {sectionOn && (
          <>
            <div className="official-exam-notice no-print">
              <strong>Important information</strong>
              <ul>
                <li>Exam passes are typically issued 48 hours or less before your exam date.</li>
                <li>All examination vouchers are non-refundable.</li>
                <li>Exam dates may be rescheduled by the examination authority more than once.</li>
              </ul>
            </div>

            <div className="official-exam-card exam-print-area">
              <h2>Official exam booking (Prometric / Pearson)</h2>
              <p className="user-profile-subtitle" style={{ marginTop: '-8px', marginBottom: '16px' }}>
                These details are for your real licensing exam arranged through our platform—not mock exams on this
                site.
              </p>

              {examDetails?.announcement && (
                <div className="official-exam-announcement" aria-live="polite">
                  <strong>Message from your administrator</strong>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{examDetails.announcement}</div>
                </div>
              )}

              <dl className="official-exam-dl">
                <div>
                  <dt>Applicant name</dt>
                  <dd>{examDetails?.applicant_name || user?.fullName || '—'}</dd>
                </div>
                <div>
                  <dt>Applicant address</dt>
                  <dd style={{ whiteSpace: 'pre-wrap' }}>{examDetails?.applicant_address || pending}</dd>
                </div>
                <div>
                  <dt>CNIC / National ID</dt>
                  <dd>{examDetails?.applicant_national_id || pending}</dd>
                </div>
                <div>
                  <dt>Health authority</dt>
                  <dd>{showOrPending(examDetails?.exam_health_authority)}</dd>
                </div>
                <div>
                  <dt>Examination authority</dt>
                  <dd>{showOrPending(examDetails?.examination_authority)}</dd>
                </div>
                <div>
                  <dt>Exam date</dt>
                  <dd>{examDetails?.exam_date ? formatExamDate(examDetails.exam_date) : pending}</dd>
                </div>
                <div>
                  <dt>Exam time</dt>
                  <dd>{showOrPending(examDetails?.exam_time)}</dd>
                </div>
                <div>
                  <dt>Exam status</dt>
                  <dd>
                    {statusLabel ? (
                      <span className={`exam-status-pill ${statusPillClass}`}>{statusLabel}</span>
                    ) : (
                      pending
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Exam confirmation / registration ID</dt>
                  <dd>{showOrPending(examDetails?.registration_id)}</dd>
                </div>
                <div>
                  <dt>Exam candidate / eligibility ID</dt>
                  <dd>{showOrPending(examDetails?.candidate_eligibility_id)}</dd>
                </div>
                <div>
                  <dt>Payment status</dt>
                  <dd>
                    {examDetails?.booking_payment_verified
                      ? 'Paid (verified)'
                      : examDetails?.booking_payment_status
                        ? String(examDetails.booking_payment_status)
                        : pending}
                  </dd>
                </div>
              </dl>

              <div className="official-exam-actions no-print">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!detailsPrintAllowed}
                  title={
                    detailsPrintAllowed
                      ? 'Print this summary from your browser'
                      : 'Printing is disabled by your administrator.'
                  }
                  onClick={handlePrintDetails}
                >
                  Print exam details
                </button>
              </div>

              {!detailsPrintAllowed && (
                <p className="official-exam-muted no-print">
                  Printing exam details is currently disabled by your administrator. Ask them if you need a paper
                  copy.
                </p>
              )}
              {!(examDetails?.exam_pass_storage_path || '').trim() ? (
                <p className="official-exam-muted no-print">
                  Your exam pass file will appear here once your administrator uploads it (often within 48 hours of your
                  exam). You can print this summary with Print exam details.
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default UserProfile;
