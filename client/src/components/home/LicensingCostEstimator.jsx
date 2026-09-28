import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

const LICENSE_PROCESSING_FEE_USD = 250;
const CONSULTATION_FEE_USD = 20;

const AUTHORITIES = [
  {
    id: 'dha',
    name: 'DHA — Dubai Health Authority',
    region: 'Dubai, UAE',
    currency: 'AED',
    exchange: 3.67,
    baseDataflowUsd: 280,
    authorityRegUsd: 60,
    examFeeUsd: 260,
    baseLicenseFeeUsd: 275,
    licenseNotes: 'Sheryan post-exam license activation & practice permit',
    examBody: 'Prometric CBT (Dubai)',
    fastTrackDays: '8–12 business days',
    regularDays: '18–25 business days',
    passScore: '60% (GP) / 65% (Specialist)'
  },
  {
    id: 'scfhs',
    name: 'SCFHS — Saudi Commission for Health Specialties',
    region: 'Saudi Arabia',
    currency: 'SAR',
    exchange: 3.75,
    baseDataflowUsd: 310,
    authorityRegUsd: 80,
    examFeeUsd: 290,
    baseLicenseFeeUsd: 295,
    licenseNotes: 'Mumaris+ classification & professional registration card',
    examBody: 'Prometric CBT (SMLE / SNLE / SDLE)',
    fastTrackDays: '10–14 business days',
    regularDays: '20–30 business days',
    passScore: '50% – 60% Scaled Score'
  },
  {
    id: 'doh',
    name: 'DOH / HAAD — Department of Health',
    region: 'Abu Dhabi, UAE',
    currency: 'AED',
    exchange: 3.67,
    baseDataflowUsd: 295,
    authorityRegUsd: 70,
    examFeeUsd: 275,
    baseLicenseFeeUsd: 275,
    licenseNotes: 'TAMM / DOH post-exam healthcare practice license',
    examBody: 'Pearson VUE Computer Test',
    fastTrackDays: '9–12 business days',
    regularDays: '18–24 business days',
    passScore: '60% – 65%'
  },
  {
    id: 'mohap',
    name: 'MOHAP — Ministry of Health & Prevention',
    region: 'Sharjah & Northern Emirates, UAE',
    currency: 'AED',
    exchange: 3.67,
    baseDataflowUsd: 280,
    authorityRegUsd: 55,
    examFeeUsd: 250,
    baseLicenseFeeUsd: 270,
    licenseNotes: 'MOHAP electronic evaluation & practice license certificate',
    examBody: 'Prometric CBT',
    fastTrackDays: '8–12 business days',
    regularDays: '16–22 business days',
    passScore: '60%'
  },
  {
    id: 'omsb',
    name: 'OMSB — Oman Medical Specialty Board',
    region: 'Sultanate of Oman',
    currency: 'OMR',
    exchange: 0.385,
    baseDataflowUsd: 290,
    authorityRegUsd: 65,
    examFeeUsd: 240,
    baseLicenseFeeUsd: 260,
    licenseNotes: 'OMSB / MOH Oman clinical practice license registration',
    examBody: 'Prometric CBT (OMSB Standard)',
    fastTrackDays: '10–14 business days',
    regularDays: '20–28 business days',
    passScore: '60%'
  },
  {
    id: 'qchp',
    name: 'QCHP / MOPH — Qatar Council for Healthcare Practitioners',
    region: 'State of Qatar',
    currency: 'QAR',
    exchange: 3.64,
    baseDataflowUsd: 320,
    authorityRegUsd: 90,
    examFeeUsd: 280,
    baseLicenseFeeUsd: 280,
    licenseNotes: 'DHP / MOPH Qatar healthcare practitioner license registration',
    examBody: 'Prometric CBT',
    fastTrackDays: '10–15 business days',
    regularDays: '22–30 business days',
    passScore: '60% – 65%'
  }
];

