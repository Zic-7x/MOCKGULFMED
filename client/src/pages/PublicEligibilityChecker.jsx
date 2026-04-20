import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import logoUrl from '../image/Gemini_Generated_Image_wtgqj3wtgqj3wtgq-removebg-preview.png';
import { fetchPublicCatalog } from '../utils/publicApi';
import './PublicEligibilityChecker.css';

const STEPS = [
  { id: 1, title: 'Pathway', hint: 'Profession & regulator' },
  { id: 2, title: 'Education', hint: 'Highest credential' },
  { id: 3, title: 'Readiness', hint: 'Documents & experience' },
  { id: 4, title: 'Summary', hint: 'Next steps' },
];

const QUALIFICATIONS = [
  { value: 'DIPLOMA', label: 'Diploma', description: 'Diploma-level clinical or allied health programme' },
  { value: 'BACHELOR', label: 'Bachelor', description: 'Undergraduate degree (e.g. MBBS, BSc Nursing)' },
  { value: 'MASTERS', label: 'Masters', description: 'Postgraduate degree or specialist training' },
  { value: 'PHD', label: 'PhD', description: 'Doctorate / PhD research degree' },
];

const ATTESTATION_OPTIONS = [
  { value: 'HEA', label: 'Higher Education Authority (HEA)' },
  { value: 'MOFA', label: 'MoFA / embassy attestation' },
  { value: 'HEA_AND_MOFA', label: 'Both HEA and MoFA (where required)' },
  { value: 'NONE', label: 'Not attested yet' },
  { value: 'NOT_APPLICABLE', label: 'Not applicable / still in progress' },
];

const RING_R = 20;
const RING_C = 2 * Math.PI * RING_R;

const STORAGE_KEY = 'publicEligibilityChecker:v1';

function safeParseJson(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readDraft() {
  if (typeof window === 'undefined') return null;
  return safeParseJson(window.localStorage.getItem(STORAGE_KEY));
}

function writeDraft(next) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage failures (private mode / quota)
  }
}

function filterByName(items, q) {
  const needle = (q || '').trim().toLowerCase();
  if (!needle) return items;
  return items.filter((row) => {
    const name = String(row?.name || '').toLowerCase();
    const country = String(row?.country || '').toLowerCase();
    return name.includes(needle) || country.includes(needle);
  });
}

function PickList({ items, selectedId, onSelect, emptyLabel }) {
  if (!items.length) {
    return <div className="pec-pick-empty">{emptyLabel}</div>;
  }
  return (
    <div className="pec-pick-list" role="listbox" aria-label="Options">
      {items.map((row) => {
        const id = String(row.id);
        const selected = id === String(selectedId ?? '');
        return (
          <button
            key={id}
            type="button"
            role="option"
            aria-selected={selected}
            className={`pec-pick-item${selected ? ' pec-pick-item--selected' : ''}`}
            onClick={() => onSelect(id)}
          >
            {row.name}
            {row.country ? ` · ${row.country}` : ''}
          </button>
        );
      })}
    </div>
  );
}

function ToggleRow({ pressed, onToggle, title, description }) {
  return (
    <button type="button" className="pec-toggle" onClick={() => onToggle(!pressed)} aria-pressed={pressed}>
      <span className="pec-toggle-box" aria-hidden>
        <span className="pec-toggle-check" />
      </span>
      <span className="pec-toggle-text">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
    </button>
  );
}

function computeReadiness(state) {
  const attestationOk = state.documentAttestation && state.documentAttestation !== 'NONE';
  const licenseOk = state.healthLicenseStatus === 'have' || state.healthLicenseStatus === 'applying';
  const experienceOk = state.experienceDocs === 'collecting' || state.experienceDocs === 'ready';

  const items = [
    { id: 'prof', label: 'Profession selected', ok: !!state.professionId, weight: 11 },
    { id: 'ha', label: 'Health authority / board selected', ok: !!state.healthAuthorityId, weight: 11 },
    { id: 'qual', label: 'Highest qualification chosen', ok: !!state.qualificationLevel, weight: 13 },
    { id: 'grad', label: 'Graduation / completion year ready', ok: !!state.knowsGraduationYear, weight: 9 },
    { id: 'issued', label: 'Degree / diploma issue year ready', ok: !!state.knowsIssuedYear, weight: 9 },
    { id: 'creds', label: 'Certificates & transcripts on hand', ok: !!state.hasCredentialCopies, weight: 10 },
    { id: 'attest', label: 'Attestation pathway clear', ok: attestationOk, weight: 12 },
    { id: 'lic', label: 'License status clear (held or in progress)', ok: licenseOk, weight: 13 },
    { id: 'exp', label: 'Experience evidence planned or ready', ok: experienceOk, weight: 12 },
  ];

  const total = items.reduce((acc, row) => acc + row.weight, 0);
  const earned = items.filter((row) => row.ok).reduce((acc, row) => acc + row.weight, 0);
  const percent = total ? Math.round((earned / total) * 100) : 0;

  let headline = 'Keep going';
  if (percent >= 88) headline = 'Strong preparation';
  else if (percent >= 55) headline = 'Good progress';
  else if (percent >= 30) headline = 'Early snapshot';

  return { items, percent, earned, total, headline, attestationOk, licenseOk, experienceOk };
}

