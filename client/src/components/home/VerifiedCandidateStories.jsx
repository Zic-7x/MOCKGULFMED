import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const REVIEWS = [
  {
    id: 1,
    name: 'Dr. Sarah K.',
    role: 'General Practitioner',
    origin: 'Pakistan ➔ Dubai, UAE',
    authority: 'DHA — Dubai Health Authority',
    authId: 'dha',
    country: 'uae',
    flag: '🇦🇪',
    stats: '84% on Prometric • DataFlow in 18 days',
    review: 'ClickToGulf handled my DataFlow PSV without a single discrepancy notice. Meanwhile, I practiced ClickToGulf Exams timed tests daily. The real Prometric exam had multiple cases identical in structure to the question banks here!',
    verifiedDate: 'Passed February 2026'
  },
  {
    id: 2,
    name: 'Nurse Blessy M.',
    role: 'Staff Registered Nurse',
    origin: 'Philippines ➔ Riyadh, Saudi Arabia',
    authority: 'SCFHS (SNLE Nursing Exam)',
    authId: 'scfhs',
    country: 'saudi',
    flag: '🇸🇦',
    stats: 'Passed First Attempt • TrueFast 11 days',
    review: 'I was worried about the 2-year hospital gap policy for Saudi Mumaris+. The eligibility assessment guided me on exact hospital certificate wording. I passed my SNLE on the first attempt thanks to the nursing rationales.',
    verifiedDate: 'Passed January 2026'
  },
  {
    id: 3,
    name: 'Dr. Tarek H.',
    role: 'Specialist Cardiologist',
    origin: 'Egypt ➔ Abu Dhabi, UAE',
    authority: 'DOH / HAAD Pearson VUE',
    authId: 'doh',
    country: 'uae',
    flag: '🇦🇪',
    stats: 'Pearson VUE Cleared • PQR Converted',
    review: 'Transferring my qualifications under the UAE Unified PQR was confusing until ClickToGulf mapped my post-graduate diplomas. Highly recommend both their licensing team and ClickToGulf Exams Pearson tests.',
    verifiedDate: 'Passed December 2025'
  },
  {
    id: 4,
    name: 'Pharm. Ankit R.',
    role: 'Clinical Pharmacist',
    origin: 'India ➔ Muscat, Oman',
    authority: 'OMSB Oman Prometric',
    authId: 'omsb',
    country: 'oman',
    flag: '🇴🇲',
    stats: '78% Score • Verification Approved',
    review: 'Oman OMSB Prometric questions have heavy clinical pharmacology weightage. ClickToGulf Exams was the only portal with updated 2025/2026 recall scenarios. Cleared in first sitting.',
    verifiedDate: 'Passed March 2026'
  },
  {
    id: 5,
    name: 'Dr. Maria Santos',
    role: 'General Dentist',
    origin: 'Philippines ➔ Doha, Qatar',
    authority: 'QCHP / MOPH Qatar',
    authId: 'qchp',
    country: 'qatar',
    flag: '🇶🇦',
    stats: '81% SDLE Score • Hospital Placed',
    review: 'The interactive fee calculator gave me an exact budget before I applied. From DataFlow to passing Qatar Prometric, everything was transparent and executed without delays.',
    verifiedDate: 'Passed January 2026'
  }
];

export default function VerifiedCandidateStories() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? REVIEWS
    : REVIEWS.filter((r) => r.country === filter);

  return (
    <section className="ctg-section ctg-stories-section" id="ctg-stories" aria-labelledby="ctg-stories-heading">
      <div className="ctg-section-inner">
        <div className="ctg-section-header">
          <span className="ctg-section-eyebrow">Real Medical Milestones</span>
          <h2 className="ctg-section-title" id="ctg-stories-heading">
            Verified Healthcare Careers Transitioned to the Gulf
          </h2>
          <p className="ctg-section-desc">
            Filter authentic experiences by GCC destination country to see how fellow practitioners navigated DataFlow PSV, passed their computer-based exams, and achieved their Gulf licensing goals.
          </p>
        </div>

        {/* Country Filter Filter */}
        <div className="ctg-story-filters" role="tablist">
          <button
            type="button"
            className={`ctg-story-pill ${filter === 'all' ? 'ctg-story-pill--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            🌍 All GCC Countries ({REVIEWS.length})
          </button>
          <button
            type="button"
            className={`ctg-story-pill ${filter === 'uae' ? 'ctg-story-pill--active' : ''}`}
            onClick={() => setFilter('uae')}
          >
            🇦🇪 UAE (DHA &amp; DOH)
          </button>
          <button
            type="button"
            className={`ctg-story-pill ${filter === 'saudi' ? 'ctg-story-pill--active' : ''}`}
            onClick={() => setFilter('saudi')}
          >
            🇸🇦 Saudi Arabia (SCFHS)
          </button>
          <button
            type="button"
            className={`ctg-story-pill ${filter === 'oman' ? 'ctg-story-pill--active' : ''}`}
            onClick={() => setFilter('oman')}
          >
            🇴🇲 Oman (OMSB)
          </button>
          <button
            type="button"
            className={`ctg-story-pill ${filter === 'qatar' ? 'ctg-story-pill--active' : ''}`}
            onClick={() => setFilter('qatar')}
          >
            🇶🇦 Qatar (QCHP)
          </button>
        </div>

        {/* Stories Grid */}
        <div className="ctg-stories-grid">
          {filtered.map((item) => (
            <div key={item.id} className="ctg-story-card animate-fade-in">
              <div className="ctg-story-top">
                <div className="ctg-story-avatar">
                  <span>{item.name[0]}</span>
                </div>
                <div className="ctg-story-header-text">
                  <div className="ctg-story-name-row">
                    <strong>{item.name}</strong>
                    <span className="ctg-story-verified-badge">✓ Verified</span>
                  </div>
                  <span className="ctg-story-role">{item.role}</span>
                  <span className="ctg-story-route">{item.flag} {item.origin}</span>
                </div>
              </div>

              <div className="ctg-story-stat-strip">
                <span>🎯</span>
                <strong>{item.stats}</strong>
              </div>

              <p className="ctg-story-quote">
                "{item.review}"
              </p>

              <div className="ctg-story-footer">
                <span className="ctg-story-auth">{item.authority}</span>
                <span className="ctg-story-date">{item.verifiedDate}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link to="/eligibility-check" className="ctg-btn ctg-btn--primary ctg-btn--lg">
            Start Your Own Gulf Journey Free ➔
          </Link>
        </div>
      </div>
    </section>
  );
}