const ROLES = [
  { id: 'gp', name: 'General Practitioner (MBBS / MD)', feeMod: 1.0, expYears: 2 },
  { id: 'specialist', name: 'Specialist / Consultant Doctor', feeMod: 1.35, expYears: 3 },
  { id: 'nurse', name: 'Registered Nurse (BSc / Diploma)', feeMod: 0.85, expYears: 2 },
  { id: 'nurse_spec', name: 'Specialist Nurse (Critical Care / ICU / OT)', feeMod: 0.95, expYears: 2 },
  { id: 'pharmacist', name: 'Pharmacist (B.Pharm / PharmD)', feeMod: 0.9, expYears: 2 },
  { id: 'dentist', name: 'General Dentist (BDS / DDS)', feeMod: 1.05, expYears: 2 },
  { id: 'allied', name: 'Allied Health: Physiotherapist & Rehab', feeMod: 0.85, expYears: 2 },
  { id: 'allied_lab', name: 'Allied Health: Medical Lab Technologist', feeMod: 0.85, expYears: 2 },
  { id: 'allied_radiology', name: 'Allied Health: Radiographer & Medical Imaging', feeMod: 0.85, expYears: 2 },
  { id: 'allied_nutrition', name: 'Allied Health: Clinical Nutritionist / Dietitian', feeMod: 0.85, expYears: 2 },
  { id: 'allied_respiratory', name: 'Allied Health: Respiratory Therapist', feeMod: 0.85, expYears: 2 },
  { id: 'allied_paramedic', name: 'Allied Health: Emergency Paramedic / EMT', feeMod: 0.85, expYears: 2 },
  { id: 'allied_optometry', name: 'Allied Health: Optometrist & Vision Specialist', feeMod: 0.85, expYears: 2 },
  { id: 'allied_anesthesia', name: 'Allied Health: Anesthesia Technologist', feeMod: 0.85, expYears: 2 },
  { id: 'allied_other', name: 'Allied Health: Other Paramedical Specialties', feeMod: 0.85, expYears: 2 }
];