function PublicEligibilityChecker() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [professionSearch, setProfessionSearch] = useState('');
  const [haSearch, setHaSearch] = useState('');

  const [professionId, setProfessionId] = useState('');
  const [healthAuthorityId, setHealthAuthorityId] = useState('');
  const [qualificationLevel, setQualificationLevel] = useState('');
  const [knowsGraduationYear, setKnowsGraduationYear] = useState(false);
  const [knowsIssuedYear, setKnowsIssuedYear] = useState(false);
  const [hasCredentialCopies, setHasCredentialCopies] = useState(false);
  const [documentAttestation, setDocumentAttestation] = useState('');
  const [healthLicenseStatus, setHealthLicenseStatus] = useState('not_yet');
  const [experienceDocs, setExperienceDocs] = useState('not_yet');

  const didHydrateRef = useRef(false);

  const { data: catalog, isLoading, isError, error } = useQuery({
    queryKey: ['public-catalog', 'eligibility-checker'],
    queryFn: fetchPublicCatalog,
    staleTime: 60_000,
  });

  const professions = catalog?.professions || [];
  const healthAuthorities = catalog?.healthAuthorities || [];

  const filteredProfessions = useMemo(() => filterByName(professions, professionSearch), [professions, professionSearch]);
  const filteredHa = useMemo(() => filterByName(healthAuthorities, haSearch), [healthAuthorities, haSearch]);

  const professionLabel = useMemo(() => {
    const row = professions.find((p) => String(p.id) === String(professionId));
    return row?.name || '';
  }, [professions, professionId]);

  const haLabel = useMemo(() => {
    const row = healthAuthorities.find((h) => String(h.id) === String(healthAuthorityId));
    if (!row) return '';
    return row.country ? `${row.name} (${row.country})` : row.name;
  }, [healthAuthorities, healthAuthorityId]);

  const formState = useMemo(
    () => ({
      professionId,
      healthAuthorityId,
      qualificationLevel,
      knowsGraduationYear,
      knowsIssuedYear,
      hasCredentialCopies,
      documentAttestation,
      healthLicenseStatus,
      experienceDocs,
    }),
    [
      professionId,
      healthAuthorityId,
      qualificationLevel,
      knowsGraduationYear,
      knowsIssuedYear,
      hasCredentialCopies,
      documentAttestation,
      healthLicenseStatus,
      experienceDocs,
    ]
  );

  const readiness = useMemo(() => computeReadiness(formState), [formState]);

  useEffect(() => {
    if (didHydrateRef.current) return;
    didHydrateRef.current = true;
    const draft = readDraft();
    if (!draft || typeof draft !== 'object') return;

    const savedStep = Number(draft?.step);
    if (Number.isFinite(savedStep) && savedStep >= 1 && savedStep <= STEPS.length) {
      setStep(savedStep);
    }

    const saved = draft?.data || {};
    if (typeof saved?.professionId === 'string') setProfessionId(saved.professionId);
    if (typeof saved?.healthAuthorityId === 'string') setHealthAuthorityId(saved.healthAuthorityId);
    if (typeof saved?.qualificationLevel === 'string') setQualificationLevel(saved.qualificationLevel);
    if (typeof saved?.knowsGraduationYear === 'boolean') setKnowsGraduationYear(saved.knowsGraduationYear);
    if (typeof saved?.knowsIssuedYear === 'boolean') setKnowsIssuedYear(saved.knowsIssuedYear);
    if (typeof saved?.hasCredentialCopies === 'boolean') setHasCredentialCopies(saved.hasCredentialCopies);
    if (typeof saved?.documentAttestation === 'string') setDocumentAttestation(saved.documentAttestation);
    if (typeof saved?.healthLicenseStatus === 'string') setHealthLicenseStatus(saved.healthLicenseStatus);
    if (typeof saved?.experienceDocs === 'string') setExperienceDocs(saved.experienceDocs);
  }, []);

  useEffect(() => {
    if (!didHydrateRef.current) return;
    writeDraft({
      updatedAt: new Date().toISOString(),
      step,
      data: formState,
    });
  }, [step, formState]);

  const scrollToLive = useCallback(() => {
    document.getElementById('pec-live-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const canAdvance = useMemo(() => {
    if (step === 1) return !!professionId && !!healthAuthorityId;
    if (step === 2) return !!qualificationLevel;
    if (step === 3) return !!documentAttestation;
    return true;
  }, [step, professionId, healthAuthorityId, qualificationLevel, documentAttestation]);

  const goNext = () => setStep((s) => Math.min(STEPS.length, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const ringOffset = RING_C - (RING_C * readiness.percent) / 100;

  return (
    <div className="pec-page">
      <header className="pec-header">
        <div className="pec-header-inner">
          <Link className="pec-brand" to="/">
            <img className="pec-logo" src={logoUrl} alt="MockGulfMed home" />
            <span className="sr-only">MockGulfMed</span>
          </Link>
          <nav className="pec-nav" aria-label="Public pages">
            <Link className="pec-nav-link pec-nav-link--ghost" to="/packages">
              Packages
            </Link>
            <Link className="pec-nav-link" to="/login">
              Sign in
            </Link>
            <Link className="pec-nav-link" to="/register">
              Create account
            </Link>
          </nav>
        </div>
      </header>

      <main className="pec-main">
        <div className="pec-hero">
          <h1>Eligibility readiness check</h1>
          <p>
            Answer a few questions to see how complete your pathway looks before you register. This interactive check
            updates instantly as you go — it is a self-assessment only and does not replace an official eligibility
            review after you sign in.
          </p>
          {user && user.role !== 'ADMIN' && (
            <div className="pec-signed-in">
              You are signed in. To upload documents and submit for review, open the{' '}
              <Link to="/eligibility-assessment">full eligibility assessment</Link> from your dashboard workflow.
            </div>
          )}
        </div>

        {isLoading && <p className="pec-card-sub">Loading professions and health authorities…</p>}
        {isError && (
          <div className="pec-card" role="alert">
            <p>We could not load the public catalog ({error?.message || 'unknown error'}). Refresh the page or try again later.</p>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <nav className="pec-stepper" aria-label="Steps">
              {STEPS.map((meta) => {
                const done = step > meta.id;
                const current = step === meta.id;
                return (
                  <div
                    key={meta.id}
                    className={`pec-step-chip${current ? ' pec-step-chip--current' : ''}${done ? ' pec-step-chip--done' : ''}`}
                    title={meta.hint}
                  >
                    <span aria-hidden>{done ? '✓' : meta.id}</span> {meta.title}
                  </div>
                );
              })}
            </nav>

            <div className="pec-layout">
              <div className="pec-form-col">
                <div className="pec-card">
                  {step === 1 && (
                    <>
                      <h2>Your licensing pathway</h2>
                      <p className="pec-card-sub">Pick the profession and health authority that best match the exam you are preparing for.</p>

                      <div className="pec-field">
                        <label htmlFor="pec-prof-search">Profession</label>
                        <input
                          id="pec-prof-search"
                          className="pec-search"
                          type="search"
                          inputMode="search"
                          autoComplete="off"
                          placeholder="Search by profession name…"
                          value={professionSearch}
                          onChange={(e) => setProfessionSearch(e.target.value)}
                        />
                        <PickList
                          items={filteredProfessions}
                          selectedId={professionId}
                          onSelect={setProfessionId}
                          emptyLabel="No professions match that search."
                        />
                        {professionLabel ? (
                          <div className="pec-selected-pill" aria-live="polite">
                            Selected: {professionLabel}
                          </div>
                        ) : null}
                      </div>

                      <div className="pec-field">
                        <label htmlFor="pec-ha-search">Health authority / board</label>
                        <input
                          id="pec-ha-search"
                          className="pec-search"
                          type="search"
                          inputMode="search"
                          autoComplete="off"
                          placeholder="Search by authority or country…"
                          value={haSearch}
                          onChange={(e) => setHaSearch(e.target.value)}
                        />
                        <PickList
                          items={filteredHa}
                          selectedId={healthAuthorityId}
                          onSelect={setHealthAuthorityId}
                          emptyLabel="No health authorities match that search."
                        />
                        {haLabel ? (
                          <div className="pec-selected-pill" aria-live="polite">
                            Selected: {haLabel}
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <h2>Highest qualification</h2>
                      <p className="pec-card-sub">Select the top credential you will present for licensing preparation.</p>
                      <div className="pec-qual-grid" role="radiogroup" aria-label="Qualification level">
                        {QUALIFICATIONS.map((q) => (
                          <label key={q.value} className="pec-qual-option">
                            <input
                              type="radio"
                              name="qual"
                              value={q.value}
                              checked={qualificationLevel === q.value}
                              onChange={() => setQualificationLevel(q.value)}
                            />
                            <span className="pec-qual-card">
                              <span className="pec-qual-title">{q.label}</span>
                              <span className="pec-qual-desc">{q.description}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <h2>Document & experience readiness</h2>
                      <p className="pec-card-sub">
                        Toggle what already applies to you. The checklist on the right (or above on small screens)
                        updates in real time.
                      </p>

                      <div className="pec-toggle-grid">
                        <ToggleRow
                          title="I know my graduation (or programme completion) year"
                          description="You will need this for the official form."
                          pressed={knowsGraduationYear}
                          onToggle={setKnowsGraduationYear}
                        />
                        <ToggleRow
                          title="I know my degree or diploma issue year"
                          description="May differ from completion year for some pathways."
                          pressed={knowsIssuedYear}
                          onToggle={setKnowsIssuedYear}
                        />
                        <ToggleRow
                          title="I have copies of certificates and transcripts ready"
                          description="Digital scans are fine for practice; official review may ask for attestations."
                          pressed={hasCredentialCopies}
                          onToggle={setHasCredentialCopies}
                        />
                      </div>

                      <div className="pec-field" style={{ marginTop: 20 }}>
                        <span style={{ marginBottom: 8, display: 'block', fontWeight: 700, fontSize: 13 }}>
                          Document attestation status
                        </span>
                        <div className="pec-radio-group" role="radiogroup" aria-label="Attestation">
                          {ATTESTATION_OPTIONS.map((opt) => (
                            <label key={opt.value} className="pec-radio">
                              <input
                                type="radio"
                                name="attest"
                                value={opt.value}
                                checked={documentAttestation === opt.value}
                                onChange={() => setDocumentAttestation(opt.value)}
                              />
                              {opt.label}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="pec-field">
                        <span style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>National health license</span>
                        <div className="pec-radio-group" role="radiogroup" aria-label="License">
                          <label className="pec-radio">
                            <input
                              type="radio"
                              name="lic"
                              checked={healthLicenseStatus === 'have'}
                              onChange={() => setHealthLicenseStatus('have')}
                            />
                            I hold an active license (or renewal in good standing)
                          </label>
                          <label className="pec-radio">
                            <input
                              type="radio"
                              name="lic"
                              checked={healthLicenseStatus === 'applying'}
                              onChange={() => setHealthLicenseStatus('applying')}
                            />
                            Application submitted / exam pending — not issued yet
                          </label>
                          <label className="pec-radio">
                            <input
                              type="radio"
                              name="lic"
                              checked={healthLicenseStatus === 'not_yet'}
                              onChange={() => setHealthLicenseStatus('not_yet')}
                            />
                            Not started yet
                          </label>
                        </div>
                      </div>

                      <div className="pec-field">
                        <span style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Clinical experience letters</span>
                        <div className="pec-radio-group" role="radiogroup" aria-label="Experience letters">
                          <label className="pec-radio">
                            <input
                              type="radio"
                              name="exp"
                              checked={experienceDocs === 'ready'}
                              onChange={() => setExperienceDocs('ready')}
                            />
                            Ready — I can obtain signed letters quickly
                          </label>
                          <label className="pec-radio">
                            <input
                              type="radio"
                              name="exp"
                              checked={experienceDocs === 'collecting'}
                              onChange={() => setExperienceDocs('collecting')}
                            />
                            In progress — employers or HR are working on it
                          </label>
                          <label className="pec-radio">
                            <input
                              type="radio"
                              name="exp"
                              checked={experienceDocs === 'not_yet'}
                              onChange={() => setExperienceDocs('not_yet')}
                            />
                            Not yet — still mapping my employment history
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {step === 4 && (
                    <>
                      <h2>Your snapshot</h2>
                      <p className="pec-card-sub">
                        Readiness score: <strong>{readiness.percent}%</strong> — {readiness.headline}. Create an account when
                        you are ready to upload evidence and complete the official assessment inside the portal.
                      </p>
                      <ul className="pec-live-list" aria-label="Summary checklist">
                        {readiness.items.map((row) => (
                          <li key={row.id} className="pec-live-item">
                            <span className={`pec-live-icon${row.ok ? ' pec-live-icon--ok' : ' pec-live-icon--pending'}`} aria-hidden>
                              {row.ok ? '✓' : '·'}
                            </span>
                            <span>
                              <strong>{row.label}</strong>
                              {row.ok ? ' — looks covered for now.' : ' — still open.'}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="pec-disclaimer">
                        MockGulfMed does not guarantee eligibility outcomes. Boards and regulators make final decisions.
                        This tool only helps you organise what you will need before you apply or register for preparation.
                      </p>
                      <div className="pec-summary-cta">
                        <Link className="pec-btn pec-btn-primary" to="/register">
                          Create account
                        </Link>
                        <Link className="pec-btn pec-btn-primary pec-cta-outline" to="/login">
                          Sign in
                        </Link>
                      </div>
                    </>
                  )}

                  {step < 4 && (
                    <div className="pec-actions">
                      <button type="button" className="pec-btn pec-btn-secondary" onClick={goBack} disabled={step === 1}>
                        Back
                      </button>
                      <button type="button" className="pec-btn pec-btn-primary" onClick={goNext} disabled={!canAdvance}>
                        Continue
                      </button>
                    </div>
                  )}
                  {step === 4 && (
                    <div className="pec-actions">
                      <button type="button" className="pec-btn pec-btn-secondary" onClick={goBack}>
                        Back
                      </button>
                      <button
                        type="button"
                        className="pec-btn pec-btn-secondary"
                        onClick={() => {
                          setStep(1);
                          setProfessionSearch('');
                          setHaSearch('');
                          setProfessionId('');
                          setHealthAuthorityId('');
                          setQualificationLevel('');
                          setKnowsGraduationYear(false);
                          setKnowsIssuedYear(false);
                          setHasCredentialCopies(false);
                          setDocumentAttestation('');
                          setHealthLicenseStatus('not_yet');
                          setExperienceDocs('not_yet');
                          writeDraft({
                            updatedAt: new Date().toISOString(),
                            step: 1,
                            data: {
                              professionId: '',
                              healthAuthorityId: '',
                              qualificationLevel: '',
                              knowsGraduationYear: false,
                              knowsIssuedYear: false,
                              hasCredentialCopies: false,
                              documentAttestation: '',
                              healthLicenseStatus: 'not_yet',
                              experienceDocs: 'not_yet',
                            },
                          });
                        }}
                      >
                        Start over
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {step < 4 && (
                <aside className="pec-live" id="pec-live-panel" aria-live="polite" aria-label="Live readiness">
                  <div className="pec-live-head">
                    <h3>Live readiness</h3>
                    <div className="pec-ring-wrap">
                      <svg className="pec-ring-svg" viewBox="0 0 56 56" aria-hidden>
                        <defs>
                          <linearGradient id="pecRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#0b6ea8" />
                            <stop offset="100%" stopColor="#2bb673" />
                          </linearGradient>
                        </defs>
                        <circle className="pec-ring-bg" cx="28" cy="28" r={RING_R} />
                        <circle
                          className="pec-ring-fg"
                          cx="28"
                          cy="28"
                          r={RING_R}
                          strokeDasharray={RING_C}
                          strokeDashoffset={ringOffset}
                        />
                      </svg>
                      <span className="pec-ring-label">{readiness.percent}%</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: '#475569', marginBottom: 10 }}>{readiness.headline}</p>
                  <ul className="pec-live-list">
                    {readiness.items.map((row) => (
                      <li key={row.id} className="pec-live-item">
                        <span className={`pec-live-icon${row.ok ? ' pec-live-icon--ok' : ' pec-live-icon--pending'}`} aria-hidden>
                          {row.ok ? '✓' : '·'}
                        </span>
                        <span>{row.label}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="pec-disclaimer">
                    Updates instantly as you change answers. Not stored on our servers until you submit the signed-in
                    assessment.
                  </p>
                </aside>
              )}
            </div>
          </>
        )}
      </main>

      {step < 4 && !isLoading && !isError && (
        <div className="pec-mobile-bar">
          <div className="pec-mobile-bar-text">
            Readiness <strong>{readiness.percent}%</strong>
            <br />
            <span style={{ fontSize: 12, color: '#64748b' }}>{readiness.headline}</span>
          </div>
          <button type="button" className="pec-mobile-bar-btn" onClick={scrollToLive}>
            Checklist
          </button>
        </div>
      )}
    </div>
  );
}

export default PublicEligibilityChecker;
