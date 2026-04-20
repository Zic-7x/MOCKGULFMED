import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  canUserAccessEligibilityAssessment,
  getProfessions,
  getHealthAuthorities,
  submitEligibilityAssessment,
  updateMyProfessionAndHealthAuthority,
} from '../../utils/supabaseQueries';
import toast from 'react-hot-toast';
import './EligibilityAssessment.css';

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_EXPERIENCE_LETTER_SLOTS = 8;

const PUBLIC_CHECKER_STORAGE_KEY = 'publicEligibilityChecker:v1';
const assessmentDraftKey = (userId) => `eligibilityAssessmentDraft:v1:${userId}`;

function safeParseJson(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const QUALIFICATIONS = [
  { value: 'DIPLOMA', label: 'Diploma', description: 'Diploma-level clinical or allied health programme' },
  { value: 'BACHELOR', label: 'Bachelor', description: 'Undergraduate degree (e.g. MBBS, BSc Nursing)' },
  { value: 'MASTERS', label: 'Masters', description: 'Postgraduate degree or specialist training' },
  { value: 'PHD', label: 'PhD', description: 'Doctorate / PhD research degree' },
];

const FORM_STEPS = [
  { id: 1, title: 'Qualification', subtitle: 'Highest credential' },
  { id: 2, title: 'Completion & issue dates', subtitle: 'Years and optional proof' },
  { id: 3, title: 'Certificates & transcripts', subtitle: 'Match your study level' },
  { id: 4, title: 'Document attestation', subtitle: 'HEA / MoFA' },
  { id: 5, title: 'Health license', subtitle: 'National regulator' },
  { id: 6, title: 'Clinical experience', subtitle: 'Employment and letters' },
  { id: 7, title: 'Review & submit', subtitle: 'Confirm before sending' },
];

const ATTESTATION_OPTIONS = [
  { value: 'HEA', label: 'Yes — Higher Education Authority (HEA) only' },
  { value: 'MOFA', label: 'Yes — Ministry of Foreign Affairs / embassy attestation only' },
  { value: 'HEA_AND_MOFA', label: 'Yes — both HEA and MoFA (where required)' },
  { value: 'NONE', label: 'No — not attested yet' },
  { value: 'NOT_APPLICABLE', label: 'Not applicable / still in progress' },
];

function formatFileSize(bytes) {
  if (bytes == null || !Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

function DocHint({ id }) {
  return (
    <p id={id} className="eligibility-doc-hint">
      <strong>Optional uploads.</strong> You may skip every file below. For the most accurate eligibility review,
      we still recommend uploading anything you have ready—especially transcripts and licenses.
    </p>
  );
}

function OptionalFileField({ id, label, file, onChange, describedBy, accept = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx' }) {
  const [inputKey, setInputKey] = useState(0);

  const handleChange = (e) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_FILE_BYTES) {
      toast.error(`${f.name} is too large. Maximum size is ${formatFileSize(MAX_FILE_BYTES)}.`);
      e.target.value = '';
      return;
    }
    onChange(f);
  };

  const clear = () => {
    onChange(null);
    setInputKey((k) => k + 1);
  };

  return (
    <div className="eligibility-field eligibility-file-field">
      <label htmlFor={`${id}-input`} className="eligibility-label">
        {label}{' '}
        <span className="eligibility-optional">(optional)</span>
      </label>
      <p className="eligibility-file-meta">PDF, JPG, PNG, WebP, Word · max {formatFileSize(MAX_FILE_BYTES)}</p>
      <div className="eligibility-file-row">
        <input
          key={inputKey}
          id={`${id}-input`}
          type="file"
          className="eligibility-file"
          accept={accept}
          aria-describedby={describedBy}
          onChange={handleChange}
        />
        {file ? (
          <div className="eligibility-file-chosen">
            <span className="eligibility-file-name">{file.name}</span>
            <span className="eligibility-file-size">{formatFileSize(file.size)}</span>
            <button type="button" className="eligibility-file-clear" onClick={clear}>
              Remove
            </button>
          </div>
        ) : (
          <span className="eligibility-file-skip">No file selected — you can continue without uploading.</span>
        )}
      </div>
    </div>
  );
}

function graduationYearQuestion(level) {
  if (level === 'DIPLOMA') return 'In which year did you complete your programme?';
  return 'In which year did you complete your graduation?';
}

function degreeIssuedYearQuestion(level) {
  if (level === 'DIPLOMA') return 'In which year was your diploma awarded / issued?';
  return 'In which year was your degree issued?';
}

const EMPTY_CREDENTIAL_FILES = {
  diplomaCertificate: null,
  diplomaTranscript: null,
  bsDegree: null,
  bsTranscript: null,
  mastersDegree: null,
  mastersTranscript: null,
  phdDegree: null,
  phdTranscript: null,
};

/**
 * Upload slots depend on highest qualification: only the relevant pairs are shown.
 */
function CredentialUploadPanel({ level, files, onFilesChange, docHintId }) {
  const set =
    (key) =>
    (file) =>
      onFilesChange((prev) => ({
        ...prev,
        [key]: file,
      }));

  if (!level) {
    return (
      <p className="eligibility-inline-warn" role="status">
        Select your <strong>highest qualification</strong> in step 1 first. The upload fields below will match your
        choice (diploma, bachelor&apos;s, master&apos;s, or PhD).
      </p>
    );
  }

  if (level === 'DIPLOMA') {
    return (
      <div className="eligibility-credential-panel eligibility-credential-reveal" key="DIPLOMA">
        <p className="eligibility-credential-intro">
          <strong>Diploma track:</strong> upload your institute-issued diploma and transcript (optional).
        </p>
        <OptionalFileField
          id="dip-cert"
          label="Diploma certificate"
          file={files.diplomaCertificate}
          onChange={set('diplomaCertificate')}
          describedBy={docHintId}
        />
        <OptionalFileField
          id="dip-trans"
          label="Diploma / programme official transcript or marks sheet"
          file={files.diplomaTranscript}
          onChange={set('diplomaTranscript')}
          describedBy={docHintId}
        />
      </div>
    );
  }

  if (level === 'BACHELOR') {
    return (
      <div className="eligibility-credential-panel eligibility-credential-reveal" key="BACHELOR">
        <p className="eligibility-credential-intro">
          <strong>Bachelor&apos;s only:</strong> upload your BS degree and its university transcript (optional).
        </p>
        <OptionalFileField
          id="bs-deg"
          label="Bachelor's (BS) degree certificate"
          file={files.bsDegree}
          onChange={set('bsDegree')}
          describedBy={docHintId}
        />
        <OptionalFileField
          id="bs-trans"
          label="Bachelor's (BS) official university transcript"
          file={files.bsTranscript}
          onChange={set('bsTranscript')}
          describedBy={docHintId}
        />
      </div>
    );
  }

  if (level === 'MASTERS') {
    return (
      <div className="eligibility-credential-panel eligibility-credential-reveal" key="MASTERS">
        <p className="eligibility-credential-intro">
          <strong>Master&apos;s track:</strong> provide both undergraduate (BS) and postgraduate (master&apos;s)
          degree copies and transcripts (optional).
        </p>
        <h3 className="eligibility-credential-subheading">Undergraduate (bachelor&apos;s)</h3>
        <OptionalFileField
          id="bs-deg"
          label="Bachelor's (BS) degree certificate"
          file={files.bsDegree}
          onChange={set('bsDegree')}
          describedBy={docHintId}
        />
        <OptionalFileField
          id="bs-trans"
          label="Bachelor's (BS) official university transcript"
          file={files.bsTranscript}
          onChange={set('bsTranscript')}
          describedBy={docHintId}
        />
        <h3 className="eligibility-credential-subheading">Postgraduate (master&apos;s)</h3>
        <OptionalFileField
          id="ms-deg"
          label="Master's degree certificate"
          file={files.mastersDegree}
          onChange={set('mastersDegree')}
          describedBy={docHintId}
        />
        <OptionalFileField
          id="ms-trans"
          label="Master's official university transcript"
          file={files.mastersTranscript}
          onChange={set('mastersTranscript')}
          describedBy={docHintId}
        />
      </div>
    );
  }

  if (level === 'PHD') {
    return (
      <div className="eligibility-credential-panel eligibility-credential-reveal" key="PHD">
        <p className="eligibility-credential-intro">
          <strong>PhD track:</strong> upload bachelor&apos;s, master&apos;s, and doctorate certificates and matching
          transcripts (optional).
        </p>
        <h3 className="eligibility-credential-subheading">Undergraduate (bachelor&apos;s)</h3>
        <OptionalFileField
          id="bs-deg"
          label="Bachelor's (BS) degree certificate"
          file={files.bsDegree}
          onChange={set('bsDegree')}
          describedBy={docHintId}
        />
        <OptionalFileField
          id="bs-trans"
          label="Bachelor's (BS) official university transcript"
          file={files.bsTranscript}
          onChange={set('bsTranscript')}
          describedBy={docHintId}
        />
        <h3 className="eligibility-credential-subheading">Postgraduate (master&apos;s)</h3>
        <OptionalFileField
          id="ms-deg"
          label="Master's degree certificate"
          file={files.mastersDegree}
          onChange={set('mastersDegree')}
          describedBy={docHintId}
        />
        <OptionalFileField
          id="ms-trans"
          label="Master's official university transcript"
          file={files.mastersTranscript}
          onChange={set('mastersTranscript')}
          describedBy={docHintId}
        />
        <h3 className="eligibility-credential-subheading">Doctorate (PhD)</h3>
        <OptionalFileField
          id="phd-deg"
          label="PhD / doctorate degree certificate"
          file={files.phdDegree}
          onChange={set('phdDegree')}
          describedBy={docHintId}
        />
        <OptionalFileField
          id="phd-trans"
          label="PhD / doctorate official transcript"
          file={files.phdTranscript}
          onChange={set('phdTranscript')}
          describedBy={docHintId}
        />
      </div>
    );
  }

  return null;
}

function attestationReviewLabel(value) {
  const o = ATTESTATION_OPTIONS.find((x) => x.value === value);
  return o?.label || '—';
}

function yesNoLabel(v) {
  if (v === 'yes') return 'Yes';
  if (v === 'no') return 'No';
  return '—';
}

const EligibilityAssessment = () => {
  const { user, refreshUserProfile } = useAuth();

  const { data: accessGate, isLoading: accessLoading, error: accessError } = useQuery({
    queryKey: ['eligibilityAssessmentAccess', user?.id],
    queryFn: () => canUserAccessEligibilityAssessment(user.id),
    enabled: !!user?.id,
  });

  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [hoursMessage, setHoursMessage] = useState(false);

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

  const stepTitleRef = useRef(null);

  const { data: professions = [] } = useQuery({
    queryKey: ['professions'],
    queryFn: getProfessions,
    enabled: !!user?.id && accessGate?.allowed === true,
  });

  const { data: healthAuthorities = [] } = useQuery({
    queryKey: ['healthAuthorities'],
    queryFn: getHealthAuthorities,
    enabled: !!user?.id && accessGate?.allowed === true,
  });

  useEffect(() => {
    if (user?.profession_id) {
      setLocalProfessionId((curr) => (curr ? curr : String(user.profession_id)));
    }
    if (user?.health_authority_id) {
      setLocalHealthAuthorityId((curr) => (curr ? curr : String(user.health_authority_id)));
    }
  }, [user?.profession_id, user?.health_authority_id]);

  // Hydrate local draft (resume after login / refresh). Layout effect avoids a passive-effect
  // immediately overwriting localStorage before these setState updates commit.
  useLayoutEffect(() => {
    if (!user?.id) return;
    if (accessLoading) return;
    if (!accessGate?.allowed) return;

    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(assessmentDraftKey(user.id)) : null;
    const draft = safeParseJson(raw);
    const data = draft?.data || null;
    if (data && typeof data === 'object') {
      if (typeof data.step === 'number' && data.step >= 1 && data.step <= FORM_STEPS.length) setStep(data.step);
      if (typeof data.qualificationLevel === 'string') setQualificationLevel(data.qualificationLevel);
      if (typeof data.graduationYear === 'string') setGraduationYear(data.graduationYear);
      if (typeof data.degreeIssuedYear === 'string') setDegreeIssuedYear(data.degreeIssuedYear);
      if (typeof data.documentAttestation === 'string') setDocumentAttestation(data.documentAttestation);
      if (typeof data.hasHealthLicense === 'string') setHasHealthLicense(data.hasHealthLicense);
      if (typeof data.experienceStart === 'string') setExperienceStart(data.experienceStart);
      if (typeof data.experienceEnd === 'string') setExperienceEnd(data.experienceEnd);
      if (typeof data.stillWorking === 'boolean') setStillWorking(data.stillWorking);
      if (typeof data.multipleExperienceLetters === 'string') setMultipleExperienceLetters(data.multipleExperienceLetters);
      if (typeof data.localProfessionId === 'string') setLocalProfessionId(data.localProfessionId);
      if (typeof data.localHealthAuthorityId === 'string') setLocalHealthAuthorityId(data.localHealthAuthorityId);
      if (Array.isArray(data.experienceLetterSlots) && data.experienceLetterSlots.length) {
        const n = Math.min(MAX_EXPERIENCE_LETTER_SLOTS, Math.max(1, data.experienceLetterSlots.length));
        setExperienceLetterFiles(Array.from({ length: n }, () => null));
      }
    } else {
      // If no signed-in draft exists, try to pull basics from the public checker.
      const publicDraft = safeParseJson(
        typeof window !== 'undefined' ? window.localStorage.getItem(PUBLIC_CHECKER_STORAGE_KEY) : null
      );
      const pubData = publicDraft?.data || {};
      if (pubData && typeof pubData === 'object') {
        if (typeof pubData.qualificationLevel === 'string') setQualificationLevel(pubData.qualificationLevel);
        if (typeof pubData.professionId === 'string') setLocalProfessionId(pubData.professionId);
        if (typeof pubData.healthAuthorityId === 'string') setLocalHealthAuthorityId(pubData.healthAuthorityId);
        if (typeof pubData.documentAttestation === 'string') setDocumentAttestation(pubData.documentAttestation);
        if (typeof pubData.healthLicenseStatus === 'string') {
          const yes = pubData.healthLicenseStatus === 'have' || pubData.healthLicenseStatus === 'applying';
          setHasHealthLicense(yes ? 'yes' : 'no');
        }
        const pubStep = Number(publicDraft?.step);
        const hasPathway = !!pubData.professionId && !!pubData.healthAuthorityId;
        const hasQual = !!pubData.qualificationLevel;
        if (hasPathway && hasQual && Number.isFinite(pubStep) && pubStep >= 2) {
          setStep(2);
        }
      }
    }
  }, [user?.id, accessLoading, accessGate?.allowed]);

  // Persist draft as the user progresses (files are not persisted).
  useEffect(() => {
    if (!user?.id) return;
    if (!accessGate?.allowed) return;
    try {
      window.localStorage.setItem(
        assessmentDraftKey(user.id),
        JSON.stringify({
          updatedAt: new Date().toISOString(),
          data: {
            step,
            qualificationLevel,
            graduationYear,
            degreeIssuedYear,
            documentAttestation,
            hasHealthLicense,
            experienceStart,
            experienceEnd,
            stillWorking,
            multipleExperienceLetters,
            experienceLetterSlots: experienceLetterFiles.map((_) => null),
            localProfessionId,
            localHealthAuthorityId,
          },
        })
      );
    } catch {
      // ignore storage failures
    }
  }, [
    user?.id,
    step,
    qualificationLevel,
    graduationYear,
    degreeIssuedYear,
    documentAttestation,
    hasHealthLicense,
    experienceStart,
    experienceEnd,
    stillWorking,
    multipleExperienceLetters,
    experienceLetterFiles,
    localProfessionId,
    localHealthAuthorityId,
    accessGate?.allowed,
  ]);

  const prevQualificationRef = useRef(qualificationLevel);

  useEffect(() => {
    const prev = prevQualificationRef.current;
    if (prev && prev !== qualificationLevel) {
      setCredentialFiles({ ...EMPTY_CREDENTIAL_FILES });
    }
    prevQualificationRef.current = qualificationLevel;
  }, [qualificationLevel]);

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      stepTitleRef.current?.focus();
    });
    return () => cancelAnimationFrame(t);
  }, [step]);

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

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      if (!localProfessionId || !localHealthAuthorityId) {
        throw new Error('Select both profession and health authority.');
      }
      await updateMyProfessionAndHealthAuthority(localProfessionId, localHealthAuthorityId);
      await refreshUserProfile();
    },
    onSuccess: () => toast.success('Profile updated. These details will be used for your assessment.'),
    onError: (err) => toast.error(err.message || 'Could not update profile'),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not logged in');
      if (!localProfessionId || !localHealthAuthorityId) {
        throw new Error('Please select your profession and health authority above.');
      }
      if (experienceRangeInvalid) {
        throw new Error('Experience end must be the same month or after the start month.');
      }
      if (
        localProfessionId !== String(user.profession_id ?? '') ||
        localHealthAuthorityId !== String(user.health_authority_id ?? '')
      ) {
        await updateMyProfessionAndHealthAuthority(localProfessionId, localHealthAuthorityId);
        await refreshUserProfile();
      }
      return submitEligibilityAssessment(user.id, {
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
    onSuccess: () => {
      const multiDegree = qualificationLevel === 'MASTERS' || qualificationLevel === 'PHD';
      setHoursMessage(!!multiDegree);
      setDone(true);
      toast.success('Assessment submitted successfully.');
      try {
        if (user?.id) window.localStorage.removeItem(assessmentDraftKey(user.id));
      } catch {
        // ignore
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to submit');
    },
  });

  const profileComplete = !!localProfessionId && !!localHealthAuthorityId;

  if (!user?.id) {
    return <Navigate to="/login" />;
  }

  if (accessLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (accessError) {
    return (
      <Layout>
        <div className="eligibility-page">
          <div className="eligibility-card eligibility-paywall">
            <h1>Eligibility assessment</h1>
            <p className="eligibility-sub">
              {accessError?.message || 'We could not verify your subscription. Please try again.'}
            </p>
            <Link to="/packages" className="eligibility-back-link">
              View packages
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!accessGate?.allowed) {
    const shortPlan =
      accessGate?.reason === 'package_too_short'
        ? `Your current plan (${accessGate?.packageName || 'Basic Monthly'}) is shorter than 3 months.`
        : null;
    return (
      <Layout>
        <div className="eligibility-page">
          <div className="eligibility-card eligibility-paywall">
            <h1>Eligibility assessment</h1>
            <p className="eligibility-sub">
              The full eligibility assessment (document upload and review) is included for subscribers on a{' '}
              <strong>3-month or annual</strong> plan. Anyone can still use the public{' '}
              <Link to="/eligibility-check">readiness check</Link> before upgrading.
            </p>
            {shortPlan ? (
              <p className="eligibility-sub" role="status">
                {shortPlan} Upgrade to unlock this workflow.
              </p>
            ) : null}
            <div className="eligibility-paywall-actions">
              <Link to="/packages" className="eligibility-btn primary">
                View 3-month &amp; annual plans
              </Link>
              <Link to="/dashboard" className="eligibility-btn secondary">
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const totalSteps = FORM_STEPS.length;
  const currentStepMeta = FORM_STEPS.find((s) => s.id === step);

  const validateStep = (s) => {
    if (s === 1) return profileComplete && !!qualificationLevel;
    if (s === 2) return !!graduationYear && !!degreeIssuedYear;
    if (s === 3) return !!qualificationLevel;
    if (s === 4) return !!documentAttestation;
    if (s === 5) return hasHealthLicense === 'yes' || hasHealthLicense === 'no';
    if (s === 6) {
      if (!experienceStart) return false;
      if (!stillWorking && !experienceEnd) return false;
      if (experienceRangeInvalid) return false;
      return multipleExperienceLetters === 'yes' || multipleExperienceLetters === 'no';
    }
    if (s === 7) {
      return (
        profileComplete &&
        !!qualificationLevel &&
        !!graduationYear &&
        !!degreeIssuedYear &&
        !!documentAttestation &&
        (hasHealthLicense === 'yes' || hasHealthLicense === 'no') &&
        !!experienceStart &&
        (stillWorking || !!experienceEnd) &&
        !experienceRangeInvalid &&
        (multipleExperienceLetters === 'yes' || multipleExperienceLetters === 'no')
      );
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) {
      if (step === 6 && experienceRangeInvalid) {
        toast.error('Experience end must be the same month or after the start month.');
      } else if (step === 4) {
        toast.error('Please select how your documents are attested (or choose not applicable).');
      } else {
        toast.error('Please complete this step before continuing.');
      }
      return;
    }
    if (step === 2 && yearsInconsistent) {
      toast('Please double-check: degree issue year is usually the same as or after graduation year.', {
        icon: '⚠️',
      });
    }
    setStep((x) => Math.min(totalSteps, x + 1));
  };

  const goBack = () => setStep((x) => Math.max(1, x - 1));

  const setLetterFile = (index, file) => {
    setExperienceLetterFiles((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
  };

  const addLetterSlot = () => {
    setExperienceLetterFiles((prev) => {
      if (prev.length >= MAX_EXPERIENCE_LETTER_SLOTS) {
        toast.error(`You can add up to ${MAX_EXPERIENCE_LETTER_SLOTS} experience letter slots.`);
        return prev;
      }
      return [...prev, null];
    });
  };

  const onMultipleLettersChange = (val) => {
    setMultipleExperienceLetters(val);
    if (val === 'yes') {
      setExperienceLetterFiles((prev) => (prev.length < 2 ? [null, null] : prev));
    } else {
      setExperienceLetterFiles([null]);
    }
  };

  if (done) {
    return (
      <Layout>
        <div className="eligibility-page">
          <div className="eligibility-card eligibility-success">
            <h1>Thank you</h1>
            <p>Your eligibility assessment has been received.</p>
            {hoursMessage ? (
              <p className="eligibility-success-emphasis">
                Your case includes more than one degree level to assess (Masters or PhD). Your report will be
                issued within a few hours. Please check your email.
              </p>
            ) : (
              <p>We will follow up using the email on your account.</p>
            )}
            <a href="/dashboard" className="eligibility-back-link">
              Back to dashboard
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  const docHintId = 'eligibility-doc-hint-global';

  return (
    <Layout>
      <div className="eligibility-page">
        <header className="eligibility-header">
          <h1>Eligibility assessment</h1>
          <p className="eligibility-sub">
            Work through each section. Documents are always optional, but they help us give you a precise outcome.
            Nothing is saved until you submit on the final step.
          </p>
          <nav className="eligibility-stepper" aria-label="Assessment progress">
            <ol className="eligibility-stepper-list">
              {FORM_STEPS.map((s) => {
                const isCurrent = step === s.id;
                const isComplete = step > s.id;
                return (
                  <li
                    key={s.id}
                    className={`eligibility-stepper-item ${isCurrent ? 'current' : ''} ${isComplete ? 'complete' : ''}`}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    <span className="eligibility-stepper-marker">{isComplete ? '✓' : s.id}</span>
                    <span className="eligibility-stepper-text">
                      <span className="eligibility-stepper-title">{s.title}</span>
                      <span className="eligibility-stepper-sub">{s.subtitle}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </nav>
        </header>

        <div className="eligibility-card">
          <section className="eligibility-section eligibility-profile-section" aria-labelledby="profile-heading">
            <h2 id="profile-heading">Profession &amp; health authority</h2>
            <p className="eligibility-profile-lead">
              These fields match registration and are stored with your submission. Change them here if your
              situation has changed.
            </p>
            <div className="eligibility-row">
              <div className="eligibility-field">
                <label htmlFor="elig-profession" className="eligibility-label">
                  Profession<span className="eligibility-req"> *</span>
                </label>
                <select
                  id="elig-profession"
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
                <label htmlFor="elig-ha" className="eligibility-label">
                  Health authority<span className="eligibility-req"> *</span>
                </label>
                <select
                  id="elig-ha"
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

          <article className="eligibility-step-panel" aria-labelledby="step-heading">
            <p className="eligibility-step-kicker">
              Step {step} of {totalSteps}
              {currentStepMeta ? ` · ${currentStepMeta.subtitle}` : ''}
            </p>
            <h2 id="step-heading" ref={stepTitleRef} tabIndex={-1} className="eligibility-step-heading">
              {currentStepMeta?.title || 'Assessment'}
            </h2>

            {step === 1 && (
              <div className="eligibility-step-body">
                <DocHint id={docHintId} />
                <p className="eligibility-lead-question">What is your current highest level of qualification?</p>
                <div className="eligibility-qual-grid" role="radiogroup" aria-label="Qualification level">
                  {QUALIFICATIONS.map((q) => (
                    <label
                      key={q.value}
                      className={`eligibility-qual-card ${qualificationLevel === q.value ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="qualification"
                        value={q.value}
                        checked={qualificationLevel === q.value}
                        onChange={() => setQualificationLevel(q.value)}
                      />
                      <span className="eligibility-qual-title">{q.label}</span>
                      <span className="eligibility-qual-desc">{q.description}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="eligibility-step-body">
                <DocHint id={docHintId} />
                <div className="eligibility-row">
                  <div className="eligibility-field">
                    <label htmlFor="grad-yr" className="eligibility-label">
                      {graduationYearQuestion(qualificationLevel)}
                      <span className="eligibility-req"> *</span>
                    </label>
                    <select
                      id="grad-yr"
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
                    <label htmlFor="issued-yr" className="eligibility-label">
                      {degreeIssuedYearQuestion(qualificationLevel)}
                      <span className="eligibility-req"> *</span>
                    </label>
                    <select
                      id="issued-yr"
                      className="eligibility-select"
                      value={degreeIssuedYear}
                      onChange={(e) => setDegreeIssuedYear(e.target.value)}
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
                </div>
                {yearsInconsistent ? (
                  <p className="eligibility-inline-warn" role="status">
                    Degree issue year is before graduation year. If that is correct (e.g. late conferral), you can
                    continue—otherwise adjust the years.
                  </p>
                ) : null}
                <OptionalFileField
                  id="grad-doc"
                  label={
                    qualificationLevel === 'DIPLOMA'
                      ? 'Supporting document for programme completion year'
                      : 'Supporting document for graduation year'
                  }
                  file={graduationYearDoc}
                  onChange={setGraduationYearDoc}
                  describedBy={docHintId}
                />
                <OptionalFileField
                  id="issued-doc"
                  label={
                    qualificationLevel === 'DIPLOMA'
                      ? 'Supporting document for diploma issue year'
                      : 'Supporting document for degree issue year'
                  }
                  file={degreeIssuedYearDoc}
                  onChange={setDegreeIssuedYearDoc}
                  describedBy={docHintId}
                />
              </div>
            )}

            {step === 3 && (
              <div className="eligibility-step-body">
                <DocHint id={docHintId} />
                <p className="eligibility-lead-question">Academic certificates &amp; transcripts</p>
                <p className="eligibility-upload-prompt">
                  The uploads you see match the <strong>highest qualification you chose in step 1</strong>. Change
                  step 1 to switch between diploma (2 files), bachelor&apos;s (2), master&apos;s (4), or PhD (6). All
                  uploads are optional.
                </p>
                <CredentialUploadPanel
                  level={qualificationLevel}
                  files={credentialFiles}
                  onFilesChange={setCredentialFiles}
                  docHintId={docHintId}
                />
              </div>
            )}

            {step === 4 && (
              <div className="eligibility-step-body">
                <p className="eligibility-question">
                  Have your educational credentials been attested by your country&apos;s{' '}
                  <strong>Higher Education Authority (HEA)</strong> and/or{' '}
                  <strong>Ministry of Foreign Affairs (MoFA)</strong> (or equivalent embassy / consular attestation)?
                </p>
                <p className="eligibility-attestation-lead">
                  Many Gulf licensing routes require HEA and/or MoFA stamps on degrees and transcripts. This helps
                  assessors understand where your file stands.
                </p>
                <div className="eligibility-attestation-list" role="radiogroup" aria-label="Document attestation">
                  {ATTESTATION_OPTIONS.map((opt) => (
                    <label key={opt.value} className="eligibility-attestation-option">
                      <input
                        type="radio"
                        name="attestation"
                        value={opt.value}
                        checked={documentAttestation === opt.value}
                        onChange={() => setDocumentAttestation(opt.value)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="eligibility-step-body">
                <DocHint id={docHintId} />
                <p className="eligibility-question">
                  Do you have a health license issued by your country&apos;s health authority?
                </p>
                <div className="eligibility-options">
                  <label className="eligibility-option">
                    <input
                      type="radio"
                      name="health"
                      checked={hasHealthLicense === 'yes'}
                      onChange={() => setHasHealthLicense('yes')}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="eligibility-option">
                    <input
                      type="radio"
                      name="health"
                      checked={hasHealthLicense === 'no'}
                      onChange={() => setHasHealthLicense('no')}
                    />
                    <span>No</span>
                  </label>
                </div>
                <OptionalFileField
                  id="health-lic"
                  label="Health license document"
                  file={healthLicenseFile}
                  onChange={setHealthLicenseFile}
                  describedBy={docHintId}
                />
              </div>
            )}

            {step === 6 && (
              <div className="eligibility-step-body">
                <DocHint id={docHintId} />
                <div className="eligibility-row">
                  <div className="eligibility-field">
                    <label htmlFor="exp-start" className="eligibility-label">
                      Experience start<span className="eligibility-req"> *</span>
                    </label>
                    <input
                      id="exp-start"
                      type="month"
                      className="eligibility-input"
                      value={experienceStart}
                      onChange={(e) => setExperienceStart(e.target.value)}
                      required
                    />
                  </div>
                  <div className="eligibility-field">
                    <label htmlFor="exp-end" className="eligibility-label">
                      Experience end
                      {!stillWorking ? <span className="eligibility-req"> *</span> : null}
                    </label>
                    <input
                      id="exp-end"
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
                      name="mulexp"
                      checked={multipleExperienceLetters === 'yes'}
                      onChange={() => onMultipleLettersChange('yes')}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="eligibility-option">
                    <input
                      type="radio"
                      name="mulexp"
                      checked={multipleExperienceLetters === 'no'}
                      onChange={() => onMultipleLettersChange('no')}
                    />
                    <span>No</span>
                  </label>
                </div>

                {multipleExperienceLetters === 'yes' ? (
                  <p className="eligibility-letter-hint">
                    Add one upload per letter (optional). Use &quot;Add another experience letter&quot; for more
                    slots (max {MAX_EXPERIENCE_LETTER_SLOTS}).
                  </p>
                ) : null}

                {experienceLetterFiles.map((f, i) => (
                  <OptionalFileField
                    key={i}
                    id={`exp-letter-${i}`}
                    label={`Experience letter ${i + 1}`}
                    file={f}
                    onChange={(file) => setLetterFile(i, file)}
                    describedBy={docHintId}
                  />
                ))}

                {multipleExperienceLetters === 'yes' ? (
                  <button type="button" className="eligibility-add-letter" onClick={addLetterSlot}>
                    Add another experience letter
                  </button>
                ) : null}
              </div>
            )}

            {step === 7 && (
              <div className="eligibility-step-body eligibility-review">
                <p className="eligibility-review-intro">
                  Check the summary below. You are about to upload <strong>{uploadedDocCount}</strong> file
                  {uploadedDocCount === 1 ? '' : 's'} with this submission (optional files you skipped are not sent).
                </p>
                <dl className="eligibility-review-dl">
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
                    <dt>Credential uploads ({qualificationLabel})</dt>
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
                      {formatMonth(experienceStart)} →{' '}
                      {stillWorking ? 'Present' : formatMonth(experienceEnd)}
                    </dd>
                  </div>
                  <div className="eligibility-review-row">
                    <dt>Multiple experience letters</dt>
                    <dd>{yesNoLabel(multipleExperienceLetters)}</dd>
                  </div>
                </dl>
                <p className="eligibility-review-legal">
                  By submitting, you confirm the information above is accurate to the best of your knowledge.
                </p>
              </div>
            )}
          </article>

          <div className="eligibility-actions">
            {step > 1 ? (
              <button type="button" className="eligibility-btn secondary" onClick={goBack}>
                Back
              </button>
            ) : (
              <span className="eligibility-actions-spacer" />
            )}
            {step < totalSteps ? (
              <button type="button" className="eligibility-btn primary" onClick={goNext}>
                Next
              </button>
            ) : (
              <button
                type="button"
                className="eligibility-btn primary"
                disabled={submitMutation.isPending || !validateStep(7)}
                onClick={() => {
                  if (!validateStep(7)) {
                    toast.error('Please go back and complete any missing sections.');
                    return;
                  }
                  submitMutation.mutate();
                }}
              >
                {submitMutation.isPending ? 'Submitting…' : 'Submit assessment'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EligibilityAssessment;