export default function LicensingCostEstimator() {
  const [selectedAuthId, setSelectedAuthId] = useState('dha');
  const [selectedRoleId, setSelectedRoleId] = useState('gp');
  const [docCount, setDocCount] = useState('standard'); // 'standard' (3 items) or 'extended' (5 items)
  const [isFastTrack, setIsFastTrack] = useState(false);
  
  // Separate Fees Controls
  const [includeLicenseFee, setIncludeLicenseFee] = useState(true);
  const [includeProcessingService, setIncludeProcessingService] = useState(true);
  const [includeConsultation, setIncludeConsultation] = useState(false); // optional
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'original'

  const auth = AUTHORITIES.find((a) => a.id === selectedAuthId) || AUTHORITIES[0];
  const role = ROLES.find((r) => r.id === selectedRoleId) || ROLES[0];

  const calculation = useMemo(() => {
    // 1. Original Pre-Licensing & Exam Costs
    let psvUsd = auth.baseDataflowUsd * role.feeMod;
    if (docCount === 'extended') {
      psvUsd += 120; // additional certificates verification
    }
    if (isFastTrack) {
      psvUsd += 95; // DataFlow TrueFast express surcharge
    }
    const psvRoundedUsd = Math.round(psvUsd);
    const examUsd = auth.examFeeUsd;
    const authRegUsd = auth.authorityRegUsd;
    const originalCostUsd = psvRoundedUsd + examUsd + authRegUsd;
    const originalCostLocal = Math.round(originalCostUsd * auth.exchange);

    // 2. Separate Health Authority License Fee (Official Post-Exam Cost)
    const authorityLicenseFeeUsd = Math.round(auth.baseLicenseFeeUsd * (role.feeMod || 1.0));
    const authorityLicenseFeeLocal = Math.round(authorityLicenseFeeUsd * auth.exchange);

    // 3. Separate Professional Services
    const processingFeeUsd = includeProcessingService ? LICENSE_PROCESSING_FEE_USD : 0;
    const processingFeeLocal = Math.round(processingFeeUsd * auth.exchange);

    const consultationFeeUsd = includeConsultation ? CONSULTATION_FEE_USD : 0;
    const consultationFeeLocal = Math.round(consultationFeeUsd * auth.exchange);

    const servicesTotalUsd = processingFeeUsd + consultationFeeUsd;
    const servicesTotalLocal = Math.round(servicesTotalUsd * auth.exchange);

    // Separate Fees Total (License Fee + Professional Services)
    const separateFeesTotalUsd = (includeLicenseFee ? authorityLicenseFeeUsd : 0) + servicesTotalUsd;
    const separateFeesTotalLocal = Math.round(separateFeesTotalUsd * auth.exchange);

    // Grand Total (Original Cost + Separate Fees)
    const grandTotalUsd = originalCostUsd + separateFeesTotalUsd;
    const grandTotalLocal = Math.round(grandTotalUsd * auth.exchange);

    const turnaround = isFastTrack ? auth.fastTrackDays : auth.regularDays;

    return {
      psvUsd: psvRoundedUsd,
      examUsd,
      authRegUsd,
      originalCostUsd,
      originalCostLocal,
      authorityLicenseFeeUsd,
      authorityLicenseFeeLocal,
      processingFeeUsd,
      processingFeeLocal,
      consultationFeeUsd,
      consultationFeeLocal,
      servicesTotalUsd,
      servicesTotalLocal,
      separateFeesTotalUsd,
      separateFeesTotalLocal,
      grandTotalUsd,
      grandTotalLocal,
      turnaround
    };
  }, [auth, role, docCount, isFastTrack, includeProcessingService, includeConsultation, includeLicenseFee]);

  return (
    <section className="ctg-section ctg-estimator-section" id="ctg-estimator" aria-labelledby="ctg-estimator-heading">
      <div className="ctg-section-inner">
        <div className="ctg-section-header">
          <span className="ctg-section-eyebrow">2026 Interactive Fee &amp; Timeline Engine</span>
          <h2 className="ctg-section-title" id="ctg-estimator-heading">
            Gulf Licensing Cost &amp; Turnaround Estimator
          </h2>
          <p className="ctg-section-desc">
            Get instant clarity on official DataFlow PSV fees, health authority filing, Prometric/Pearson test booking costs, authority license fees, and concierge processing options.
          </p>
        </div>

        <div className="ctg-estimator-grid">
          {/* Left: Interactive Controls */}
          <div className="ctg-estimator-controls">
            <div className="ctg-estimator-field">
              <label htmlFor="est-authority" className="ctg-field-label">
                1. Target Gulf Regulatory Authority
              </label>
              <select
                id="est-authority"
                className="ctg-select"
                value={selectedAuthId}
                onChange={(e) => setSelectedAuthId(e.target.value)}
              >
                {AUTHORITIES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.region})
                  </option>
                ))}
              </select>
            </div>

            <div className="ctg-estimator-field">
              <label htmlFor="est-profession" className="ctg-field-label">
                2. Medical Profession / Specialty
              </label>
              <select
                id="est-profession"
                className="ctg-select"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="ctg-estimator-field">
              <span className="ctg-field-label">3. Documents Package Verification Scope</span>
              <div className="ctg-estimator-radio-group">
                <label className={`ctg-estimator-radio-card ${docCount === 'standard' ? 'ctg-estimator-radio-card--active' : ''}`}>
                  <input
                    type="radio"
                    name="docCount"
                    checked={docCount === 'standard'}
                    onChange={() => setDocCount('standard')}
                  />
                  <div>
                    <strong>Standard Package (3 Items)</strong>
                    <p>1 Primary Degree + 1 Home Country License + 1 Experience Certificate</p>
                  </div>
                </label>

                <label className={`ctg-estimator-radio-card ${docCount === 'extended' ? 'ctg-estimator-radio-card--active' : ''}`}>
                  <input
                    type="radio"
                    name="docCount"
                    checked={docCount === 'extended'}
                    onChange={() => setDocCount('extended')}
                  />
                  <div>
                    <strong>Comprehensive / Specialist (5 Items)</strong>
                    <p>Basic Degree + Specialist Master + Council License + 2+ Hospital Experience Letters</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="ctg-estimator-field">
              <label className="ctg-toggle-container">
                <input
                  type="checkbox"
                  checked={isFastTrack}
                  onChange={(e) => setIsFastTrack(e.target.checked)}
                />
                <span className="ctg-toggle-slider" />
                <span className="ctg-toggle-text">
                  <strong>Enable DataFlow TrueFast™ Express (Express Turnaround)</strong>
                  <span className="ctg-toggle-sub">Cuts standard PSV verification time in half with priority institutional contact (+ $95 USD).</span>
                </span>
              </label>
            </div>

            {/* Separate Additional Fees Controls */}
            <div className="ctg-estimator-field">
              <span className="ctg-field-label">
                4. Separate Additional Fees &amp; Services
              </span>
              <div className="ctg-estimator-addons-group">
                {/* Health Authority License Fee Toggle */}
                <label className={`ctg-addon-card ${includeLicenseFee ? 'ctg-addon-card--active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={includeLicenseFee}
                    onChange={(e) => setIncludeLicenseFee(e.target.checked)}
                  />
                  <div className="ctg-addon-content">
                    <div className="ctg-addon-header">
                      <span className="ctg-addon-title">
                        Health Authority License Fee (~${calculation.authorityLicenseFeeUsd} USD)
                      </span>
                      <span className="ctg-addon-badge ctg-addon-badge--emerald">
                        Official Authority Fee
                      </span>
                    </div>
                    <p className="ctg-addon-desc">
                      Official post-exam practice license issuance &amp; registration fee charged directly by {auth.name.split('—')[0].trim()} (≈ {calculation.authorityLicenseFeeLocal} {auth.currency}). Kept separate from original pre-exam costs.
                    </p>
                  </div>
                </label>

                {/* License Processing Service Fee 250 USD */}
                <label className={`ctg-addon-card ${includeProcessingService ? 'ctg-addon-card--active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={includeProcessingService}
                    onChange={(e) => setIncludeProcessingService(e.target.checked)}
                  />
                  <div className="ctg-addon-content">
                    <div className="ctg-addon-header">
                      <span className="ctg-addon-title">
                        License Processing Service Fee ($250 USD)
                      </span>
                      <span className="ctg-addon-badge ctg-addon-badge--purple">
                        Concierge Assistance
                      </span>
                    </div>
                    <p className="ctg-addon-desc">
                      End-to-end full service: credential preparation, DataFlow PSV filing &amp; follow-up, health authority portal registration, and exam booking support (≈ {Math.round(LICENSE_PROCESSING_FEE_USD * auth.exchange)} {auth.currency}).
                    </p>
                  </div>
                </label>

                {/* Consultation Fee 20 USD Optional */}
                <label className={`ctg-addon-card ${includeConsultation ? 'ctg-addon-card--active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={includeConsultation}
                    onChange={(e) => setIncludeConsultation(e.target.checked)}
                  />
                  <div className="ctg-addon-content">
                    <div className="ctg-addon-header">
                      <span className="ctg-addon-title">
                        Consultation Fee ($20 USD) — Optional
                      </span>
                      <span className="ctg-addon-badge ctg-addon-badge--amber">
                        Optional Add-on
                      </span>
                    </div>
                    <p className="ctg-addon-desc">
                      1-on-1 strategic 45-minute video session with a Gulf licensing consultant to review your CV, qualification equivalency, and PQR gap analysis before starting (≈ {Math.round(CONSULTATION_FEE_USD * auth.exchange)} {auth.currency}).
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Real-time Calculated Summary Card */}
          <div className="ctg-estimator-card">
            <div className="ctg-est-card-header">
              <div>
                <span className="ctg-status-badge">Transparent 2026 Schedule</span>
                <h3 className="ctg-est-title">{auth.name.split('—')[0].trim()} Estimate</h3>
                <span className="ctg-est-role">{role.name}</span>
              </div>
              <div className="ctg-est-total-box">
                <span className="ctg-est-total-usd">
                  ${activeTab === 'original' ? calculation.originalCostUsd : calculation.grandTotalUsd} USD
                </span>
                <span className="ctg-est-total-local">
                  ≈ {activeTab === 'original' ? calculation.originalCostLocal : calculation.grandTotalLocal} {auth.currency}
                </span>
              </div>
            </div>

            {/* View Switcher: All Inclusive vs Original Cost Only */}
            <div className="ctg-est-view-toggle" role="tablist" aria-label="Estimate breakdown view">
              <button
                type="button"
                className={`ctg-est-view-btn ${activeTab === 'all' ? 'ctg-est-view-btn--active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Complete Journey (${calculation.grandTotalUsd} USD)
              </button>
              <button
                type="button"
                className={`ctg-est-view-btn ${activeTab === 'original' ? 'ctg-est-view-btn--active' : ''}`}
                onClick={() => setActiveTab('original')}
              >
                Original Cost Only (${calculation.originalCostUsd} USD)
              </button>
            </div>

            {/* Phase 1: Original Pre-Licensing & Exam Costs */}
            <div className="ctg-est-phase-section">
              <div className="ctg-est-phase-header">
                <span className="ctg-est-phase-title">1. Original Government &amp; Exam Costs</span>
                <span className="ctg-est-pill-badge">Base Mandatory</span>
              </div>

              <div className="ctg-est-line">
                <span>
                  DataFlow Primary Source Verification (PSV):
                  <span className="ctg-est-line-desc">
                    {docCount === 'extended' ? '5 credentials scope' : '3 credentials standard'}
                    {isFastTrack ? ' · TrueFast™ Express' : ''}
                  </span>
                </span>
                <strong>${calculation.psvUsd} USD</strong>
              </div>

              <div className="ctg-est-line">
                <span>
                  Health Authority File Opening / Registration:
                  <span className="ctg-est-line-desc">Official regulatory account creation</span>
                </span>
                <strong>${calculation.authRegUsd} USD</strong>
              </div>

              <div className="ctg-est-line">
                <span>
                  Prometric / Pearson CBT Examination Fee:
                  <span className="ctg-est-line-desc">{auth.examBody}</span>
                </span>
                <strong>${calculation.examUsd} USD</strong>
              </div>

              <div className="ctg-est-phase-subtotal">
                <span>Original Pre-Exam Subtotal:</span>
                <strong>
                  ${calculation.originalCostUsd} USD (≈ {calculation.originalCostLocal} {auth.currency})
                </strong>
              </div>
            </div>

            {/* Phase 2: Separate Health Authority License Fee */}
            <div className="ctg-est-phase-section">
              <div className="ctg-est-phase-header">
                <span className="ctg-est-phase-title">2. Health Authority License Fee</span>
                <span className="ctg-est-pill-badge ctg-est-pill-badge--accent">
                  Separate Post-Exam Fee
                </span>
              </div>

              <div className="ctg-est-line">
                <span>
                  Official Authority License Issuance:
                  <span className="ctg-est-line-desc">
                    {auth.licenseNotes} (payable after passing CBT)
                  </span>
                </span>
                <strong>
                  {includeLicenseFee ? (
                    `$${calculation.authorityLicenseFeeUsd} USD`
                  ) : (
                    <span style={{ color: 'var(--ctg-text-light)', fontWeight: 500 }}>
                      Excluded ($0)
                    </span>
                  )}
                </strong>
              </div>

              <div className="ctg-est-phase-subtotal">
                <span>Authority License Subtotal:</span>
                <strong>
                  ${includeLicenseFee ? calculation.authorityLicenseFeeUsd : 0} USD (≈{' '}
                  {includeLicenseFee ? calculation.authorityLicenseFeeLocal : 0} {auth.currency})
                </strong>
              </div>
            </div>

            {/* Phase 3: Separate Professional Services & Consultation */}
            <div className="ctg-est-phase-section">
              <div className="ctg-est-phase-header">
                <span className="ctg-est-phase-title">3. Professional Services &amp; Consultation</span>
                <span className="ctg-est-pill-badge ctg-est-pill-badge--purple">
                  Separate Service Add-ons
                </span>
              </div>

              <div className="ctg-est-line">
                <span>
                  License Processing Service Fee:
                  <span className="ctg-est-line-desc">
                    End-to-end concierge application management
                  </span>
                </span>
                <strong>
                  {includeProcessingService ? (
                    `$${LICENSE_PROCESSING_FEE_USD} USD`
                  ) : (
                    <span style={{ color: 'var(--ctg-text-light)', fontWeight: 500 }}>
                      Excluded ($0)
                    </span>
                  )}
                </strong>
              </div>

              <div className="ctg-est-line">
                <span>
                  Consultation Fee (Optional):
                  <span className="ctg-est-line-desc">
                    1-on-1 45-min credential audit with licensing expert
                  </span>
                </span>
                <strong>
                  {includeConsultation ? (
                    `$${CONSULTATION_FEE_USD} USD`
                  ) : (
                    <span style={{ color: 'var(--ctg-text-light)', fontWeight: 500 }}>
                      Optional (+$20 USD)
                    </span>
                  )}
                </strong>
              </div>

              <div className="ctg-est-phase-subtotal">
                <span>Professional Services Subtotal:</span>
                <strong>
                  ${calculation.servicesTotalUsd} USD (≈ {calculation.servicesTotalLocal} {auth.currency})
                </strong>
              </div>
            </div>

            {/* Transparent Summary Comparison Box */}
            <div className="ctg-est-comparison-summary">
              <div className="ctg-est-summary-row">
                <span>Original Exam &amp; Verification Cost:</span>
                <strong>${calculation.originalCostUsd} USD</strong>
              </div>
              <div className="ctg-est-summary-row">
                <span>+ Health Authority License Fee:</span>
                <strong>${includeLicenseFee ? calculation.authorityLicenseFeeUsd : 0} USD</strong>
              </div>
              <div className="ctg-est-summary-row">
                <span>+ License Processing Service Fee:</span>
                <strong>${calculation.processingFeeUsd} USD</strong>
              </div>
              <div className="ctg-est-summary-row">
                <span>+ Consultation Fee (Optional):</span>
                <strong>${calculation.consultationFeeUsd} USD</strong>
              </div>
              <div className="ctg-est-summary-row ctg-est-summary-row--highlight">
                <span>Complete Total Investment:</span>
                <span className="ctg-est-summary-price">
                  ${calculation.grandTotalUsd} USD{' '}
                  <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--ctg-text-light)' }}>
                    (≈ {calculation.grandTotalLocal} {auth.currency})
                  </span>
                </span>
              </div>
            </div>

            <div className="ctg-est-metrics">
              <div className="ctg-est-metric-tile">
                <span className="ctg-est-metric-icon">⏱️</span>
                <div>
                  <span className="ctg-est-m-title">Estimated Turnaround</span>
                  <strong className="ctg-est-m-val">{calculation.turnaround}</strong>
                </div>
              </div>

              <div className="ctg-est-metric-tile">
                <span className="ctg-est-metric-icon">🎯</span>
                <div>
                  <span className="ctg-est-m-title">Exam Delivery &amp; Passing</span>
                  <strong className="ctg-est-m-val">{auth.examBody}</strong>
                </div>
              </div>
            </div>

            <div className="ctg-est-note">
              <span>💡</span>
              <p>
                <strong>Zero-Rejection Tip:</strong> Authorities require a minimum of {role.expYears} continuous years of clinical experience after internship. Check your credentials free or add the <strong>$20 optional consultation</strong> to review your documents before paying authority fees.
              </p>
            </div>

            <div className="ctg-est-actions">
              <Link to="/eligibility-check" className="ctg-btn ctg-btn--primary" style={{ flex: 1 }}>
                Check My Exact Eligibility Free ➔
              </Link>
              <Link to="/exams-portal" className="ctg-btn ctg-btn--blue" style={{ flex: 1 }}>
                Explore {auth.name.split('—')[0].trim()} Mocks
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
