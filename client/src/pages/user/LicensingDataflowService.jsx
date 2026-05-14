import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import logoUrl from '../../image/Gemini_Generated_Image_wtgqj3wtgqj3wtgq-removebg-preview.png';
import {
  MAX_EXPERIENCE_LETTER_SLOTS,
  QUALIFICATIONS,
  ATTESTATION_OPTIONS,
  EMPTY_CREDENTIAL_FILES,
  DocHint,
  OptionalFileField,
  CredentialUploadPanel,
  graduationYearQuestion,
  degreeIssuedYearQuestion,
  attestationReviewLabel,
  yesNoLabel,
} from '../../components/eligibility/EligibilityDocumentWidgets';
import {
  getProfessions,
  getHealthAuthorities,
  submitLicensingDataflowServiceRequest,
  LICENSING_DATAFLOW_SERVICE_KIND,
  updateMyProfessionAndHealthAuthority,
} from '../../utils/supabaseQueries';
import { syncFreemiusEntitlement } from '../../utils/freemiusEntitlementSync';
import './EligibilityAssessment.css';
import './LicensingDataflowService.css';

const FREEMIUS_PRODUCT_ID = import.meta.env.VITE_FREEMIUS_PRODUCT_ID || '27532';
const FREEMIUS_PUBLIC_KEY = import.meta.env.VITE_FREEMIUS_PUBLIC_KEY || '';
const FREEMIUS_IMAGE = import.meta.env.VITE_FREEMIUS_IMAGE || '';
const FREEMIUS_WEBHOOK_API_URL = import.meta.env.VITE_FREEMIUS_WEBHOOK_API_URL || '/api/freemius-webhook';
const PLAN_LICENSE_AND_DATAFLOW = import.meta.env.VITE_FREEMIUS_LICENSING_DATAFLOW_PLAN_ID || '48757';
const PLAN_DATAFLOW_ONLY = import.meta.env.VITE_FREEMIUS_DATAFLOW_SERVICE_PLAN_ID || '48756';

const DOC_HINT_ID = 'ldf-doc-hint';

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

function formatMonth(value) {
  if (!value || typeof value !== 'string') return '—';
  const [y, m] = value.split('-');
  if (!y || !m) return value;
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const idx = parseInt(m, 10) - 1;
  if (idx < 0 || idx > 11) return value;
  return `${monthNames[idx]} ${y}`;
}

function serviceTitle(kind) {
  if (kind === LICENSING_DATAFLOW_SERVICE_KIND.DATAFLOW_ONLY) return 'Dataflow process service';
  return 'Licensing and Dataflow process service';
}

