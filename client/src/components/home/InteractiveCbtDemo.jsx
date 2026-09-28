import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DEMO_QUESTIONS = {
  medicine: [
    {
      id: 'med-1',
      authority: 'DHA Dubai / SMLE Saudi (General Medicine)',
      timeAllotted: '02:44:18',
      qNumber: 'Q. 42 / 150',
      stem: 'A 54-year-old male with a 10-year history of poorly controlled type 2 diabetes mellitus presents to the clinic with persistent burning pain and paresthesia in both feet, worse at night. On examination, there is decreased vibratory sense and loss of ankle jerk reflexes bilaterally. Peripheral pulses are palpable. What is the most appropriate first-line pharmacotherapy for symptomatic relief of this patient’s neuropathic condition according to international and GCC clinical guidelines?',
      options: [
        { id: 'A', text: 'Oral Ibuprofen 400 mg three times daily' },
        { id: 'B', text: 'Oral Pregabalin 75 mg or Duloxetine 60 mg daily' },
        { id: 'C', text: 'Intramuscular Methylcobalamin 1000 mcg weekly' },
        { id: 'D', text: 'Oral Metformin increased to maximum tolerable dose' }
      ],
      correctId: 'B',
      rationale: 'First-line pharmacotherapy for painful diabetic peripheral neuropathy (DPN) includes calcium channel alpha-2-delta ligands (Pregabalin or Gabapentin) or Serotonin-Norepinephrine Reuptake Inhibitors (SNRIs, such as Duloxetine). NSAIDs (Option A) are ineffective for neuropathic pain and pose nephrotoxicity risks in diabetics. Vitamin B12 (Option C) does not reverse established diabetic neuropathy unless verified deficiency exists.',
      citation: 'ADA Standards of Medical Care & GCC Unified Clinical Practice Guidelines'
    },
    {
      id: 'med-2',
      authority: 'SCFHS SMLE / OMSB (Internal Medicine)',
      timeAllotted: '01:58:30',
      qNumber: 'Q. 18 / 150',
      stem: 'A 62-year-old female presents with sudden onset shortness of breath and pleuritic chest pain 5 days after undergoing elective total knee arthroplasty. Her vitals: BP 100/65 mmHg, HR 118 bpm, RR 26/min, SpO2 91% on room air. D-dimer is markedly elevated. An ECG reveals sinus tachycardia with S1Q3T3 pattern. Which of the following is the definitive first-line diagnostic imaging modality of choice?',
      options: [
        { id: 'A', text: 'Standard 2-view Upright Chest X-Ray' },
        { id: 'B', text: 'Transthoracic Echocardiogram (TTE)' },
        { id: 'C', text: 'Computed Tomography Pulmonary Angiography (CTPA)' },
        { id: 'D', text: 'Ventilation-Perfusion (V/Q) Lung Scan' }
      ],
      correctId: 'C',
      rationale: 'CT Pulmonary Angiography (CTPA) is the gold standard and initial diagnostic test of choice for hemodynamically stable patients with suspected acute pulmonary embolism. Chest radiography is typically normal or shows non-specific findings (e.g. atelectasis, Hampton hump). V/Q scanning is reserved primarily for patients with severe renal failure or anaphylactic contrast allergies.',
      citation: 'ESC Guidelines on Acute Pulmonary Embolism & Prometric High-Yield Medical Bank'
    }
  ],
  nursing: [
    {
      id: 'nur-1',
      authority: 'SNLE Saudi / DHA Prometric (Registered Nurse)',
      timeAllotted: '02:15:00',
      qNumber: 'Q. 27 / 150',
      stem: 'A registered nurse is caring for an adult client receiving intravenous unfractionated heparin infusion for deep vein thrombosis. The laboratory reports an activated partial thromboplastin time (aPTT) of 135 seconds (control baseline: 30 seconds; target therapeutic range: 60–80 seconds). The client complains of sudden gum bleeding when brushing teeth. Which immediate nursing intervention is the highest priority?',
      options: [
        { id: 'A', text: 'Administer oral Vitamin K as ordered' },
        { id: 'B', text: 'Stop the heparin infusion immediately and notify the physician' },
        { id: 'C', text: 'Reduce the infusion rate by 50% and recheck aPTT in 4 hours' },
        { id: 'D', text: 'Apply cold pressure packs to the gums and document the finding' }
      ],
      correctId: 'B',
      rationale: 'An aPTT of 135 seconds represents critical coagulopathy well above the therapeutic target (1.5–2.5 times normal). With active bleeding signs, the immediate and highest priority nursing action is to stop the heparin infusion immediately to prevent catastrophic hemorrhage, notify the provider, and prepare Protamine Sulfate if ordered. Vitamin K reverses Warfarin, not Heparin.',
      citation: 'Prometric Clinical Nursing Safety Standards & SNLE Blueprint'
    }
  ],
  pharmacy: [
    {
      id: 'ph-1',
      authority: 'SPLE Saudi / MOHAP UAE (Clinical Pharmacist)',
      timeAllotted: '02:40:00',
      qNumber: 'Q. 55 / 150',
      stem: 'A 58-year-old male with chronic atrial fibrillation maintained on Warfarin 5 mg daily is diagnosed with a severe skin and soft tissue infection. The physician intends to prescribe an oral antimicrobial. Which of the following antibiotics is known to produce the most potent CYP2C9 inhibition, dramatically increasing the INR and severe hemorrhage risk?',
      options: [
        { id: 'A', text: 'Cephalexin' },
        { id: 'B', text: 'Co-trimoxazole (Trimethoprim/Sulfamethoxazole)' },
        { id: 'C', text: 'Amoxicillin' },
        { id: 'D', text: 'Azithromycin' }
      ],
      correctId: 'B',
      rationale: 'Trimethoprim/Sulfamethoxazole (Bactrim) is a potent inhibitor of CYP2C9, the primary metabolic pathway for the more active S-enantiomer of Warfarin. Co-administration causes an abrupt rise in INR and high risk of life-threatening bleeding. Safe alternatives or empirical Warfarin dose reductions of 30–50% with frequent INR monitoring are required.',
      citation: 'GCC Pharmacy Licensing Standards & SPLE Clinical Pharmacology Core'
    }
  ],
  dentistry: [
    {
      id: 'dent-1',
      authority: 'SDLE Saudi / DHA Prometric (Dental Examination)',
      timeAllotted: '02:30:00',
      qNumber: 'Q. 33 / 150',
      stem: 'A 24-year-old male presents to the dental emergency clinic 40 minutes after an avulsion of tooth #21 (maxillary central incisor) following a football injury. The tooth was stored in chilled fresh whole milk immediately at the field. Examination reveals an intact alveolar socket. What is the recommended management protocol?',
      options: [
        { id: 'A', text: 'Perform immediate surgical crown resection' },
        { id: 'B', text: 'Gently rinse root with saline, replant immediately, and apply flexible splint for 7–14 days' },
        { id: 'C', text: 'Curette the alveolar socket aggressively to remove all coagulum before replanting' },
        { id: 'D', text: 'Scrape the root surface with a scaler to remove periodontal ligament cells' }
      ],
      correctId: 'B',
      rationale: 'For an avulsed permanent tooth with extra-oral dry time < 60 minutes stored in milk (physiologic osmolar medium), gentle saline rinse without touching or scraping root cementum followed by immediate replantation and flexible splinting for 1–2 weeks is the international IADT gold standard protocol to preserve periodontal ligament fibroblasts.',
      citation: 'International Association of Dental Traumatology (IADT) & SDLE Blueprint'
    }
  ]
};

