import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const EXAM_ITEMS = [
  {
    id: 'dha-gp',
    category: 'medicine',
    authority: 'DHA Dubai Prometric',
    role: 'General Practitioner & Specialist Doctor',
    questions: '2,400+ MCQs',
    passRate: '92%',
    features: 'Prometric CBT layout, timed simulation, detailed rationales',
    badge: 'High Passing Rate',
    difficulty: 'Intermediate'
  },
  {
    id: 'scfhs-smle',
    category: 'medicine',
    authority: 'SCFHS SMLE (Saudi Licensing)',
    role: 'General Medicine & Medical Specialties',
    questions: '3,800+ Questions',
    passRate: '89%',
    features: 'Mumaris+ blueprint aligned, recall question trends, chapter drills',
    badge: 'Most Popular',
    difficulty: 'Advanced'
  },
  {
    id: 'scfhs-snle',
    category: 'nursing',
    authority: 'SCFHS SNLE (Saudi Nursing)',
    role: 'Registered Nurses & Midwives',
    questions: '2,800+ Questions',
    passRate: '94%',
    features: 'Clinical judgment cases, dosage calculation, patient safety',
    badge: 'Popular',
    difficulty: 'Intermediate'
  },
  {
    id: 'dha-rn',
    category: 'nursing',
    authority: 'DHA Dubai Registered Nurse',
    role: 'Staff Nurse & Critical Care',
    questions: '2,200+ Questions',
    passRate: '93%',
    features: 'Prometric nursing format, clinical triage scenarios, infection control',
    badge: 'Updated 2026',
    difficulty: 'Intermediate'
  },
  {
    id: 'doh-haad',
    category: 'medicine',
    authority: 'DOH Abu Dhabi (HAAD)',
    role: 'Physicians, Dentists & Nurses',
    questions: '2,100+ Questions',
    passRate: '90%',
    features: 'Pearson VUE computer layout, clinical case studies, weak-point tracker',
    badge: 'Pearson VUE',
    difficulty: 'Advanced'
  },
  {
    id: 'mohap-pharm',
    category: 'pharmacy',
    authority: 'MOHAP UAE Licensing',
    role: 'Clinical & Community Pharmacists',
    questions: '1,900+ Questions',
    passRate: '91%',
    features: 'Clinical pharmacology, contraindications, pharmacy calculation drills',
    badge: 'Complete Bank',
    difficulty: 'Intermediate'
  },
  {
    id: 'scfhs-sple',
    category: 'pharmacy',
    authority: 'SCFHS SPLE (Saudi Pharmacy)',
    role: 'Pharmacists & Clinical Specialists',
    questions: '2,500+ Questions',
    passRate: '88%',
    features: 'Therapeutics, pharmacokinetics, medication therapy management',
    badge: 'Updated 2026',
    difficulty: 'Advanced'
  },
  {
    id: 'scfhs-sdle',
    category: 'dentistry',
    authority: 'SCFHS SDLE (Saudi Dental)',
    role: 'General & Specialist Dentists',
    questions: '2,300+ Questions',
    passRate: '91%',
    features: 'Endodontics, periodontics, pediatric dentistry, radiograph questions',
    badge: 'High Yield',
    difficulty: 'Intermediate'
  },
  {
    id: 'omsb-gp',
    category: 'medicine',
    authority: 'OMSB Oman Prometric',
    role: 'General Practitioners & Residents',
    questions: '1,650+ Questions',
    passRate: '89%',
    features: 'OMSB curriculum questions, pacing target exercises, full mock runs',
    badge: 'Specialist Focus',
    difficulty: 'Advanced'
  },
  {
    id: 'qchp-all',
    category: 'allied',
    authority: 'QCHP Qatar Prometric',
    role: 'Physiotherapists & Lab Technologists',
    questions: '1,800+ Questions',
    passRate: '93%',
    features: 'Qatar MOPH standard questions, instant rationale breakdown',
    badge: 'Comprehensive',
    difficulty: 'Intermediate'
  }
];

