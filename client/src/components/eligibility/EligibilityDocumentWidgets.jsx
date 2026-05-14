import { useState } from 'react';
import toast from 'react-hot-toast';

export const MAX_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_EXPERIENCE_LETTER_SLOTS = 8;

export const QUALIFICATIONS = [
  { value: 'DIPLOMA', label: 'Diploma', description: 'Diploma-level clinical or allied health programme' },
  { value: 'BACHELOR', label: 'Bachelor', description: 'Undergraduate degree (e.g. MBBS, BSc Nursing)' },
  { value: 'MASTERS', label: 'Masters', description: 'Postgraduate degree or specialist training' },
  { value: 'PHD', label: 'PhD', description: 'Doctorate / PhD research degree' },
];

export const ATTESTATION_OPTIONS = [
  { value: 'HEA', label: 'Yes — Higher Education Authority (HEA) only' },
  { value: 'MOFA', label: 'Yes — Ministry of Foreign Affairs / embassy attestation only' },
  { value: 'HEA_AND_MOFA', label: 'Yes — both HEA and MoFA (where required)' },
  { value: 'NONE', label: 'No — not attested yet' },
  { value: 'NOT_APPLICABLE', label: 'Not applicable / still in progress' },
];

export function formatFileSize(bytes) {
  if (bytes == null || !Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocHint({ id }) {
  return (
    <p id={id} className="eligibility-doc-hint">
      <strong>Optional uploads.</strong> You may skip every file below. For the most accurate eligibility review,
      we still recommend uploading anything you have ready—especially transcripts and licenses.
    </p>
  );
}

export function OptionalFileField({
  id,
  label,
  file,
  onChange,
  describedBy,
  accept = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx',
}) {
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

export function graduationYearQuestion(level) {
  if (level === 'DIPLOMA') return 'In which year did you complete your programme?';
  return 'In which year did you complete your graduation?';
}

export function degreeIssuedYearQuestion(level) {
  if (level === 'DIPLOMA') return 'In which year was your diploma awarded / issued?';
  return 'In which year was your degree issued?';
}

export const EMPTY_CREDENTIAL_FILES = {
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
export function CredentialUploadPanel({ level, files, onFilesChange, docHintId }) {
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

export function attestationReviewLabel(value) {
  const o = ATTESTATION_OPTIONS.find((x) => x.value === value);
  return o?.label || '—';
}

export function yesNoLabel(v) {
  if (v === 'yes') return 'Yes';
  if (v === 'no') return 'No';
  return '—';
}