export default function InteractiveCbtDemo() {
  const [activeTab, setActiveTab] = useState('medicine');
  const [qIndex, setQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isMarked, setIsMarked] = useState(false);

  const questions = DEMO_QUESTIONS[activeTab] || DEMO_QUESTIONS.medicine;
  const currentQ = questions[qIndex] || questions[0];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setQIndex(0);
    setSelectedAnswer(null);
    setSubmitted(false);
    setIsMarked(false);
  };

  const handleNextQuestion = () => {
    const nextIdx = (qIndex + 1) % questions.length;
    setQIndex(nextIdx);
    setSelectedAnswer(null);
    setSubmitted(false);
    setIsMarked(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedAnswer) return;
    setSubmitted(true);
  };

  return (
    <section className="ctg-section ctg-cbt-demo-section" id="ctg-cbt-demo" aria-labelledby="ctg-cbt-heading">
      <div className="ctg-section-inner">
        <div className="ctg-section-header">
          <span className="ctg-section-eyebrow">Real Prometric Simulator Demo</span>
          <h2 className="ctg-section-title" id="ctg-cbt-heading">
            Experience the Authentic Prometric CBT Engine
          </h2>
          <p className="ctg-section-desc">
            Test your clinical knowledge right here on the homepage. Our ClickToGulf Exams platform replicates the exact interface, countdown clock, mark-for-review tools, and clinical rationale breakdown used in official testing centers.
          </p>
        </div>

        {/* Category Selector Tabs */}
        <div className="ctg-cbt-discipline-tabs" role="tablist">
          <button
            type="button"
            className={`ctg-cbt-tab ${activeTab === 'medicine' ? 'ctg-cbt-tab--active' : ''}`}
            onClick={() => handleTabChange('medicine')}
          >
            🩺 General Medicine (GP / SMLE)
          </button>
          <button
            type="button"
            className={`ctg-cbt-tab ${activeTab === 'nursing' ? 'ctg-cbt-tab--active' : ''}`}
            onClick={() => handleTabChange('nursing')}
          >
            💉 Nursing (SNLE / DHA RN)
          </button>
          <button
            type="button"
            className={`ctg-cbt-tab ${activeTab === 'pharmacy' ? 'ctg-cbt-tab--active' : ''}`}
            onClick={() => handleTabChange('pharmacy')}
          >
            💊 Pharmacy (SPLE / MOHAP)
          </button>
          <button
            type="button"
            className={`ctg-cbt-tab ${activeTab === 'dentistry' ? 'ctg-cbt-tab--active' : ''}`}
            onClick={() => handleTabChange('dentistry')}
          >
            🦷 Dentistry (SDLE / DHA)
          </button>
        </div>

        {/* Prometric CBT Simulator Window */}
        <div className="ctg-prometric-window">
          {/* Prometric Top Utility Bar */}
          <div className="ctg-pbar-top">
            <div className="ctg-pbar-left">
              <span className="ctg-prometric-brand">CLICKTOGULF EXAMS CBT ENGINE</span>
              <span className="ctg-prometric-auth-badge">{currentQ.authority}</span>
            </div>
            <div className="ctg-pbar-right">
              <div className="ctg-pbar-timer">
                <span className="ctg-timer-icon">⏱️</span>
                <span>Time Remaining: <strong>{currentQ.timeAllotted}</strong></span>
              </div>
              <button
                type="button"
                className={`ctg-pbar-mark-btn ${isMarked ? 'ctg-pbar-mark-btn--active' : ''}`}
                onClick={() => setIsMarked(!isMarked)}
              >
                <span>{isMarked ? '🚩 Marked' : '⚐ Mark for Review'}</span>
              </button>
            </div>
          </div>

          {/* Question Body */}
          <div className="ctg-pbody">
            <div className="ctg-qnum-strip">
              <span className="ctg-qnum">{currentQ.qNumber}</span>
              <span className="ctg-qtag">Single Best Answer (MCQ)</span>
            </div>

            <div className="ctg-qstem">
              {currentQ.stem}
            </div>

            <form onSubmit={handleSubmit} className="ctg-options-list">
              {currentQ.options.map((opt) => {
                const isSelected = selectedAnswer === opt.id;
                const isCorrect = opt.id === currentQ.correctId;
                let optionClass = 'ctg-opt-label';

                if (submitted) {
                  if (isCorrect) optionClass += ' ctg-opt-label--correct';
                  else if (isSelected && !isCorrect) optionClass += ' ctg-opt-label--wrong';
                } else if (isSelected) {
                  optionClass += ' ctg-opt-label--selected';
                }

                return (
                  <label key={opt.id} className={optionClass}>
                    <input
                      type="radio"
                      name="prometricAnswer"
                      value={opt.id}
                      disabled={submitted}
                      checked={isSelected}
                      onChange={() => setSelectedAnswer(opt.id)}
                    />
                    <span className="ctg-opt-marker">{opt.id}</span>
                    <span className="ctg-opt-text">{opt.text}</span>
                    {submitted && isCorrect && <span className="ctg-ans-badge ctg-ans-badge--correct">✓ Correct</span>}
                    {submitted && isSelected && !isCorrect && <span className="ctg-ans-badge ctg-ans-badge--wrong">✗ Incorrect</span>}
                  </label>
                );
              })}

              {/* Action Buttons */}
              <div className="ctg-cbt-footer-bar">
                {!submitted ? (
                  <button
                    type="submit"
                    className="ctg-btn ctg-btn--primary"
                    disabled={!selectedAnswer}
                  >
                    Submit &amp; View Clinical Rationale ➔
                  </button>
                ) : (
                  <div className="ctg-cbt-submitted-nav">
                    <button
                      type="button"
                      className="ctg-btn ctg-btn--ghost"
                      onClick={handleNextQuestion}
                    >
                      Try Next Question ↻
                    </button>
                    <Link to="/exams-portal" className="ctg-btn ctg-btn--blue">
                      Access Full 15,000+ Question Bank ➔
                    </Link>
                  </div>
                )}
              </div>
            </form>

            {/* Explanation & Rationale Box (Revealed on Submit) */}
            {submitted && (
              <div className="ctg-rationale-box animate-fade-in">
                <div className="ctg-rat-header">
                  <span className="ctg-rat-icon">🩺</span>
                  <div>
                    <h4 className="ctg-rat-title">High-Yield Clinical Rationale &amp; Key Learning Point</h4>
                    <span className="ctg-rat-citation">Source: {currentQ.citation}</span>
                  </div>
                </div>
                <p className="ctg-rat-text">{currentQ.rationale}</p>
                <div className="ctg-rat-callout">
                  <span>💡</span>
                  <div>
                    <strong>Exam Strategy Tip:</strong> Over 70% of Prometric questions test first-line interventions and contraindications. ClickToGulf Exams includes in-depth diagnostic pearls for every single answer choice.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