export default function ExamCatalogSearch() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filtered = EXAM_ITEMS.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const qLower = query.toLowerCase().trim();
    const matchesQuery =
      !qLower ||
      item.authority.toLowerCase().includes(qLower) ||
      item.role.toLowerCase().includes(qLower) ||
      item.features.toLowerCase().includes(qLower);

    return matchesCat && matchesQuery;
  });

  return (
    <section className="ctg-section" id="ctg-catalog" aria-labelledby="ctg-catalog-title">
      <div className="ctg-section-inner">
        <div className="ctg-section-header">
          <span className="ctg-section-eyebrow">Real-Time Search &amp; Filter</span>
          <h2 className="ctg-section-title" id="ctg-catalog-title">
            Explore 15,000+ Verified Gulf Exam Question Banks
          </h2>
          <p className="ctg-section-desc">
            Search your specific exam by health authority, clinical profession, or test provider to preview available mock tests, pass benchmarks, and question volumes.
          </p>
        </div>

        {/* Live Filter Bar */}
        <div className="ctg-catalog-filter-bar">
          <div className="ctg-catalog-search-wrapper">
            <span className="ctg-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by exam code (e.g. SMLE, SNLE, DHA GP, Pearson, OMSB)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="ctg-catalog-search-input"
              aria-label="Search exam question banks"
            />
            {query && (
              <button
                type="button"
                className="ctg-search-clear"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="ctg-catalog-pills" role="tablist">
            <button
              type="button"
              className={`ctg-cat-filter-pill ${selectedCategory === 'all' ? 'ctg-cat-filter-pill--active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Disciplines ({EXAM_ITEMS.length})
            </button>
            <button
              type="button"
              className={`ctg-cat-filter-pill ${selectedCategory === 'medicine' ? 'ctg-cat-filter-pill--active' : ''}`}
              onClick={() => setSelectedCategory('medicine')}
            >
              🩺 Doctors &amp; GP
            </button>
            <button
              type="button"
              className={`ctg-cat-filter-pill ${selectedCategory === 'nursing' ? 'ctg-cat-filter-pill--active' : ''}`}
              onClick={() => setSelectedCategory('nursing')}
            >
              💉 Nursing (RN/SNLE)
            </button>
            <button
              type="button"
              className={`ctg-cat-filter-pill ${selectedCategory === 'pharmacy' ? 'ctg-cat-filter-pill--active' : ''}`}
              onClick={() => setSelectedCategory('pharmacy')}
            >
              💊 Pharmacy (SPLE)
            </button>
            <button
              type="button"
              className={`ctg-cat-filter-pill ${selectedCategory === 'dentistry' ? 'ctg-cat-filter-pill--active' : ''}`}
              onClick={() => setSelectedCategory('dentistry')}
            >
              🦷 Dental (SDLE)
            </button>
            <button
              type="button"
              className={`ctg-cat-filter-pill ${selectedCategory === 'allied' ? 'ctg-cat-filter-pill--active' : ''}`}
              onClick={() => setSelectedCategory('allied')}
            >
              🔬 Allied Health
            </button>
          </div>
        </div>

        {/* Results Count & Grid */}
        <div className="ctg-catalog-results-status">
          Showing <strong>{filtered.length}</strong> matching exam preparation banks
        </div>

        <div className="ctg-catalog-grid">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <div key={item.id} className="ctg-catalog-card animate-fade-in" id={`ctg-cat-item-${item.id}`}>
                <div>
                  <div className="ctg-catalog-header">
                    <span className="ctg-catalog-tag">{item.badge}</span>
                    <span className="ctg-diff-tag">Pass: {item.passRate}</span>
                  </div>
                  <h3 className="ctg-catalog-title">{item.authority}</h3>
                  <p className="ctg-catalog-meta">Target: {item.role}</p>
                </div>

                <div className="ctg-catalog-stats">
                  <div className="ctg-cat-stat">
                    <strong>{item.questions}</strong>
                    <span>Available Items</span>
                  </div>
                  <div className="ctg-cat-stat">
                    <strong>{item.difficulty}</strong>
                    <span>Complexity</span>
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ctg-text-muted)', marginBottom: '14px', lineHeight: 1.45 }}>
                    {item.features}
                  </p>
                  <Link to="/exams-portal" className="ctg-btn ctg-btn--blue" style={{ width: '100%' }}>
                    Practice This Exam ➔
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="ctg-catalog-empty">
              <span style={{ fontSize: '2rem' }}>🔍</span>
              <p>No exams match your search criteria. Try a different search term or category filter.</p>
              <button
                type="button"
                className="ctg-btn ctg-btn--ghost"
                onClick={() => {
                  setQuery('');
                  setSelectedCategory('all');
                }}
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '36px' }}>
          <Link to="/exams-portal" className="ctg-btn ctg-btn--primary ctg-btn--lg" id="ctg-view-all-mocks">
            Explore All Mock Exams on ClickToGulf Exams Portal
          </Link>
        </div>
      </div>
    </section>
  );
}