export default function LicensingDataflowService() {
  const { user, refreshUserProfile } = useAuth();
  const [phase, setPhase] = useState('pick');
  const [serviceKind, setServiceKind] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const [qualificationLevel, setQualificationLevel] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [degreeIssuedYear, setDegreeIssuedYear] = useState('');
  const [graduationYearDoc, setGraduationYearDoc] = useState(null);
  const [degreeIssuedYearDoc, setDegreeIssuedYearDoc] = useState(null);
  const [credentialFiles, setCredentialFiles] = useState(() => ({ ...EMPTY_CREDENTIAL_FILES }));
  const [documentAttestation, setDocumentAttestation] = useState('');
  const [hasHealthLicense, setHasHealthLicense] = useState('');
  const [healthLicenseFile, setHealthLicenseFile] = useState(null);
  const [experienceStart, setExperienceStart] = useState('');
  const [experienceEnd, setExperienceEnd] = useState('');
  const [stillWorking, setStillWorking] = useState(false);
  const [multipleExperienceLetters, setMultipleExperienceLetters] = useState('');
  const [experienceLetterFiles, setExperienceLetterFiles] = useState([null]);
  const [localProfessionId, setLocalProfessionId] = useState('');
  const [localHealthAuthorityId, setLocalHealthAuthorityId] = useState('');

  const prevQualificationRef = useRef(qualificationLevel);

  const { data: professions = [] } = useQuery({
    queryKey: ['professions'],
    queryFn: getProfessions,
    enabled: !!user?.id && phase === 'documents',
  });

  const { data: healthAuthorities = [] } = useQuery({
    queryKey: ['healthAuthorities'],
    queryFn: getHealthAuthorities,
    enabled: !!user?.id && phase === 'documents',
  });

  useEffect(() => {
    if (user?.profession_id) {
      setLocalProfessionId((curr) => (curr ? curr : String(user.profession_id)));
    }
    if (user?.health_authority_id) {
      setLocalHealthAuthorityId((curr) => (curr ? curr : String(user.health_authority_id)));
    }
  }, [user?.profession_id, user?.health_authority_id]);

  useEffect(() => {
    const prev = prevQualificationRef.current;
    if (prev && prev !== qualificationLevel) {
      setCredentialFiles({ ...EMPTY_CREDENTIAL_FILES });
    }
    prevQualificationRef.current = qualificationLevel;
  }, [qualificationLevel]);

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    const list = [];
    for (let i = y; i >= 1970; i -= 1) list.push(i);
    return list;
  }, []);

  const professionName = useMemo(() => {
    const p = professions.find((x) => String(x.id) === String(localProfessionId));
    return p?.name || '—';
  }, [professions, localProfessionId]);

  const healthAuthorityName = useMemo(() => {
    const h = healthAuthorities.find((x) => String(x.id) === String(localHealthAuthorityId));
    return h?.name || '—';
  }, [healthAuthorities, localHealthAuthorityId]);

  const qualificationLabel = useMemo(() => {
    const q = QUALIFICATIONS.find((x) => x.value === qualificationLevel);
    return q?.label || '—';
  }, [qualificationLevel]);

  const yearsInconsistent = useMemo(() => {
    if (!graduationYear || !degreeIssuedYear) return false;
    return Number(degreeIssuedYear) < Number(graduationYear);
  }, [graduationYear, degreeIssuedYear]);

  const experienceRangeInvalid = useMemo(() => {
    if (stillWorking || !experienceStart || !experienceEnd) return false;
    return experienceEnd < experienceStart;
  }, [stillWorking, experienceStart, experienceEnd]);

  const uploadedDocCount = useMemo(() => {
    const credCount = Object.values(credentialFiles).filter(Boolean).length;
    const files = [graduationYearDoc, degreeIssuedYearDoc, healthLicenseFile, ...experienceLetterFiles];
    return credCount + files.filter(Boolean).length;
  }, [credentialFiles, graduationYearDoc, degreeIssuedYearDoc, healthLicenseFile, experienceLetterFiles]);

  const credentialSummaryRows = useMemo(() => {
    const f = credentialFiles;
    const lvl = qualificationLevel;
    if (lvl === 'DIPLOMA') {
      return [
        ['Diploma certificate', f.diplomaCertificate],
        ['Diploma / programme transcript', f.diplomaTranscript],
      ];
    }
    if (lvl === 'BACHELOR') {
      return [
        ["Bachelor's (BS) degree", f.bsDegree],
        ["Bachelor's (BS) transcript", f.bsTranscript],
      ];
    }
    if (lvl === 'MASTERS') {
      return [
        ["Bachelor's (BS) degree", f.bsDegree],
        ["Bachelor's (BS) transcript", f.bsTranscript],
        ["Master's degree", f.mastersDegree],
        ["Master's transcript", f.mastersTranscript],
      ];
    }
    if (lvl === 'PHD') {
      return [
        ["Bachelor's (BS) degree", f.bsDegree],
        ["Bachelor's (BS) transcript", f.bsTranscript],
        ["Master's degree", f.mastersDegree],
        ["Master's transcript", f.mastersTranscript],
        ['PhD / doctorate degree', f.phdDegree],
        ['PhD / doctorate transcript', f.phdTranscript],
      ];
    }
    return [];
  }, [qualificationLevel, credentialFiles]);

  const expectedPlanId = useMemo(() => {
    if (serviceKind === LICENSING_DATAFLOW_SERVICE_KIND.DATAFLOW_ONLY) return PLAN_DATAFLOW_ONLY;
    return PLAN_LICENSE_AND_DATAFLOW;
  }, [serviceKind]);

  const freemiusReady = useMemo(
    () => Boolean(FREEMIUS_PUBLIC_KEY && FREEMIUS_PRODUCT_ID && expectedPlanId),
    [expectedPlanId]
  );

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      if (!localProfessionId || !localHealthAuthorityId) {
        throw new Error('Select both profession and health authority.');
      }
      await updateMyProfessionAndHealthAuthority(localProfessionId, localHealthAuthorityId);
      await refreshUserProfile();
    },
    onSuccess: () => toast.success('Profile updated.'),
    onError: (err) => toast.error(err.message || 'Could not update profile'),
  });

  const submitDocsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not logged in');
      if (!localProfessionId || !localHealthAuthorityId) {
        throw new Error('Please select your profession and health authority.');
      }
      if (!qualificationLevel) throw new Error('Select your highest qualification.');
      if (!graduationYear || !degreeIssuedYear) throw new Error('Select graduation and degree issue years.');
      if (!documentAttestation) throw new Error('Select document attestation status.');
      if (hasHealthLicense !== 'yes' && hasHealthLicense !== 'no') {
        throw new Error('Answer whether you have a national health license.');
      }
      if (!experienceStart) throw new Error('Enter your experience start month.');
      if (!stillWorking && !experienceEnd) throw new Error('Enter an end month or mark “still working”.');
      if (experienceRangeInvalid) throw new Error('Experience end must be the same month or after the start.');
      if (multipleExperienceLetters !== 'yes' && multipleExperienceLetters !== 'no') {
        throw new Error('Answer whether you have more than one experience letter.');
      }
      if (
        localProfessionId !== String(user.profession_id ?? '') ||
        localHealthAuthorityId !== String(user.health_authority_id ?? '')
      ) {
        await updateMyProfessionAndHealthAuthority(localProfessionId, localHealthAuthorityId);
        await refreshUserProfile();
      }
      return submitLicensingDataflowServiceRequest(user.id, {
        serviceKind,
        expectedFreemiusPlanId: expectedPlanId,
        qualificationLevel,
        professionId: localProfessionId,
        healthAuthorityId: localHealthAuthorityId,
        graduationYear: graduationYear ? Number(graduationYear) : null,
        degreeIssuedYear: degreeIssuedYear ? Number(degreeIssuedYear) : null,
        graduationYearDoc,
        degreeIssuedYearDoc,
        credentialFiles,
        documentAttestation,
        hasHealthLicense,
        healthLicenseFile,
        experienceStart,
        experienceEnd,
        stillWorking,
        multipleExperienceLetters,
        experienceLetterFiles,
      });
    },
    onSuccess: (res) => {
      setRequestId(res.id);
      setPhase('pay');
      toast.success('Documents received. Complete the service fee to confirm your request.');
    },
    onError: (err) => toast.error(err.message || 'Submission failed'),
  });

  const setLetterFile = useCallback((index, file) => {
    setExperienceLetterFiles((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
  }, []);

  const onMultipleLettersChange = useCallback((val) => {
    setMultipleExperienceLetters(val);
    if (val === 'yes') {
      setExperienceLetterFiles((prev) => (prev.length < 2 ? [null, null] : prev));
    } else {
      setExperienceLetterFiles([null]);
    }
  }, []);

  const addLetterSlot = useCallback(() => {
    setExperienceLetterFiles((prev) => {
      if (prev.length >= MAX_EXPERIENCE_LETTER_SLOTS) {
        toast.error(`You can add up to ${MAX_EXPERIENCE_LETTER_SLOTS} experience letter slots.`);
        return prev;
      }
      return [...prev, null];
    });
  }, []);

  const handlePickContinue = () => {
    if (!serviceKind) {
      toast.error('Choose which service you need.');
      return;
    }
    setPhase('documents');
  };

  const handleDocumentsSubmit = () => {
    if (yearsInconsistent) {
      toast('Please double-check: degree issue year is usually the same as or after graduation year.', {
        icon: '⚠️',
      });
    }
    submitDocsMutation.mutate();
  };

  const openCheckout = async () => {
    if (!user?.id || !requestId) return;
    if (!freemiusReady) {
      toast.error('Checkout is not configured. Set VITE_FREEMIUS_PUBLIC_KEY and plan IDs.');
      return;
    }
    try {
      setCheckoutBusy(true);
      const FS = await ensureFreemiusCheckoutScript();
      const handler = new FS.Checkout({
        product_id: String(FREEMIUS_PRODUCT_ID),
        plan_id: String(expectedPlanId),
        public_key: FREEMIUS_PUBLIC_KEY,
        image: FREEMIUS_IMAGE || logoUrl || undefined,
      });
      handler.open({
        name: serviceTitle(serviceKind),
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
              userId: user.id,
              scope: 'SERVICE_PAYMENT',
              licensingDataflowRequestId: requestId,
              externalRef: externalRef || null,
            },
            FREEMIUS_WEBHOOK_API_URL
          )
            .then(() => {
              toast.success('Payment recorded. Our team will follow up on your request.');
              setPhase('done');
            })
            .catch((syncErr) => {
              toast.error(syncErr?.message || 'Payment sync failed. Contact support with your receipt.');
            });
        },
        success: () => {},
      });
    } catch (e) {
      toast.error(e?.message || 'Could not open checkout.');
    } finally {
      setCheckoutBusy(false);
    }
  };

  if (!user?.id) {
    return <Navigate to="/login" replace state={{ from: '/services/licensing-dataflow' }} />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  const profileComplete = !!localProfessionId && !!localHealthAuthorityId;
  const documentsValid =
    profileComplete &&
    !!qualificationLevel &&
    !!graduationYear &&
    !!degreeIssuedYear &&
    !!documentAttestation &&
    (hasHealthLicense === 'yes' || hasHealthLicense === 'no') &&
    !!experienceStart &&
    (stillWorking || !!experienceEnd) &&
    !experienceRangeInvalid &&
    (multipleExperienceLetters === 'yes' || multipleExperienceLetters === 'no');

  return (
    <Layout>
      <div className="eligibility-page ldf-page">
        <header className="eligibility-header">
          <h1>Licensing &amp; Dataflow services</h1>
          <p className="eligibility-sub">
            Choose your service, upload the same credential pack we use for eligibility screening, then pay the
            service fee securely through Freemius. You can complete this in one visit.
          </p>
          <ol className="ldf-stepper" aria-label="Progress">
            <li className={phase === 'pick' ? 'ldf-step ldf-step--current' : 'ldf-step ldf-step--done'}>
              <span className="ldf-step-num">1</span>
              <span>Service</span>
            </li>
            <li className={phase === 'documents' ? 'ldf-step ldf-step--current' : phase === 'pick' ? 'ldf-step' : 'ldf-step ldf-step--done'}>
              <span className="ldf-step-num">2</span>
              <span>Documents</span>
            </li>
            <li className={phase === 'pay' ? 'ldf-step ldf-step--current' : phase === 'done' ? 'ldf-step ldf-step--done' : 'ldf-step'}>
              <span className="ldf-step-num">3</span>
              <span>Payment</span>
            </li>
          </ol>
        </header>

        {phase === 'pick' && (
          <div className="eligibility-card">
            <h2 className="eligibility-step-heading">Which service do you need?</h2>
            <p className="eligibility-sub" style={{ marginTop: 0 }}>
              Pricing is set in your Freemius dashboard per plan. Combined licensing support includes Dataflow
              coordination; Dataflow-only is for applicants who already hold licensing support elsewhere.
            </p>
            <div className="ldf-service-grid" role="radiogroup" aria-label="Service type">
              <label
                className={`ldf-service-card ${serviceKind === LICENSING_DATAFLOW_SERVICE_KIND.LICENSING_AND_DATAFLOW ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="ldf-svc"
                  checked={serviceKind === LICENSING_DATAFLOW_SERVICE_KIND.LICENSING_AND_DATAFLOW}
                  onChange={() => setServiceKind(LICENSING_DATAFLOW_SERVICE_KIND.LICENSING_AND_DATAFLOW)}
                />
                <span className="ldf-service-title">Licensing + Dataflow</span>
                <span className="ldf-service-desc">
                  Full pathway support including Dataflow / PSV document handling after we receive your file.
                </span>
                <span className="ldf-service-meta">Includes licensing coordination and Dataflow / PSV support.</span>
              </label>
              <label
                className={`ldf-service-card ${serviceKind === LICENSING_DATAFLOW_SERVICE_KIND.DATAFLOW_ONLY ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="ldf-svc"
                  checked={serviceKind === LICENSING_DATAFLOW_SERVICE_KIND.DATAFLOW_ONLY}
                  onChange={() => setServiceKind(LICENSING_DATAFLOW_SERVICE_KIND.DATAFLOW_ONLY)}
                />
                <span className="ldf-service-title">Dataflow only</span>
                <span className="ldf-service-desc">
                  You only need Dataflow / PSV process support; licensing steps are not part of this request.
                </span>
                <span className="ldf-service-meta">Dataflow / PSV only — no bundled licensing coordination.</span>
              </label>
            </div>
            <div className="eligibility-profile-actions" style={{ marginTop: 20 }}>
              <button type="button" className="eligibility-btn primary" onClick={handlePickContinue}>
                Continue to documents
              </button>
              <Link to="/dashboard" className="eligibility-btn secondary">
                Back to dashboard
              </Link>
            </div>
          </div>
        )}

        {phase === 'documents' && (
          <div className="eligibility-card">
            <p className="eligibility-step-kicker">Step 2 · Same checklist as eligibility assessment</p>
            <h2 className="eligibility-step-heading">Upload documents &amp; details</h2>
            <p className="eligibility-sub" style={{ marginTop: 0 }}>
              Request: <strong>{serviceTitle(serviceKind)}</strong>. Files are stored privately for operations; you
              will pay the service fee on the next step.
            </p>

            <section className="eligibility-section eligibility-profile-section" aria-labelledby="ldf-profile-heading">
              <h2 id="ldf-profile-heading">Profession &amp; health authority</h2>
              <div className="eligibility-row">
                <div className="eligibility-field">
                  <label htmlFor="ldf-profession" className="eligibility-label">
                    Profession<span className="eligibility-req"> *</span>
                  </label>
                  <select
                    id="ldf-profession"
                    className="eligibility-select"
                    value={localProfessionId}
                    onChange={(e) => setLocalProfessionId(e.target.value)}
                    required
                  >
                    <option value="">Select profession</option>
                    {professions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="eligibility-field">
                  <label htmlFor="ldf-ha" className="eligibility-label">
                    Health authority<span className="eligibility-req"> *</span>
                  </label>
                  <select
                    id="ldf-ha"
                    className="eligibility-select"
                    value={localHealthAuthorityId}
                    onChange={(e) => setLocalHealthAuthorityId(e.target.value)}
                    required
                  >
                    <option value="">Select health authority</option>
                    {healthAuthorities.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="eligibility-profile-actions">
                <button
                  type="button"
                  className="eligibility-btn secondary"
                  disabled={
                    saveProfileMutation.isPending ||
                    !localProfessionId ||
                    !localHealthAuthorityId ||
                    (localProfessionId === String(user.profession_id ?? '') &&
                      localHealthAuthorityId === String(user.health_authority_id ?? ''))
                  }
                  onClick={() => saveProfileMutation.mutate()}
                >
                  {saveProfileMutation.isPending ? 'Saving…' : 'Save to profile'}
                </button>
              </div>
            </section>

            <section className="eligibility-section" aria-labelledby="ldf-qual-heading">
              <h2 id="ldf-qual-heading">Highest qualification</h2>
              <DocHint id={DOC_HINT_ID} />
              <div className="eligibility-qual-grid" role="radiogroup" aria-label="Qualification level">
                {QUALIFICATIONS.map((q) => (
                  <label
                    key={q.value}
                    className={`eligibility-qual-card ${qualificationLevel === q.value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="ldf-qualification"
                      value={q.value}
                      checked={qualificationLevel === q.value}
                      onChange={() => setQualificationLevel(q.value)}
                    />
                    <span className="eligibility-qual-title">{q.label}</span>
                    <span className="eligibility-qual-desc">{q.description}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="eligibility-section" aria-labelledby="ldf-years-heading">
              <h2 id="ldf-years-heading">Completion &amp; issue years</h2>
              <div className="eligibility-row">
                <div className="eligibility-field">
                  <label htmlFor="ldf-grad-yr" className="eligibility-label">
                    {graduationYearQuestion(qualificationLevel)}
                    <span className="eligibility-req"> *</span>
                  </label>
                  <select
                    id="ldf-grad-yr"
                    className="eligibility-select"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    required
                  >
                    <option value="">Select year</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="eligibility-field">
                  <label htmlFor="ldf-issued-yr" className="eligibility-label">
                    {degreeIssuedYearQuestion(qualificationLevel)}
                    <span className="eligibility-req"> *</span>
                  </label>
                  <select
                    id="ldf-issued-yr"
                    className="eligibility-select"
                    value={degreeIssuedYear}
                    onChange={(e) => setDegreeIssuedYear(e.target.value)}
                    required
                  >
                    <option value="">Select year</option>
                    {yearOptions.map((y) => (
                      <option key={`i-${y}`} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {yearsInconsistent ? (
                <p className="eligibility-inline-warn" role="status">
                  Degree issue year is before graduation year. Adjust if that is a mistake.
                </p>
              ) : null}
              <OptionalFileField
                id="ldf-grad-doc"
                label={
                  qualificationLevel === 'DIPLOMA'
                    ? 'Supporting document for programme completion year'
                    : 'Supporting document for graduation year'
                }
                file={graduationYearDoc}
                onChange={setGraduationYearDoc}
                describedBy={DOC_HINT_ID}
              />
              <OptionalFileField
                id="ldf-issued-doc"
                label={
                  qualificationLevel === 'DIPLOMA'
                    ? 'Supporting document for diploma issue year'
                    : 'Supporting document for degree issue year'
                }
                file={degreeIssuedYearDoc}
                onChange={setDegreeIssuedYearDoc}
                describedBy={DOC_HINT_ID}
              />
            </section>

            <section className="eligibility-section" aria-labelledby="ldf-cred-heading">
              <h2 id="ldf-cred-heading">Certificates &amp; transcripts</h2>
              <CredentialUploadPanel
                level={qualificationLevel}
                files={credentialFiles}
                onFilesChange={setCredentialFiles}
                docHintId={DOC_HINT_ID}
              />
            </section>

            <section className="eligibility-section" aria-labelledby="ldf-attest-heading">
              <h2 id="ldf-attest-heading">Document attestation</h2>
              <p className="eligibility-question">
                Have your educational credentials been attested by your country&apos;s Higher Education Authority
                and/or Ministry of Foreign Affairs?
              </p>
              <div className="eligibility-attestation-list" role="radiogroup" aria-label="Document attestation">
                {ATTESTATION_OPTIONS.map((opt) => (
                  <label key={opt.value} className="eligibility-attestation-option">
                    <input
                      type="radio"
                      name="ldf-attestation"
                      value={opt.value}
                      checked={documentAttestation === opt.value}
                      onChange={() => setDocumentAttestation(opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="eligibility-section" aria-labelledby="ldf-lic-heading">
              <h2 id="ldf-lic-heading">National health license</h2>
              <p className="eligibility-question">Do you have a health license issued by your country&apos;s authority?</p>
              <div className="eligibility-options">
                <label className="eligibility-option">
                  <input
                    type="radio"
                    name="ldf-health"
                    checked={hasHealthLicense === 'yes'}
                    onChange={() => setHasHealthLicense('yes')}
                  />
                  <span>Yes</span>
                </label>
                <label className="eligibility-option">
                  <input
                    type="radio"
                    name="ldf-health"
                    checked={hasHealthLicense === 'no'}
                    onChange={() => setHasHealthLicense('no')}
                  />
                  <span>No</span>
                </label>
              </div>
              <OptionalFileField
                id="ldf-health-lic"
                label="Health license document"
                file={healthLicenseFile}
                onChange={setHealthLicenseFile}
                describedBy={DOC_HINT_ID}
              />
            </section>

            <section className="eligibility-section" aria-labelledby="ldf-exp-heading">
              <h2 id="ldf-exp-heading">Clinical experience</h2>
              <div className="eligibility-row">
                <div className="eligibility-field">
                  <label htmlFor="ldf-exp-start" className="eligibility-label">
                    Experience start<span className="eligibility-req"> *</span>
                  </label>
                  <input
                    id="ldf-exp-start"
                    type="month"
                    className="eligibility-input"
                    value={experienceStart}
                    onChange={(e) => setExperienceStart(e.target.value)}
                    required
                  />
                </div>
                <div className="eligibility-field">
                  <label htmlFor="ldf-exp-end" className="eligibility-label">
                    Experience end
                    {!stillWorking ? <span className="eligibility-req"> *</span> : null}
                  </label>
                  <input
                    id="ldf-exp-end"
                    type="month"
                    className="eligibility-input"
                    value={experienceEnd}
                    onChange={(e) => setExperienceEnd(e.target.value)}
                    disabled={stillWorking}
                    required={!stillWorking}
                  />
                </div>
              </div>
              <label className="eligibility-check">
                <input
                  type="checkbox"
                  checked={stillWorking}
                  onChange={(e) => {
                    setStillWorking(e.target.checked);
                    if (e.target.checked) setExperienceEnd('');
                  }}
                />
                <span>I am still working in this role</span>
              </label>
              {experienceRangeInvalid ? (
                <p className="eligibility-inline-warn" role="alert">
                  End month must be the same as or after the start month.
                </p>
              ) : null}
              <p className="eligibility-question">Do you have more than one experience letter?</p>
              <div className="eligibility-options">
                <label className="eligibility-option">
                  <input
                    type="radio"
                    name="ldf-mulexp"
                    checked={multipleExperienceLetters === 'yes'}
                    onChange={() => onMultipleLettersChange('yes')}
                  />
                  <span>Yes</span>
                </label>
                <label className="eligibility-option">
                  <input
                    type="radio"
                    name="ldf-mulexp"
                    checked={multipleExperienceLetters === 'no'}
                    onChange={() => onMultipleLettersChange('no')}
                  />
                  <span>No</span>
                </label>
              </div>
              {experienceLetterFiles.map((f, i) => (
                <OptionalFileField
                  key={i}
                  id={`ldf-exp-letter-${i}`}
                  label={`Experience letter ${i + 1}`}
                  file={f}
                  onChange={(file) => setLetterFile(i, file)}
                  describedBy={DOC_HINT_ID}
                />
              ))}
              {multipleExperienceLetters === 'yes' ? (
                <button type="button" className="eligibility-add-letter" onClick={addLetterSlot}>
                  Add another experience letter
                </button>
              ) : null}
            </section>

            <section className="eligibility-section eligibility-step-body eligibility-review" aria-labelledby="ldf-review-heading">
              <h2 id="ldf-review-heading">Summary</h2>
              <p className="eligibility-review-intro">
                You are about to upload <strong>{uploadedDocCount}</strong> file
                {uploadedDocCount === 1 ? '' : 's'} with this request (skipped optional files are not sent).
              </p>
              <dl className="eligibility-review-dl">
                <div className="eligibility-review-row">
                  <dt>Service</dt>
                  <dd>{serviceTitle(serviceKind)}</dd>
                </div>
                <div className="eligibility-review-row">
                  <dt>Profession</dt>
                  <dd>{professionName}</dd>
                </div>
                <div className="eligibility-review-row">
                  <dt>Health authority</dt>
                  <dd>{healthAuthorityName}</dd>
                </div>
                <div className="eligibility-review-row">
                  <dt>Highest qualification</dt>
                  <dd>{qualificationLabel}</dd>
                </div>
                <div className="eligibility-review-row">
                  <dt>{qualificationLevel === 'DIPLOMA' ? 'Programme completion year' : 'Graduation year'}</dt>
                  <dd>{graduationYear || '—'}</dd>
                </div>
                <div className="eligibility-review-row">
                  <dt>{qualificationLevel === 'DIPLOMA' ? 'Diploma issued year' : 'Degree issued year'}</dt>
                  <dd>{degreeIssuedYear || '—'}</dd>
                </div>
                <div className="eligibility-review-row">
                  <dt>Credential uploads</dt>
                  <dd>
                    {credentialSummaryRows.length ? (
                      <ul className="eligibility-review-cred-list">
                        {credentialSummaryRows.map(([label, file]) => (
                          <li key={label}>
                            {label}: {file ? <strong>attached</strong> : 'not attached'}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div className="eligibility-review-row">
                  <dt>HEA / MoFA attestation</dt>
                  <dd>{attestationReviewLabel(documentAttestation)}</dd>
                </div>
                <div className="eligibility-review-row">
                  <dt>National health license</dt>
                  <dd>{yesNoLabel(hasHealthLicense)}</dd>
                </div>
                <div className="eligibility-review-row">
                  <dt>Experience period</dt>
                  <dd>
                    {formatMonth(experienceStart)} → {stillWorking ? 'Present' : formatMonth(experienceEnd)}
                  </dd>
                </div>
              </dl>
            </section>

            <div className="eligibility-profile-actions" style={{ marginTop: 24 }}>
              <button
                type="button"
                className="eligibility-btn primary"
                disabled={!documentsValid || submitDocsMutation.isPending}
                onClick={handleDocumentsSubmit}
              >
                {submitDocsMutation.isPending ? 'Uploading…' : 'Save documents & continue to payment'}
              </button>
              <button type="button" className="eligibility-btn secondary" onClick={() => setPhase('pick')}>
                Change service
              </button>
            </div>
          </div>
        )}

        {phase === 'pay' && (
          <div className="eligibility-card">
            <h2 className="eligibility-step-heading">Service fee</h2>
            <p className="eligibility-sub">
              Reference <strong>{requestId}</strong>. Checkout opens in a secure Freemius window for{' '}
              <strong>{serviceTitle(serviceKind)}</strong>.
            </p>
            {!freemiusReady ? (
              <p className="eligibility-inline-warn" role="status">
                Set <code>VITE_FREEMIUS_PUBLIC_KEY</code>, <code>VITE_FREEMIUS_PRODUCT_ID</code>, and the plan env vars
                in the client build.
              </p>
            ) : null}
            <div className="eligibility-profile-actions">
              <button
                type="button"
                className="eligibility-btn primary"
                disabled={checkoutBusy || !freemiusReady}
                onClick={openCheckout}
              >
                {checkoutBusy ? 'Opening checkout…' : 'Pay service fee with Freemius'}
              </button>
              <Link to="/dashboard" className="eligibility-btn secondary">
                Pay later (save this reference)
              </Link>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="eligibility-card eligibility-success">
            <h1>Thank you</h1>
            <p>Your payment is confirmed and linked to request {requestId}.</p>
            <Link to="/dashboard" className="eligibility-back-link">
              Back to dashboard
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
