import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const STAGES = [
  {
    step: '01',
    badge: 'Pre-Flight',
    title: 'Pre-Screening & PQR Gap Analysis',
    tagline: 'Avoid costly application rejections before paying non-refundable fees.',
    icon: '🔍',
    duration: '24–48 Hours',
    checklist: [
      'Evaluate MBBS/BSc/BPharm degree against GCC Unified Healthcare Qualification Requirements (PQR)',
      'Confirm internship completion meets 12-month continuous clinical hospital requirements',
      'Verify 2+ continuous years of post-registration clinical practice',
      'Audit Good Standing Certificate (CGS) validity with your national medical council'
    ],
    pitfall: 'Applying with a clinical gap > 24 months without compensatory clinical attachment or CME credits leads to automatic authority rejection.',
    ctaText: 'Run Automated Pre-Check',
    ctaLink: '/eligibility-check'
  },
  {
    step: '02',
    badge: 'Verification',
    title: 'DataFlow Primary Source Verification (PSV)',
    tagline: 'Direct institutional credential authentication directly from your universities and employers.',
    icon: '🌐',
    duration: '15–25 Business Days',
    checklist: [
      'Official DataFlow Group case setup under the target regulatory authority',
      'Standardized document packaging (degrees, transcripts, registration, work letters)',
      'Direct institutional outreach to your issuing university and medical council registrar',
      'Proactive monitoring to resolve any institutional delay or discrepancy notices'
    ],
    pitfall: 'Submitting unsealed transcripts or clinic experience letters missing HR stamp & registration number causes severe PSV holds.',
    ctaText: 'Learn About DataFlow Assistance',
    ctaLink: '/login'
  },
  {
    step: '03',
    badge: 'Exam Mastery',
    title: 'Prometric & Pearson VUE Exam Simulation',
    tagline: 'Master the computer-delivered exam format with high-yield recall drills on ClickToGulf Exams.',
    icon: '💻',
    duration: '3–6 Weeks Preparation',
    checklist: [
      'Simulate full-length 150-question timed exams replicating real testing software',
      'Focus on high-frequency clinical scenarios and latest recall trends (2025–2026)',
      'Analyze comprehensive rationale breakdowns for all diagnostic answer choices',
      'Track target readiness benchmark until reaching 80%+ consistency'
    ],
    pitfall: 'Relying on outdated static PDF recall dumps instead of timed, computer-delivered adaptive exam practice with verified explanations.',
    ctaText: 'Launch ClickToGulf Exams Simulator',
    ctaLink: '/exams-portal'
  },
  {
    step: '04',
    badge: 'Credentialing',
    title: 'Health Authority Registration & Eligibility Letter',
    tagline: 'Secure your official Eligibility Letter from DHA, SCFHS, DOH, or OMSB.',
    icon: '📜',
    duration: '5–10 Business Days',
    checklist: [
      'File regulatory portal dossier (DHA Sheryan / SCFHS Mumaris+ / DOH TAMM)',
      'Link verified DataFlow positive report directly to authority case file',
      'Receive official Eligibility Letter / Professional Registration Certificate',
      'Unified UAE PQR activation: eligibility allows seamless transfer between Dubai & Abu Dhabi'
    ],
    pitfall: 'Letting your Eligibility Letter expire (most are valid for 1 year before requiring hospital activation or revalidation).',
    ctaText: 'Check Unified PQR Requirements',
    ctaLink: '/features'
  },
  {
    step: '05',
    badge: 'Career Placement',
    title: 'GCC Healthcare Employment & Final Practice License',
    tagline: 'Connect with premier hospitals, medical centers, and secure your residency visa.',
    icon: '🏥',
    duration: 'Ongoing Placement',
    checklist: [
      'Present your GCC Eligibility Letter to accredited hospital and clinic HR directors',
      'Facility converts Eligibility Letter into an Active Practice License',
      'Sponsorship, healthcare professional residency visa, and mal-practice insurance setup',
      'Begin your rewarding clinical career in Dubai, Abu Dhabi, Riyadh, Doha, or Muscat'
    ],
    pitfall: 'Beginning job hunting without an Eligibility Letter—premier Gulf facilities strongly prioritize candidates with ready-to-activate credentials.',
    ctaText: 'Explore GCC Opportunities',
    ctaLink: '/register'
  }
];

export default function StickyStageJourney() {
  const [activeStep, setActiveStep] = useState(0);

  const current = STAGES[activeStep];

  return (
    <section className="ctg-section ctg-journey-section" id="ctg-journey" aria-labelledby="ctg-journey-heading">
      <div className="ctg-section-inner">
        <div className="ctg-section-header">
          <span className="ctg-section-eyebrow">End-to-End Career Architecture</span>
          <h2 className="ctg-section-title" id="ctg-journey-heading">
            The 5-Stage Gulf Medical Career Pathway
          </h2>
          <p className="ctg-section-desc">
            Explore the exact progression thousands of international doctors, nurses, and pharmacists follow from credential verification to your first hospital shift in the Gulf.
          </p>
        </div>

        {/* Interactive Sticky Step Progress Track */}
        <div className="ctg-journey-stepper-nav" role="tablist">
          {STAGES.map((s, idx) => (
            <button
              key={s.step}
              type="button"
              role="tab"
              aria-selected={activeStep === idx}
              className={`ctg-stepper-btn ${activeStep === idx ? 'ctg-stepper-btn--active' : ''}`}
              onClick={() => setActiveStep(idx)}
            >
              <div className="ctg-stepper-num">{s.step}</div>
              <div className="ctg-stepper-meta">
                <span className="ctg-stepper-tag">{s.badge}</span>
                <span className="ctg-stepper-name">{s.title.split('&')[0].trim()}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Active Stage Display Panel */}
        <div className="ctg-journey-card">
          <div className="ctg-jcard-header">
            <div className="ctg-jcard-left">
              <span className="ctg-jcard-badge">STAGE {current.step} OF 05 • {current.badge}</span>
              <h3 className="ctg-jcard-title">
                {current.icon} {current.title}
              </h3>
              <p className="ctg-jcard-tagline">{current.tagline}</p>
            </div>
            <div className="ctg-jcard-timing">
              <span className="ctg-timing-icon">⏳</span>
              <div>
                <span className="ctg-timing-lbl">Typical Timeline</span>
                <strong className="ctg-timing-val">{current.duration}</strong>
              </div>
            </div>
          </div>

          <div className="ctg-jcard-body">
            <div className="ctg-jcard-col">
              <h4 className="ctg-col-heading">Key Execution Milestones:</h4>
              <ul className="ctg-checklist">
                {current.checklist.map((item, i) => (
                  <li key={i} className="ctg-checklist-item">
                    <span className="ctg-chk-icon">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ctg-jcard-col ctg-jcard-col--pitfall">
              <div className="ctg-pitfall-box">
                <div className="ctg-pitfall-header">
                  <span className="ctg-pitfall-icon">⚠️</span>
                  <strong>Crucial Pitfall to Avoid</strong>
                </div>
                <p className="ctg-pitfall-text">{current.pitfall}</p>
              </div>

              <div className="ctg-jcard-cta-box">
                <span style={{ fontSize: '0.85rem', color: 'var(--ctg-text-muted)' }}>
                  Ready to conquer Stage {current.step}?
                </span>
                <Link to={current.ctaLink} className="ctg-btn ctg-btn--primary" style={{ width: '100%' }}>
                  {current.ctaText} ➔
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
