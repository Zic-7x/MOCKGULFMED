/** Stored in `user_external_exam_details.exam_status` (and chosen in admin UI). */
export const EXTERNAL_EXAM_STATUS = {
  SCHEDULED: 'SCHEDULED',
  CANCELLED: 'CANCELLED',
  RESCHEDULED: 'RESCHEDULED',
  COMPLETED: 'COMPLETED',
  NOT_APPEARED: 'NOT_APPEARED',
};

export const EXTERNAL_EXAM_STATUS_OPTIONS = [
  { value: '', label: '— Not set —' },
  { value: EXTERNAL_EXAM_STATUS.SCHEDULED, label: 'Scheduled', pillClass: 'exam-status-pill--scheduled' },
  { value: EXTERNAL_EXAM_STATUS.CANCELLED, label: 'Cancelled', pillClass: 'exam-status-pill--cancelled' },
  { value: EXTERNAL_EXAM_STATUS.RESCHEDULED, label: 'Rescheduled', pillClass: 'exam-status-pill--rescheduled' },
  { value: EXTERNAL_EXAM_STATUS.COMPLETED, label: 'Completed', pillClass: 'exam-status-pill--completed' },
  { value: EXTERNAL_EXAM_STATUS.NOT_APPEARED, label: 'Not appeared', pillClass: 'exam-status-pill--not-appeared' },
];

const LEGACY_ALIASES = {
  SCHEDULED: EXTERNAL_EXAM_STATUS.SCHEDULED,
  CANCELLED: EXTERNAL_EXAM_STATUS.CANCELLED,
  RESCHEDULED: EXTERNAL_EXAM_STATUS.RESCHEDULED,
  COMPLETED: EXTERNAL_EXAM_STATUS.COMPLETED,
  'NOT APPEARED': EXTERNAL_EXAM_STATUS.NOT_APPEARED,
};

/** Normalize DB or legacy free text to a known code, or null if unknown. */
export function normalizeExternalExamStatusCode(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const upper = s.toUpperCase();
  if (LEGACY_ALIASES[upper]) return LEGACY_ALIASES[upper];
  const underscored = upper.replace(/\s+/g, '_');
  if (LEGACY_ALIASES[underscored]) return LEGACY_ALIASES[underscored];
  if (Object.values(EXTERNAL_EXAM_STATUS).includes(upper)) return upper;
  return null;
}

export function getExternalExamStatusLabel(code) {
  const opt = EXTERNAL_EXAM_STATUS_OPTIONS.find((o) => o.value === code);
  return opt?.label || null;
}

export function getExternalExamStatusPillClass(code) {
  const opt = EXTERNAL_EXAM_STATUS_OPTIONS.find((o) => o.value === code);
  return opt?.pillClass || 'exam-status-pill--neutral';
}

/** True if any booking field is filled (used to warn admin when profile visibility is off). */
export function externalExamHasPublishableContent(f) {
  if (!f) return false;
  const t = (x) => typeof x === 'string' && x.trim() !== '';
  return (
    t(f.applicantName) ||
    t(f.applicantAddress) ||
    t(f.applicantNationalId) ||
    t(f.bookingHealthAuthorityCountry) ||
    t(f.bookingHealthAuthorityId) ||
    t(f.examHealthAuthority) ||
    t(f.examinationAuthority) ||
    t(f.examDate) ||
    t(f.examTime) ||
    t(f.examStatus) ||
    t(f.registrationId) ||
    t(f.candidateEligibilityId) ||
    t(f.bookingPaymentStatus) ||
    t(f.bookingPaymentExternalRef) ||
    t(f.bookingPaidAt) ||
    !!f.bookingPaymentVerified ||
    t(f.bookingPaymentVerifiedAt) ||
    t(f.announcement) ||
    !!f.examPassStoragePath
  );
}
