import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function HeroPersonaSwitch() {
  const [activePersona, setActivePersona] = useState('licensing'); // 'licensing' or 'exam'

  return (
    <div className="ctg-persona-switch-wrapper">
      <div className="ctg-persona-tabs" role="tablist" aria-label="Select your primary Gulf journey goal">
        <button
          type="button"
          role="tab"
          aria-selected={activePersona === 'licensing'}
          className={`ctg-persona-tab ${activePersona === 'licensing' ? 'ctg-persona-tab--active' : ''}`}
          onClick={() => setActivePersona('licensing')}
        >
          <span className="ctg-persona-tab-icon">🏛️</span>
          <div>
            <div className="ctg-persona-tab-title">Gulf Licensing & DataFlow (PSV)</div>
            <div className="ctg-persona-tab-sub">Sheryan, Mumaris+, Good Standing, PQR Pre-Check</div>
          </div>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activePersona === 'exam'}
          className={`ctg-persona-tab ${activePersona === 'exam' ? 'ctg-persona-tab--active' : ''}`}
          onClick={() => setActivePersona('exam')}
        >
          <span className="ctg-persona-tab-icon">💻</span>
          <div>
            <div className="ctg-persona-tab-title">Exam Prep & Mock CBT (ClickToGulf Exams)</div>
            <div className="ctg-persona-tab-sub">Prometric, Pearson VUE, 15k+ MCQs, Recall Banks</div>
          </div>
        </button>
      </div>

      <div className="ctg-persona-panel">
        {activePersona === 'licensing' ? (
          <div className="ctg-persona-details animate-fade-in">
            <div className="ctg-persona-stats-grid">
              <div className="ctg-persona-metric">
                <span className="ctg-metric-value">15–20 Days</span>
                <span className="ctg-metric-label">Avg. DataFlow PSV Turnaround</span>
              </div>
              <div className="ctg-persona-metric">
                <span className="ctg-metric-value">100%</span>
                <span className="ctg-metric-label">Discrepancy Resolution Guarantee</span>
              </div>
              <div className="ctg-persona-metric">
                <span className="ctg-metric-value">8 Regulators</span>
                <span className="ctg-metric-label">DHA, SCFHS, DOH, OMSB &amp; more</span>
              </div>
            </div>

            <div className="ctg-persona-callouts">
              <div className="ctg-callout-bullet">
                <span className="ctg-callout-bullet-check">✓</span>
                <span><strong>Zero Document Rejection Risk:</strong> Complete pre-screening against official 2026 Unified Healthcare PQR requirements before submission.</span>
              </div>
              <div className="ctg-callout-bullet">
                <span className="ctg-callout-bullet-check">✓</span>
                <span><strong>Full Authority Management:</strong> We file and monitor your Sheryan (Dubai), TAMM (Abu Dhabi), or Mumaris+ (Saudi Arabia) dossier.</span>
              </div>
            </div>

            <div className="ctg-persona-action-row">
              <Link to="/eligibility-check" className="ctg-btn ctg-btn--primary ctg-btn--lg">
                Run Free Eligibility Check ➔
              </Link>
              <a href="#ctg-estimator" className="ctg-btn ctg-btn--ghost ctg-btn--lg">
                Calculate Fees &amp; Timeline
              </a>
            </div>
          </div>
        ) : (
          <div className="ctg-persona-details animate-fade-in">
            <div className="ctg-persona-stats-grid">
              <div className="ctg-persona-metric">
                <span className="ctg-metric-value">15,000+</span>
                <span className="ctg-metric-label">Verified High-Yield Clinical MCQs</span>
              </div>
              <div className="ctg-persona-metric">
                <span className="ctg-metric-value">99.4%</span>
                <span className="ctg-metric-label">First-Attempt Candidate Pass Rate</span>
              </div>
              <div className="ctg-persona-metric">
                <span className="ctg-metric-value">Exact UI</span>
                <span className="ctg-metric-label">Prometric CBT &amp; Pearson VUE Replica</span>
              </div>
            </div>

            <div className="ctg-persona-callouts">
              <div className="ctg-callout-bullet">
                <span className="ctg-callout-bullet-check">✓</span>
                <span><strong>Real Test-Day Software Feel:</strong> Practice with countdown timers, mark-for-review tags, strike-through, and realistic clinical case stems.</span>
              </div>
              <div className="ctg-callout-bullet">
                <span className="ctg-callout-bullet-check">✓</span>
                <span><strong>Deep Pathophysiological Rationales:</strong> Understand every option with peer-reviewed explanations and clinical citations.</span>
              </div>
            </div>

            <div className="ctg-persona-action-row">
              <Link to="/exams-portal" className="ctg-btn ctg-btn--blue ctg-btn--lg">
                Launch ClickToGulf Exams Engine ➔
              </Link>
              <a href="#ctg-cbt-demo" className="ctg-btn ctg-btn--ghost ctg-btn--lg">
                Try 1 Free Question Now
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
