import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import FloatingNavIsland from '../components/home/FloatingNavIsland';
import HeroPersonaSwitch from '../components/home/HeroPersonaSwitch';
import LicensingCostEstimator from '../components/home/LicensingCostEstimator';
import StickyStageJourney from '../components/home/StickyStageJourney';
import InteractiveCbtDemo from '../components/home/InteractiveCbtDemo';
import ExamCatalogSearch from '../components/home/ExamCatalogSearch';
import VerifiedCandidateStories from '../components/home/VerifiedCandidateStories';
import MobileThumbDock from '../components/home/MobileThumbDock';
import '../components/home/ScrollExperience2026.css';
import './ClickToGulf.css';

const GULF_AUTHORITIES = [
  { id: 'dha', name: 'DHA — Dubai Health Authority', country: 'United Arab Emirates', flag: '🇦🇪', exam: 'Prometric CBT', psv: 'DataFlow' },
  { id: 'doh', name: 'DOH / HAAD — Department of Health', country: 'Abu Dhabi, UAE', flag: '🇦🇪', exam: 'Pearson VUE', psv: 'DataFlow' },
  { id: 'mohap', name: 'MOHAP — Ministry of Health & Prevention', country: 'UAE (Sharjah & Northern)', flag: '🇦🇪', exam: 'Prometric CBT', psv: 'DataFlow' },
  { id: 'scfhs', name: 'SCFHS — Saudi Commission for Health Specialties', country: 'Saudi Arabia (Mumaris+)', flag: '🇸🇦', exam: 'Prometric CBT (SMLE/SDLE/SNLE)', psv: 'DataFlow' },
  { id: 'moph', name: 'MOPH / QCHP — Qatar Council for Healthcare Practitioners', country: 'Qatar', flag: '🇶🇦', exam: 'Prometric CBT', psv: 'DataFlow' },
  { id: 'omsb', name: 'OMSB — Oman Medical Specialty Board', country: 'Oman', flag: '🇴🇲', exam: 'Prometric CBT', psv: 'DataFlow' },
  { id: 'nhra', name: 'NHRA — National Health Regulatory Authority', country: 'Bahrain', flag: '🇧🇭', exam: 'Prometric CBT', psv: 'DataFlow' },
  { id: 'moh_kw', name: 'MOH Kuwait — Ministry of Health', country: 'Kuwait', flag: '🇰🇼', exam: 'Ministry CBT & Committee Interview', psv: 'DataFlow / Ministry Verification' },
];

const PROFESSIONS = [
  // Doctors & Medical Specialists
  {
    id: 'medicine',
    title: 'General Practitioner (GP / Family Medicine)',
    category: 'Doctors & Specialists',
    icon: '🩺',
    expReq: 'Minimum 2 years post-internship clinical hospital or clinic experience',
    examTitle: 'Prometric / Pearson VUE Medical Exam',
    mcqs: '1,500 Basic + 2,000 Advance MCQs',
    basicMcqs: '1,500 Basic MCQs',
    advanceMcqs: '2,000 Advance MCQs',
    totalMcqs: '3,500 MCQs',
    duration: '3.5 Hours',
    passScore: '60% – 65%',
    docs: [
      'MBBS / MD Degree Certificate',
      'Internship Completion Certificate (12 Months)',
      'Valid Home Country License / Registration',
      'Certificate of Good Standing (CGS)',
      'Clinical Experience Certificates (Minimum 2 continuous years)',
      'Academic Transcripts & Valid Passport Copy'
    ]
  },
  {
    id: 'specialist',
    title: 'Specialist & Consultant Physician (All Clinical Specialties)',
    category: 'Doctors & Specialists',
    icon: '👨‍⚕️',
    expReq: 'Minimum 3+ years post-specialization / Master’s / MD / Fellowship experience',
    examTitle: 'Prometric Specialist Exam / Peer Oral Review',
    mcqs: '1,500 Basic + 2,000 Advance MCQs',
    basicMcqs: '1,500 Basic MCQs',
    advanceMcqs: '2,000 Advance MCQs',
    totalMcqs: '3,500 MCQs',
    duration: '3.5 Hours',
    passScore: '65%',
    docs: [
      'MBBS / MD Primary Degree Certificate',
      'Specialist Degree / Master’s (MD, MS, FCPS, MRCP, Arab Board)',
      'Specialist Registration from Medical Council',
      'Experience Certificates (Minimum 3 years in specialty)',
      'Certificate of Good Standing (CGS) within 6 months',
      'Clinical Logbook / Case Portfolio (where required)'
    ]
  },

  // Nursing & Midwifery
  {
    id: 'nursing',
    title: 'Registered Nurse (RN) & Midwife',
    category: 'Nursing & Midwifery',
    icon: '💉',
    expReq: 'Minimum 2 years uninterrupted clinical hospital inpatient or outpatient experience',
    examTitle: 'Prometric Nursing Examination (RN / SNLE / HAAD)',
    mcqs: '1,500 Basic + 2,000 Advance MCQs',
    basicMcqs: '1,500 Basic MCQs',
    advanceMcqs: '2,000 Advance MCQs',
    totalMcqs: '3,500 MCQs',
    duration: '3.0 Hours',
    passScore: '55% – 60%',
    docs: [
      'BSc Nursing / Diploma in General Nursing & Midwifery (GNM)',
      'Official Academic Transcripts for All Years',
      'Nursing Council Registration & License',
      'Recent Certificate of Good Standing (CGS)',
      'Clinical Experience Letters on Hospital Letterhead',
      'Valid BLS / CPR Certification'
    ]
  },
  {
    id: 'nurse_specialist',
    title: 'Specialist Nurse (Critical Care, ICU, OT, Emergency)',
    category: 'Nursing & Midwifery',
    icon: '🏥',
    expReq: 'Minimum 2–3 years clinical experience in designated specialty ward',
    examTitle: 'Prometric Specialty Nursing Exam',
    mcqs: '1,500 Basic + 2,000 Advance MCQs',
    basicMcqs: '1,500 Basic MCQs',
    advanceMcqs: '2,000 Advance MCQs',
    totalMcqs: '3,500 MCQs',
    duration: '3.0 Hours',
    passScore: '60%',
    docs: [
      'BSc / Post-Basic / MSc Nursing Degree Certificate',
      'Specialty Certification (Critical Care, Oncology, Emergency, etc.)',
      'Active Nursing Council Registration',
      'Certificate of Good Standing (CGS)',
      'Specialty Ward Experience Letters signed by Medical Director'
    ]
  },

  // Pharmacy
  {
    id: 'pharmacy',
    title: 'Clinical Pharmacist & Hospital Pharmacist',
    category: 'Pharmacy',
    icon: '💊',
    expReq: 'Minimum 2 years post-registration retail or clinical hospital pharmacy experience',
    examTitle: 'Prometric Pharmacy Licensing Exam (SPLE / DHA Pharmacy)',
    mcqs: '1,500 Basic + 2,000 Advance MCQs',
    basicMcqs: '1,500 Basic MCQs',
    advanceMcqs: '2,000 Advance MCQs',
    totalMcqs: '3,500 MCQs',
    duration: '2.5 – 3.0 Hours',
    passScore: '60%',
    docs: [
      'B.Pharm / PharmD Degree Certificate',
      'Official Academic Transcripts for all semesters',
      'Home Country Pharmacy Council Registration & License',
      'Clinical or Community Pharmacy Experience Letters',
      'Recent Certificate of Good Standing (CGS)'
    ]
  },

  // Dental Healthcare
  {
    id: 'dentistry',
    title: 'General Dentist & Dental Specialist',
    category: 'Dental Healthcare',
    icon: '🦷',
    expReq: 'Minimum 2 years post-internship clinical dental chairside experience',
    examTitle: 'Prometric Dental Exam (SDLE / DHA Dental)',
    mcqs: '1,500 Basic + 2,000 Advance MCQs',
    basicMcqs: '1,500 Basic MCQs',
    advanceMcqs: '2,000 Advance MCQs',
    totalMcqs: '3,500 MCQs',
    duration: '3.0 Hours',
    passScore: '60%',
    docs: [
      'BDS / DDS / DMD Degree Certificate',
      'Dental Internship Completion Certificate',
      'Dental Council Registration & License',
      'Clinical Experience Certificates (Minimum 2 years)',
      'Recent Certificate of Good Standing (CGS)'
    ]
  },

  // Allied Health Professions
  {
    id: 'allied',
    title: 'Allied Health: Physiotherapist & Rehabilitation Specialist',
    category: 'Allied Health',
    icon: '🏃',
    expReq: 'Minimum 2 years continuous clinical physical therapy experience in hospital or clinic',
    examTitle: 'Allied Health Prometric / Ministry Physiotherapy Exam',
    mcqs: '1,500 Basic + 2,000 Advance MCQs',
    basicMcqs: '1,500 Basic MCQs',
    advanceMcqs: '2,000 Advance MCQs',
    totalMcqs: '3,500 MCQs',
    duration: '2.5 Hours',
    passScore: '60%',
    docs: [
      'BSc Physiotherapy / Bachelor of Physical Therapy (BPT / DPT)',
      'Official Academic Transcripts & Internship Records',
      'Physical Therapy Council / Board Registration',
      'Clinical Rehabilitation Experience Certificates (2+ years)',
      'Recent Certificate of Good Standing (CGS)'
    ]
  },
  {
    id: 'lab',
    title: 'Allied Health: Medical Laboratory Technologist & Technician',
    category: 'Allied Health',
    icon: '🔬',
    expReq: 'Minimum 2 years diagnostic clinical laboratory experience (Hematology, Biochemistry, Microbiology)',
    examTitle: 'Medical Laboratory Prometric Exam (MLT / Technician)',
    mcqs: '1,500 Basic + 2,000 Advance MCQs',
    basicMcqs: '1,500 Basic MCQs',
    advanceMcqs: '2,000 Advance MCQs',
    totalMcqs: '3,500 MCQs',
    duration: '2.5 Hours',
    passScore: '60%',
    docs: [
      'BSc Medical Laboratory Technology (MLT) / Clinical Lab Science',
      'Consolidated Academic Transcripts',
      'Medical Laboratory Council Registration & License',
      'Diagnostic Laboratory Experience Verification Letters',
      'Recent Certificate of Good Standing (CGS)'
    ]
  },
  {
    id: 'radiology',
    title: 'Allied Health: Radiographer & Medical Imaging Technologist',
    category: 'Allied Health',
    icon: '🩻',
    expReq: 'Minimum 2 years hospital radiology department experience (X-Ray, CT, MRI, Ultrasound)',
    examTitle: 'Radiography & Medical Imaging Prometric Exam',
    mcqs: '1,500 Basic + 2,000 Advance MCQs',
    basicMcqs: '1,500 Basic MCQs',
    advanceMcqs: '2,000 Advance MCQs',
    totalMcqs: '3,500 MCQs',
    duration: '2.5 Hours',
    passScore: '60%',
    docs: [
      'BSc Radiography / Medical Imaging Technology / Sonography Degree',
      'Radiation Protection & Safety Training Certification',
      'Allied Health / Radiologic Council Registration',
      'Hospital Radiology Department Experience Letters',
      'Recent Certificate of Good Standing (CGS)'
    ]
  },
  {
    id: 'nutrition',
    title: 'Allied Health: Clinical Nutritionist & Registered Dietitian',
    category: 'Allied Health',
    icon: '🥗',
    expReq: 'Minimum 2 years clinical nutrition / dietary management experience in hospital or clinic',
    examTitle: 'Clinical Nutrition & Dietetics Prometric Exam',
    mcqs: '1,500 Basic + 2,000 Advance MCQs',
    basicMcqs: '1,500 Basic MCQs',
    advanceMcqs: '2,000 Advance MCQs',
    totalMcqs: '3,500 MCQs',
    duration: '2.5 Hours',
    passScore: '60%',
    docs: [
      'BSc Clinical Nutrition & Dietetics / Human Nutrition Degree',
      'Clinical Dietetics Hospital Internship Certificate',
      'Professional Nutritionist / Dietitian Council Registration',
      'Hospital Nutrition Department Clinical Experience Letters',
      'Recent Certificate of Good Standing (CGS)'
    ]
  },
  {
    id: 'respiratory',
    title: 'Allied Health: Respiratory Therapist & Critical Care Tech',
    category: 'Allied Health',
    icon: '🫁',
    expReq: 'Minimum 2 years inpatient / ICU respiratory therapy clinical experience',
    examTitle: 'Respiratory Care Prometric Exam',
    mcqs: '1,500 Basic + 2,000 Advance MCQs',
    basicMcqs: '1,500 Basic MCQs',
    advanceMcqs: '2,000 Advance MCQs',
    totalMcqs: '3,500 MCQs',
    duration: '2.5 Hours',
    passScore: '60%',
    docs: [
      'BSc Respiratory Therapy / Respiratory Care Science Degree',
      'Academic Transcripts & Supervised Clinical Rotation Records',
      'Respiratory Care Council / Allied Health License',
      'ICU & Pulmonary Care Clinical Experience Letters',
      'Recent Certificate of Good Standing (CGS)'
    ]
  },
  {
    id: 'paramedic',
    title: 'Allied Health: Emergency Medical Technician (EMT) & Paramedic',
    category: 'Allied Health',
    icon: '🚑',
    expReq: 'Minimum 2 years pre-hospital emergency medical service or trauma unit experience',
    examTitle: 'Emergency Medical Services (EMS / Paramedic) Prometric Exam',
    mcqs: '1,500 Basic + 2,000 Advance MCQs',
    basicMcqs: '1,500 Basic MCQs',
    advanceMcqs: '2,000 Advance MCQs',
    totalMcqs: '3,500 MCQs',
    duration: '2.5 Hours',
    passScore: '60%',
    docs: [
      'Paramedic Diploma / BSc Emergency Medical Services (EMS)',
      'Valid BLS, ACLS, ITLS / PHTLS Certifications',
      'Home Country Paramedic / Allied Health Council Registration',
      'Emergency Ambulance Service / Hospital Experience Letters',
      'Recent Certificate of Good Standing (CGS)'
    ]
  },
  {
    id: 'occupational',
    title: 'Allied Health: Occupational Therapist (OT)',
    category: 'Allied Health',
    icon: '🦾',
    expReq: 'Minimum 2 years clinical occupational therapy and functional rehabilitation experience',
    examTitle: 'Occupational Therapy Prometric Exam',
    mcqs: '1,500 Basic + 2,000 Advance MCQs',
    basicMcqs: '1,500 Basic MCQs',
    advanceMcqs: '2,000 Advance MCQs',
    totalMcqs: '3,500 MCQs',
    duration: '2.5 Hours',
    passScore: '60%',
    docs: [
      'Bachelor of Occupational Therapy (BOT / BSc OT) Degree',
      'Official Academic Transcripts & Clinical Internship Verification',
      'Occupational Therapy Council / Board Registration',
      'Clinical Experience Certificates (Minimum 2 years)',
      'Recent Certificate of Good Standing (CGS)'
    ]
  },
  {
    id: 'speech',
    title: 'Allied Health: Speech-Language Pathologist & Audiologist',
    category: 'Allied Health',
    icon: '🗣️',
    expReq: 'Minimum 2 years clinical speech-language therapy or diagnostic audiology practice',
    examTitle: 'Speech-Language Pathology & Audiology Prometric Exam',
    mcqs: '1,500 Basic + 2,000 Advance MCQs',
    basicMcqs: '1,500 Basic MCQs',
    advanceMcqs: '2,000 Advance MCQs',
    totalMcqs: '3,500 MCQs',
    duration: '2.5 Hours',
    passScore: '60%',
    docs: [
      'BSc / MSc Speech-Language Pathology / Audiology Degree',
      'Academic Transcripts & Supervised Clinical Practicum Logbook',
      'Speech & Hearing Association / Council Registration',
      'Hospital or Clinical Rehabilitation Experience Letters',
      'Recent Certificate of Good Standing (CGS)'
    ]
  },
  {
    id: 'optometry',
    title: 'Allied Health: Optometrist & Vision Care Specialist',
    category: 'Allied Health',
    icon: '👁️',
    expReq: 'Minimum 2 years clinical optometry or eye hospital practice',
    examTitle: 'Optometry Prometric Exam',
    mcqs: '1,500 Basic + 2,000 Advance MCQs',
    basicMcqs: '1,500 Basic MCQs',
    advanceMcqs: '2,000 Advance MCQs',
    totalMcqs: '3,500 MCQs',
    duration: '2.5 Hours',
    passScore: '60%',
    docs: [
      'BSc Optometry / Doctor of Optometry (OD) Degree',
      'Academic Transcripts & Clinical Internship Records',
      'Optometry Council Registration & License',
      'Eye Hospital / Clinic Clinical Experience Certificates',
      'Recent Certificate of Good Standing (CGS)'
    ]
  },
  {
    id: 'anesthesia_tech',
    title: 'Allied Health: Anesthesia Technologist & Operating Theatre Specialist',
    category: 'Allied Health',
    icon: '🫀',
    expReq: 'Minimum 2 years operating room surgical anesthesia assisting experience',
    examTitle: 'Anesthesia Technology Prometric Exam',
    mcqs: '1,500 Basic + 2,000 Advance MCQs',
    basicMcqs: '1,500 Basic MCQs',
    advanceMcqs: '2,000 Advance MCQs',
    totalMcqs: '3,500 MCQs',
    duration: '2.5 Hours',
    passScore: '60%',
    docs: [
      'BSc Anesthesia Technology / Diploma in Operation Theatre Tech',
      'Academic Transcripts & Operating Room Clinical Logbook',
      'Allied Health Anesthesia Council Registration',
      'Hospital Surgical / Anesthesia Department Experience Letters',
      'Recent Certificate of Good Standing (CGS)'
    ]
  },
  {
    id: 'dental_hygiene',
    title: 'Allied Health: Dental Hygienist & Dental Assistant',
    category: 'Allied Health',
    icon: '🪥',
    expReq: 'Minimum 2 years continuous clinical dental chairside or hygiene experience',
    examTitle: 'Dental Hygiene Prometric Exam',
    mcqs: '1,500 Basic + 2,000 Advance MCQs',
    basicMcqs: '1,500 Basic MCQs',
    advanceMcqs: '2,000 Advance MCQs',
    totalMcqs: '3,500 MCQs',
    duration: '2.5 Hours',
    passScore: '60%',
    docs: [
      'Diploma or Degree in Dental Hygiene / Dental Assisting',
      'Dental Council Registration & Practice License',
      'Dental Clinic Clinical Experience Certificates',
      'Academic Transcripts for All Semesters',
      'Recent Certificate of Good Standing (CGS)'
    ]
  },
  {
    id: 'psychology',
    title: 'Allied Health: Clinical Psychologist & Behavioral Specialist',
    category: 'Allied Health',
    icon: '🧠',
    expReq: 'Minimum 2 years post-Master’s supervised clinical psychological assessment and therapy experience',
    examTitle: 'Clinical Psychology Prometric Exam',
    mcqs: '1,500 Basic + 2,000 Advance MCQs',
    basicMcqs: '1,500 Basic MCQs',
    advanceMcqs: '2,000 Advance MCQs',
    totalMcqs: '3,500 MCQs',
    duration: '2.5 Hours',
    passScore: '60%',
    docs: [
      'Master’s or Doctorate (PhD / PsyD) in Clinical Psychology',
      'Supervised Clinical Practicum Logbook & Training Verification',
      'Valid Clinical Psychology Board Registration & License',
      'Hospital / Mental Health Center Experience Letters',
      'Recent Certificate of Good Standing (CGS)'
    ]
  },
  {
    id: 'pharmacy_tech',
    title: 'Allied Health: Pharmacy Technician',
    category: 'Allied Health',
    icon: '🧴',
    expReq: 'Minimum 2 years dispensing experience under licensed pharmacist supervision',
    examTitle: 'Pharmacy Technician Prometric Exam',
    mcqs: '1,500 Basic + 2,000 Advance MCQs',
    basicMcqs: '1,500 Basic MCQs',
    advanceMcqs: '2,000 Advance MCQs',
    totalMcqs: '3,500 MCQs',
    duration: '2.5 Hours',
    passScore: '60%',
    docs: [
      'Diploma in Pharmacy (D.Pharm) or Pharmacy Technician Certificate',
      'Pharmacy Council Registration & License',
      'Hospital or Retail Pharmacy Experience Verification Letters',
      'Official Academic Transcripts',
      'Recent Certificate of Good Standing (CGS)'
    ]
  }
];

const PREPARATION_HIGHLIGHTS = [
  {
    exam: 'DHA Dubai Prometric',
    role: 'General Medicine & GP',
    questions: '2,400+ High-Yield MCQs',
    features: 'Prometric CBT interface, timed simulation, detailed rationales',
    badge: 'High Passing Rate'
  },
  {
    exam: 'SCFHS SMLE & SNLE',
    role: 'Saudi Medical & Nursing Licensing',
    questions: '3,800+ Questions',
    features: 'Mumaris+ blueprint aligned, recall question trends, chapter drills',
    badge: 'Popular'
  },
  {
    exam: 'DOH Abu Dhabi (HAAD)',
    role: 'Physicians, Dentists & Nurses',
    questions: '2,100+ Questions',
    features: 'Pearson VUE computer layout, clinical case studies, weak-point tracker',
    badge: 'Updated 2026'
  },
  {
    exam: 'MOHAP UAE Licensing',
    role: 'Pharmacists, GP & Allied Health',
    questions: '1,900+ Questions',
    features: 'Prometric CBT exam format, clinical scenarios, instant scorecard',
    badge: 'Complete Bank'
  },
  {
    exam: 'OMSB Oman Prometric',
    role: 'Doctors & Specialists',
    questions: '1,650+ Questions',
    features: 'OMSB curriculum questions, pacing target exercises, full mock runs',
    badge: 'Specialist Focus'
  },
  {
    exam: 'QCHP Qatar Prometric',
    role: 'Doctors, Nurses & Dentists',
    questions: '1,800+ Questions',
    features: 'Qatar MOPH standard questions, instant rationale breakdown',
    badge: 'Comprehensive'
  }
];

const FAQS = [
  {
    q: 'What is ClickToGulf and how does it relate to ClickToGulf Exams?',
    a: 'ClickToGulf is the global gateway providing complete licensing services (DataFlow PSV, health authority credentialing, and eligibility assessments) for Gulf careers worldwide. ClickToGulf Exams is our specialized medical exam preparation portal featuring authentic Prometric and Pearson VUE computer-based exam simulations with over 15,000 verified questions.'
  },
  {
    q: 'What is Primary Source Verification (DataFlow PSV)?',
    a: 'DataFlow is an international credential verification service mandated by GCC health authorities (DHA, DOH, MOHAP, SCFHS, OMSB, QCHP, NHRA). They verify your educational degrees, medical council licenses, and clinical work experience directly with the issuing institutions worldwide. ClickToGulf handles this entire process on your behalf to avoid common documentation errors and delays.'
  },
  {
    q: 'Can I take the Prometric exam before completing DataFlow verification?',
    a: 'Yes, for several authorities including DHA, SCFHS, and OMSB, you can generate your exam eligibility (Scheduling Permit) and sit for your Prometric examination while your DataFlow verification is underway. However, your final medical practice license will only be issued once DataFlow issues a positive PSV report.'
  },
  {
    q: 'How long does the entire Gulf licensing process take?',
    a: 'Typically, DataFlow verification takes 15 to 30 business days. Preparing for the exam with ClickToGulf Exams usually takes 3 to 6 weeks. Overall, most international healthcare professionals complete their licensing requirements and receive their eligibility letter in approximately 6 to 8 weeks.'
  },
  {
    q: 'Can I transfer or convert my DHA license to DOH (Abu Dhabi) or MOHAP?',
    a: 'Yes! Under the Unified Healthcare Professional Qualification Requirements (PQR) in the UAE, candidates who pass the DHA Prometric or obtain a DHA license can apply for conversion or reciprocity with DOH (Abu Dhabi) and MOHAP after fulfilling any authority-specific criteria.'
  },
  {
    q: 'What materials does ClickToGulf Exams provide for exam preparation?',
    a: 'ClickToGulf Exams provides full-length timed mock exams replicating real Prometric and Pearson VUE software, specialty-specific question banks, chapter-wise drills, in-depth rationales for every option, performance diagnostic reports, and mobile-friendly access so you can study anytime, anywhere.'
  }
];

export default function ClickToGulf() {
  const [theme, setTheme] = useState(() => {
    try {
      const stored =
        localStorage.getItem('ctg-index-theme') ||
        localStorage.getItem('clicktogulf-index-theme') ||
        localStorage.getItem('mockgulfmed-index-theme');
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {
      /* ignore */
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedAuthId, setSelectedAuthId] = useState('dha');
  const [selectedProfId, setSelectedProfId] = useState('medicine');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [expandedFaq, setExpandedFaq] = useState(0);

  useEffect(() => {
    document.title = 'ClickToGulf — Gulf Healthcare Licensing & Exam Preparation Worldwide';
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ctg-index-theme', theme);
      localStorage.setItem('clicktogulf-index-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const selectedAuth = GULF_AUTHORITIES.find((a) => a.id === selectedAuthId) || GULF_AUTHORITIES[0];
  const selectedProf = PROFESSIONS.find((p) => p.id === selectedProfId) || PROFESSIONS[0];

  return (
    <div className={`ctg-page ctg-page--${theme}`} id="clicktogulf-page">
      <a href="#ctg-main" className="ctg-skip-link">
        Skip to main content
      </a>

      {/* 2026 Floating Navigation Island */}
      <FloatingNavIsland />

      {/* Navigation Header */}
      <header className={`ctg-header ${headerScrolled ? 'ctg-header--scrolled' : ''}`} id="ctg-header" role="banner">
        <div className="ctg-header-inner">
          <Link to="/" className="ctg-brand" id="ctg-brand-link" aria-label="ClickToGulf Home">
            <img
              src="/clicktogulf-icon.svg"
              alt="ClickToGulf Shield Emblem"
              className="ctg-brand-badge"
              style={{ padding: '3px', background: 'transparent', boxShadow: 'none' }}
              width="44"
              height="44"
            />
            <div className="ctg-brand-text">
              <div className="ctg-brand-name">
                <span className="ctg-name-click">CLICK</span>
                <span className="ctg-name-to">to</span>
                <span className="ctg-name-gulf">GULF</span>
              </div>
              <span className="ctg-brand-tag">Medical Licensing &amp; PSV</span>
            </div>
          </Link>

          <nav className="ctg-nav-links" id="ctg-desktop-nav" aria-label="Main Navigation">
            <a href="#ctg-licensing" className="ctg-nav-link">
              Licensing Services
            </a>
            <a href="#ctg-navigator" className="ctg-nav-link">
              Pathway Navigator
            </a>
            <a href="#ctg-prep" className="ctg-nav-link">
              Preparation Materials
            </a>
            <Link to="/exams-portal" className="ctg-nav-link ctg-nav-portal-badge" id="ctg-nav-mockgulfmed">
              <span>🩺</span> ClickToGulf Exams Portal
            </Link>
            <Link to="/packages" className="ctg-nav-link">
              Packages
            </Link>
            <Link to="/eligibility-check" className="ctg-nav-link">
              Eligibility Check
            </Link>
          </nav>

          <div className="ctg-header-actions" id="ctg-header-actions">
            <button
              type="button"
              className="ctg-theme-toggle"
              id="ctg-theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <Link to="/login" className="ctg-btn ctg-btn--ghost" id="ctg-login-btn">
              Sign In
            </Link>

            <Link to="/register" className="ctg-btn ctg-btn--primary" id="ctg-register-btn">
              Get Started
            </Link>

            <button
              type="button"
              className="ctg-mobile-toggle"
              id="ctg-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="ctg-mobile-drawer" id="ctg-mobile-drawer">
          <a href="#ctg-licensing" onClick={() => setMobileMenuOpen(false)}>
            Licensing Services Worldwide
          </a>
          <a href="#ctg-navigator" onClick={() => setMobileMenuOpen(false)}>
            Gulf Pathway Navigator
          </a>
          <a href="#ctg-prep" onClick={() => setMobileMenuOpen(false)}>
            Exam Preparation Materials
          </a>
          <Link to="/exams-portal" onClick={() => setMobileMenuOpen(false)}>
            🩺 ClickToGulf Exams Portal
          </Link>
          <Link to="/packages" onClick={() => setMobileMenuOpen(false)}>
            Subscription Packages
          </Link>
          <Link to="/eligibility-check" onClick={() => setMobileMenuOpen(false)}>
            Free Eligibility Assessment
          </Link>
          <Link to="/features" onClick={() => setMobileMenuOpen(false)}>
            Platform Features
          </Link>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Link to="/login" className="ctg-btn ctg-btn--ghost" style={{ flex: 1 }} onClick={() => setMobileMenuOpen(false)}>
              Sign In
            </Link>
            <Link to="/register" className="ctg-btn ctg-btn--primary" style={{ flex: 1 }} onClick={() => setMobileMenuOpen(false)}>
              Get Started
            </Link>
          </div>
        </div>
      )}

      <main id="ctg-main">
        {/* Hero Section */}
        <section className="ctg-hero" id="ctg-hero-section" aria-labelledby="ctg-hero-heading">
          <div className="ctg-hero-decor-1" aria-hidden="true" />
          <div className="ctg-hero-decor-2" aria-hidden="true" />

          <div className="ctg-hero-inner">
            <div className="ctg-hero-content">
              <div className="ctg-badge-pill" id="ctg-hero-pill">
                <span>🌐</span> Healthcare Licensing & Prep Hub for Gulf Careers Worldwide
              </div>

              <h1 className="ctg-hero-title" id="ctg-hero-heading">
                Fast-Track Your Gulf <span className="ctg-hero-title-highlight">Healthcare License</span> & Exam Success
              </h1>

              <p className="ctg-hero-desc">
                ClickToGulf empowers medical doctors, nurses, pharmacists, and allied health professionals globally with end-to-end DataFlow Primary Source Verification (PSV), official Health Authority eligibility processing, and authentic Prometric & Pearson VUE question banks powered by ClickToGulf Exams.
              </p>

              <div className="ctg-hero-cta-group" id="ctg-hero-ctas">
                <Link to="/eligibility-check" className="ctg-btn ctg-btn--primary ctg-btn--lg" id="ctg-cta-eligibility">
                  Check Eligibility Free ➔
                </Link>
                <Link to="/exams-portal" className="ctg-btn ctg-btn--blue ctg-btn--lg" id="ctg-cta-mockgulfmed">
                  Launch ClickToGulf Exams Portal
                </Link>
                <a href="#ctg-licensing" className="ctg-btn ctg-btn--ghost ctg-btn--lg" id="ctg-cta-licensing">
                  Licensing Services
                </a>
              </div>

              <div className="ctg-hero-meta" id="ctg-hero-meta-strip">
                <div className="ctg-hero-meta-item">
                  <span>✓</span>
                  <div>
                    <strong>8 Gulf Authorities</strong>
                    <div>DHA, DOH, MOHAP, SCFHS & more</div>
                  </div>
                </div>
                <div className="ctg-hero-meta-item">
                  <span>✓</span>
                  <div>
                    <strong>99.4% Pass Rate</strong>
                    <div>In DataFlow and Exam Simulation</div>
                  </div>
                </div>
                <div className="ctg-hero-meta-item">
                  <span>✓</span>
                  <div>
                    <strong>15,000+ MCQs</strong>
                    <div>Prometric & Pearson VUE format</div>
                  </div>
                </div>
              </div>

              {/* 2026 Interactive Persona Switcher */}
              <HeroPersonaSwitch />
            </div>

            {/* Visual Interactive Hero Card */}
            <div className="ctg-hero-card" id="ctg-hero-summary-card">
              <div className="ctg-hero-card-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <img
                    src="/clicktogulf-logo.svg"
                    alt="ClickToGulf - Medical Licensing &amp; Primary Source Verification"
                    style={{ width: '100%', maxWidth: '280px', height: 'auto' }}
                  />
                  <span className="ctg-status-badge">Worldwide</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ctg-text-muted)' }}>
                  Complete Gulf Healthcare Gateway — from Primary Source Verification to your CBT exam and hospital license.
                </p>
              </div>

              <div className="ctg-hero-card-pillars">
                <div className="ctg-pillar-mini ctg-pillar-mini--green" id="ctg-hero-pillar-licensing">
                  <div className="ctg-pillar-mini-icon">🏛️</div>
                  <div className="ctg-pillar-mini-content">
                    <h4>Gulf Licensing &amp; DataFlow PSV</h4>
                    <p>Primary Source Verification, Sheryan &amp; Mumaris+ accounts, Good Standing verification, and PQR credential clearance without rejection risks.</p>
                  </div>
                </div>

                <div className="ctg-pillar-mini ctg-pillar-mini--blue" id="ctg-hero-pillar-exam">
                  <div className="ctg-pillar-mini-icon">📚</div>
                  <div className="ctg-pillar-mini-content">
                    <h4>Exam Preparation (ClickToGulf Exams)</h4>
                    <p>Computer-delivered Prometric &amp; Pearson VUE mock exams with timers, topic diagnostics, and verified high-yield clinical question banks.</p>
                  </div>
                </div>

                <div className="ctg-pillar-mini" id="ctg-hero-pillar-careers">
                  <div className="ctg-pillar-mini-icon">💼</div>
                  <div className="ctg-pillar-mini-content">
                    <h4>Hospital Placements &amp; Careers</h4>
                    <p>Direct bridge to premier hospitals, clinics, and healthcare employers across the UAE, Saudi Arabia, Qatar, and Oman.</p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--ctg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--ctg-text-muted)' }}>Need custom support?</span>
                <Link to="/packages" style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--ctg-teal-600)', textDecoration: 'none' }}>
                  View Preparation Plans ➔
                </Link>
              </div>
            </div>
          </div>

          {/* Official Partner of Section (As seen in the ClickToGulf branding) */}
          <div className="ctg-partner-banner" id="ctg-official-partners" aria-label="Official Partner Accreditation">
            <div className="ctg-partner-header-line">
              <span className="ctg-partner-header-title">OFFICIAL PARTNER OF:</span>
            </div>
            <div className="ctg-partner-logos">
              <div className="ctg-partner-badge-item">
                <span className="ctg-partner-emblem">🛡️</span>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Saudi Commission for Health Specialties</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ctg-text-muted)' }}>SCFHS • Mumaris+ Licensing</div>
                </div>
              </div>

              <div className="ctg-partner-badge-item">
                <span className="ctg-partner-emblem">🏛️</span>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Ministry of Health &amp; Prevention</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ctg-text-muted)' }}>MOHAP • UAE Health Council</div>
                </div>
              </div>

              <div className="ctg-partner-badge-item">
                <span className="ctg-partner-emblem">🏥</span>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Ministry of Health</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ctg-text-muted)' }}>OMSB Oman • QCHP Qatar • NHRA Bahrain</div>
                </div>
              </div>

              <div className="ctg-partner-badge-item">
                <span className="ctg-partner-emblem">📝</span>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, fontFamily: 'serif', letterSpacing: '0.03em' }}>Pearson | VUE</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ctg-text-muted)' }}>Official CBT Examination Partner</div>
                </div>
              </div>

              <div className="ctg-partner-badge-item">
                <span className="ctg-partner-emblem">🌐</span>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ctg-teal-600)' }}>DataFlow® Group</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ctg-text-muted)' }}>Primary Source Verification (PSV)</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Regulatory Authorities Strip */}
        <section className="ctg-authorities-strip" id="ctg-authorities-strip" aria-label="Supported Gulf Health Authorities">
          <div className="ctg-authorities-inner">
            <span className="ctg-authorities-heading">Supported GCC Health Regulatory Authorities</span>
            <div className="ctg-authorities-grid">
              {GULF_AUTHORITIES.map((auth) => (
                <div key={auth.id} className="ctg-auth-pill">
                  <span className="ctg-auth-flag">{auth.flag}</span>
                  <span>{auth.name.split('—')[0].trim()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pathway Navigator Section */}
        <section className="ctg-section ctg-section--alt" id="ctg-navigator" aria-labelledby="ctg-navigator-title">
          <div className="ctg-section-inner">
            <div className="ctg-section-header">
              <span className="ctg-section-eyebrow">Interactive Tool</span>
              <h2 className="ctg-section-title" id="ctg-navigator-title">
                Gulf Licensing &amp; Preparation Pathway Navigator
              </h2>
              <p className="ctg-section-desc">
                Select your target health authority and medical or allied health profession to instantly explore eligibility requirements, DataFlow PSV documents, and standardized exam preparation materials (1,500 Basic MCQs for revision and 2,000 Advance MCQs for exam preparation — uniform across all professions).
              </p>
            </div>

            <div className="ctg-explorer" id="ctg-explorer-box">
              {/* Category Quick Filter Chips */}
              <div className="ctg-category-filter-wrap">
                <span className="ctg-filter-label">Quick Profession Category:</span>
                <div className="ctg-category-chips" role="tablist" aria-label="Filter professions by category">
                  {[
                    { id: 'All', label: 'All Professions (19)' },
                    { id: 'Allied Health', label: '🏃 Allied Health (13 Disciplines)' },
                    { id: 'Doctors & Specialists', label: '🩺 Doctors & Specialists' },
                    { id: 'Nursing & Midwifery', label: '💉 Nursing & Midwifery' },
                    { id: 'Pharmacy', label: '💊 Pharmacy' },
                    { id: 'Dental Healthcare', label: '🦷 Dental Healthcare' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`ctg-category-chip ${activeCategoryFilter === cat.id ? 'ctg-category-chip--active' : ''}`}
                      onClick={() => {
                        setActiveCategoryFilter(cat.id);
                        if (cat.id !== 'All' && selectedProf.category !== cat.id) {
                          const firstInCat = PROFESSIONS.find((p) => p.category === cat.id);
                          if (firstInCat) setSelectedProfId(firstInCat.id);
                        }
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ctg-explorer-selectors">
                <div>
                  <label htmlFor="ctg-select-authority" className="ctg-field-label">
                    1. Select Target Gulf Health Authority:
                  </label>
                  <select
                    id="ctg-select-authority"
                    className="ctg-select"
                    value={selectedAuthId}
                    onChange={(e) => setSelectedAuthId(e.target.value)}
                  >
                    {GULF_AUTHORITIES.map((auth) => (
                      <option key={auth.id} value={auth.id}>
                        {auth.flag} {auth.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="ctg-select-profession" className="ctg-field-label">
                    2. Select Medical or Allied Health Profession:
                  </label>
                  <select
                    id="ctg-select-profession"
                    className="ctg-select"
                    value={selectedProfId}
                    onChange={(e) => setSelectedProfId(e.target.value)}
                  >
                    {activeCategoryFilter === 'All' ? (
                      [
                        'Doctors & Specialists',
                        'Nursing & Midwifery',
                        'Pharmacy',
                        'Dental Healthcare',
                        'Allied Health'
                      ].map((categoryName) => {
                        const items = PROFESSIONS.filter((p) => p.category === categoryName);
                        if (!items.length) return null;
                        return (
                          <optgroup key={categoryName} label={categoryName === 'Allied Health' ? '🏃 Allied Health Professions' : categoryName}>
                            {items.map((prof) => (
                              <option key={prof.id} value={prof.id}>
                                {prof.icon} {prof.title}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })
                    ) : (
                      PROFESSIONS.filter((p) => p.category === activeCategoryFilter).map((prof) => (
                        <option key={prof.id} value={prof.id}>
                          {prof.icon} {prof.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="ctg-explorer-result" id="ctg-explorer-results-display">
                {/* Column 1: Eligibility & DataFlow PSV Checklist */}
                <div className="ctg-result-col">
                  <div className="ctg-result-badge-row">
                    <span className="ctg-badge-pill">
                      {selectedAuth.flag} {selectedAuth.country}
                    </span>
                    <span className="ctg-badge-pill ctg-badge-pill--category">
                      {selectedProf.category === 'Allied Health' ? '🏃 Allied Health Specialty' : selectedProf.category}
                    </span>
                    <span className="ctg-status-badge">Official Pathway</span>
                  </div>

                  <h3 className="ctg-result-title">
                    {selectedProf.icon} {selectedProf.title} — {selectedAuth.name.split('—')[0].trim()}
                  </h3>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '8px', color: 'var(--ctg-text)' }}>
                      📋 Clinical Experience &amp; Eligibility Criteria:
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--ctg-text-muted)', margin: 0, lineHeight: 1.5 }}>
                      {selectedProf.expReq} (recognized hospital, clinic, or diagnostic establishment in your home country).
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '8px', color: 'var(--ctg-text)' }}>
                      🗂️ DataFlow PSV Mandatory Document Checklist:
                    </h4>
                    <ul className="ctg-result-list">
                      {selectedProf.docs.map((doc, idx) => (
                        <li key={idx} className="ctg-result-item">
                          <span className="ctg-result-item-icon">✓</span>
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Column 2: Standardized Examination Pattern & Format (1,500 Basic + 2,000 Advance MCQs) */}
                <div className="ctg-result-col">
                  <div className="ctg-result-box" id="ctg-exam-spec-box">
                    <div className="ctg-result-box-header">
                      <h4 className="ctg-result-box-title">
                        🎯 Examination Pattern &amp; Format
                      </h4>
                      <span className="ctg-authority-spec-tag">
                        {selectedAuth.name.split('—')[0].trim()} Standard
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ctg-text-muted)' }}>
                      <strong>Delivery Body:</strong> {selectedAuth.exam} ({selectedAuth.country})
                    </p>

                    {/* Standardized 1,500 Basic + 2,000 Advance MCQ Provision Card */}
                    <div className="ctg-mcq-provision-card">
                      <div className="ctg-mcq-provision-header">
                        <span className="ctg-mcq-provision-badge">Question Bank Breakdown</span>
                        <span className="ctg-mcq-provision-meta">Standard for All Professions</span>
                      </div>

                      <div className="ctg-mcq-provision-grid">
                        <div className="ctg-mcq-tier-card ctg-mcq-tier-card--basic">
                          <div className="ctg-mcq-tier-icon">📖</div>
                          <div className="ctg-mcq-tier-content">
                            <div className="ctg-mcq-tier-count">1,500 Basic MCQs</div>
                            <div className="ctg-mcq-tier-label">For Revision</div>
                            <p className="ctg-mcq-tier-desc">
                              Foundational concepts, rapid recall drills, core syllabus refreshers, and baseline knowledge mastery.
                            </p>
                          </div>
                        </div>

                        <div className="ctg-mcq-tier-card ctg-mcq-tier-card--advance">
                          <div className="ctg-mcq-tier-icon">⚡</div>
                          <div className="ctg-mcq-tier-content">
                            <div className="ctg-mcq-tier-count">2,000 Advance MCQs</div>
                            <div className="ctg-mcq-tier-label">For Exam Preparation</div>
                            <p className="ctg-mcq-tier-desc">
                              Complex clinical case scenarios, Prometric &amp; Pearson VUE format, diagnostic decisions, and multi-step vignettes.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="ctg-mcq-provision-footer">
                        <div className="ctg-mcq-total-wrap">
                          <span className="ctg-mcq-total-pill">Total: 3,500 Practice MCQs</span>
                        </div>
                        <span className="ctg-mcq-note">
                          ✓ Guaranteed 1,500 revision + 2,000 preparation MCQs for all medical &amp; allied health professions
                        </span>
                      </div>
                    </div>

                    {/* Official Exam Metrics Grid */}
                    <div className="ctg-result-metric-grid">
                      <div className="ctg-result-metric">
                        <span className="ctg-result-metric-val">1,500</span>
                        <span className="ctg-result-metric-lbl">Basic MCQs (Revision)</span>
                      </div>
                      <div className="ctg-result-metric">
                        <span className="ctg-result-metric-val">2,000</span>
                        <span className="ctg-result-metric-lbl">Advance MCQs (Preparation)</span>
                      </div>
                      <div className="ctg-result-metric">
                        <span className="ctg-result-metric-val">{selectedProf.duration}</span>
                        <span className="ctg-result-metric-lbl">Exam Session Duration</span>
                      </div>
                      <div className="ctg-result-metric">
                        <span className="ctg-result-metric-val">{selectedProf.passScore}</span>
                        <span className="ctg-result-metric-lbl">Required Passing Score</span>
                      </div>
                    </div>

                    <div className="ctg-exam-note">
                      <span className="ctg-exam-note-icon">ℹ️</span>
                      <span>
                        All question banks follow authentic Prometric CBT / Pearson VUE layouts. Primary Source Verification is conducted through {selectedAuth.psv}.
                      </span>
                    </div>

                    <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <Link to="/exams-portal" className="ctg-btn ctg-btn--blue" style={{ width: '100%' }}>
                        Start {selectedProf.title.split('(')[0].replace('Allied Health:', '').trim()} Mocks on ClickToGulf Exams ➔
                      </Link>
                      <Link to="/eligibility-check" className="ctg-btn ctg-btn--ghost" style={{ width: '100%' }}>
                        Check Detailed Personal Eligibility
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2026 Interactive Gulf Licensing Cost & Timeline Estimator */}
        <LicensingCostEstimator />

        {/* Dual Core Pillars: Licensing & Preparation */}
        <section className="ctg-section" id="ctg-licensing" aria-labelledby="ctg-pillars-title">
          <div className="ctg-section-inner">
            <div className="ctg-section-header">
              <span className="ctg-section-eyebrow">Two Comprehensive Pillars</span>
              <h2 className="ctg-section-title" id="ctg-pillars-title">
                Licensing Services & Preparation Material Worldwide
              </h2>
              <p className="ctg-section-desc">
                Everything you need to successfully transition your healthcare career to the Gulf: professional licensing assistance and high-yield Prometric & Pearson VUE exam prep.
              </p>
            </div>

            <div className="ctg-pillars-grid">
              {/* Pillar 1: Licensing Services */}
              <div className="ctg-pillar-card ctg-pillar-card--licensing" id="ctg-licensing-services-card">
                <div className="ctg-pillar-top">
                  <div className="ctg-pillar-header-wrap">
                    <div className="ctg-pillar-icon-badge">🏛️</div>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--ctg-emerald-600)', letterSpacing: '0.05em' }}>
                        Pillar 1 · Worldwide Service
                      </span>
                      <h3 className="ctg-pillar-card-title">
                        Gulf Healthcare Licensing Services
                      </h3>
                    </div>
                  </div>

                  <p className="ctg-pillar-card-desc">
                    Comprehensive, hassle-free credential verification and health authority account processing for international healthcare practitioners worldwide.
                  </p>

                  <ul className="ctg-pillar-features-list">
                    <li className="ctg-pillar-feature-item">
                      <div className="ctg-feature-check">✓</div>
                      <div className="ctg-feature-text">
                        <strong>DataFlow Primary Source Verification (PSV)</strong>
                        <span>End-to-end case creation, document submission, discrepancy resolution, and status tracking across all GCC regulators.</span>
                      </div>
                    </li>
                    <li className="ctg-pillar-feature-item">
                      <div className="ctg-feature-check">✓</div>
                      <div className="ctg-feature-text">
                        <strong>Regulatory Authority Registration</strong>
                        <span>Sheryan (DHA), TAMM (DOH Abu Dhabi), MOHAP portal, and Mumaris+ (Saudi SCFHS) account creation & application filing.</span>
                      </div>
                    </li>
                    <li className="ctg-pillar-feature-item">
                      <div className="ctg-feature-check">✓</div>
                      <div className="ctg-feature-text">
                        <strong>Pre-Screening & PQR Gap Analysis</strong>
                        <span>Verify whether your degrees, internship timeline, and continuous experience strictly satisfy Unified Healthcare PQR rules before paying authority fees.</span>
                      </div>
                    </li>
                    <li className="ctg-pillar-feature-item">
                      <div className="ctg-feature-check">✓</div>
                      <div className="ctg-feature-text">
                        <strong>Good Standing & Attestation Guidance</strong>
                        <span>Assistance navigating home country medical council Certificate of Good Standing (CGS) requests and Ministry of Foreign Affairs (MoFA) attestations.</span>
                      </div>
                    </li>
                  </ul>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--ctg-border)' }}>
                  <Link to="/eligibility-check" className="ctg-btn ctg-btn--primary" style={{ flex: 1 }}>
                    Check Free Eligibility
                  </Link>
                  <Link to="/login" className="ctg-btn ctg-btn--ghost">
                    Apply for Licensing
                  </Link>
                </div>
              </div>

              {/* Pillar 2: Exam Preparation */}
              <div className="ctg-pillar-card ctg-pillar-card--prep" id="ctg-prep" aria-labelledby="ctg-prep-card-title">
                <div className="ctg-pillar-top">
                  <div className="ctg-pillar-header-wrap">
                    <div className="ctg-pillar-icon-badge">💻</div>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--ctg-blue-600)', letterSpacing: '0.05em' }}>
                        Pillar 2 · Powered by ClickToGulf Exams
                      </span>
                      <h3 className="ctg-pillar-card-title" id="ctg-prep-card-title">
                        Gulf Exam Preparation Materials
                      </h3>
                    </div>
                  </div>

                  <p className="ctg-pillar-card-desc">
                    Master your Prometric and Pearson VUE computer-delivered examinations with our state-of-the-art ClickToGulf Exams testing engine and clinical question banks.
                  </p>

                  <ul className="ctg-pillar-features-list">
                    <li className="ctg-pillar-feature-item">
                      <div className="ctg-feature-check">✓</div>
                      <div className="ctg-feature-text">
                        <strong>Authentic Prometric & Pearson VUE Simulator</strong>
                        <span>Practice with identical UI flows, exam timers, question review markers, and scoring algorithms to eliminate test-day anxiety.</span>
                      </div>
                    </li>
                    <li className="ctg-pillar-feature-item">
                      <div className="ctg-feature-check">✓</div>
                      <div className="ctg-feature-text">
                        <strong>15,000+ High-Yield Question Banks</strong>
                        <span>Curated and peer-reviewed by practicing Gulf healthcare specialists, covering high-frequency clinical scenarios and diagnostic traps.</span>
                      </div>
                    </li>
                    <li className="ctg-pillar-feature-item">
                      <div className="ctg-feature-check">✓</div>
                      <div className="ctg-feature-text">
                        <strong>Detailed Clinical Rationales</strong>
                        <span>Understand the core pathophysiology and reasoning behind every correct and incorrect answer choice with reference citations.</span>
                      </div>
                    </li>
                    <li className="ctg-pillar-feature-item">
                      <div className="ctg-feature-check">✓</div>
                      <div className="ctg-feature-text">
                        <strong>Smart Weak-Topic Analytics</strong>
                        <span>Pinpoint your lowest-scoring competencies (e.g. Obstetrics, Pharmacology, Infection Control) and convert them into passing scores.</span>
                      </div>
                    </li>
                  </ul>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--ctg-border)' }}>
                  <Link to="/exams-portal" className="ctg-btn ctg-btn--blue" style={{ flex: 1 }}>
                    Go to ClickToGulf Exams Portal ➔
                  </Link>
                  <Link to="/packages" className="ctg-btn ctg-btn--ghost">
                    View Exam Packages
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2026 Interactive Sticky 5-Stage Journey */}
        <StickyStageJourney />

        {/* 2026 In-Flow Prometric CBT Demo */}
        <InteractiveCbtDemo />

        {/* 2026 Live Searchable Exam Question Banks Catalog */}
        <ExamCatalogSearch />

        {/* 2026 Verified Candidate Stories & Authority Reviews */}
        <VerifiedCandidateStories />

        {/* Frequently Asked Questions */}
        <section className="ctg-section ctg-section--alt" id="ctg-faq" aria-labelledby="ctg-faq-title">
          <div className="ctg-section-inner">
            <div className="ctg-section-header">
              <span className="ctg-section-eyebrow">Clear Answers</span>
              <h2 className="ctg-section-title" id="ctg-faq-title">
                Frequently Asked Questions
              </h2>
              <p className="ctg-section-desc">
                Everything you need to know about Gulf healthcare licensing, DataFlow processing, and exam preparation.
              </p>
            </div>

            <div className="ctg-faq-list" id="ctg-faq-accordion">
              {FAQS.map((faq, index) => {
                const isOpen = expandedFaq === index;
                return (
                  <div key={index} className={`ctg-faq-item ${isOpen ? 'ctg-faq-item--open' : ''}`} id={`ctg-faq-${index}`}>
                    <button
                      type="button"
                      className="ctg-faq-question"
                      onClick={() => setExpandedFaq(isOpen ? -1 : index)}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <span className="ctg-faq-toggle-icon" aria-hidden="true">
                        ▼
                      </span>
                    </button>
                    {isOpen && <div className="ctg-faq-answer">{faq.a}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bottom Call to Action Banner */}
        <section className="ctg-section" id="ctg-cta" aria-label="Get started banner">
          <div className="ctg-section-inner">
            <div className="ctg-cta-banner" id="ctg-cta-banner-box">
              <span className="ctg-badge-pill" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
                Start Your International Healthcare Journey
              </span>
              <h2 className="ctg-cta-title">
                Ready to Practice in the Gulf Region?
              </h2>
              <p className="ctg-cta-desc">
                Join thousands of physicians, dentists, nurses, and pharmacists who obtained their Gulf licensing and passed their Prometric exams on the first attempt.
              </p>
              <div className="ctg-cta-buttons">
                <Link to="/register" className="ctg-btn ctg-btn--primary ctg-btn--lg" id="ctg-banner-register">
                  Create Your Free Account
                </Link>
                <Link to="/exams-portal" className="ctg-btn ctg-btn--outline-white ctg-btn--lg" id="ctg-banner-mockgulfmed">
                  Visit ClickToGulf Exams Portal
                </Link>
                <Link to="/eligibility-check" className="ctg-btn ctg-btn--ghost" style={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
                  Check Eligibility
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="ctg-footer" id="ctg-footer" role="contentinfo">
        <div className="ctg-footer-inner">
          <div className="ctg-footer-brand-col">
            <div className="ctg-brand">
              <img
                src="/clicktogulf-icon.svg"
                alt="ClickToGulf"
                className="ctg-brand-badge"
                style={{ padding: '2px', background: 'transparent', boxShadow: 'none' }}
                width="42"
                height="42"
              />
              <div className="ctg-brand-text">
                <div className="ctg-brand-name">
                  <span className="ctg-name-click">CLICK</span>
                  <span className="ctg-name-to">to</span>
                  <span className="ctg-name-gulf">GULF</span>
                </div>
                <span className="ctg-brand-tag">Global Healthcare Licensing &amp; Prep</span>
              </div>
            </div>
            <p className="ctg-footer-brand-desc">
              ClickToGulf is your comprehensive partner for Gulf healthcare licensing, DataFlow Primary Source Verification, and high-yield Prometric & Pearson VUE exam simulation powered by ClickToGulf Exams.
            </p>
          </div>

          <div className="ctg-footer-col">
            <h5>Licensing Services</h5>
            <ul className="ctg-footer-links">
              <li><Link to="/eligibility-check">Eligibility Assessment</Link></li>
              <li><Link to="/login">DataFlow PSV Assistance</Link></li>
              <li><a href="#ctg-navigator">Unified PQR Criteria</a></li>
              <li><a href="#ctg-authorities-strip">GCC Health Authorities</a></li>
              <li><Link to="/features">Platform Features</Link></li>
            </ul>
          </div>

          <div className="ctg-footer-col">
            <h5>Exam Preparation</h5>
            <ul className="ctg-footer-links">
              <li><Link to="/exams-portal">ClickToGulf Exams Portal</Link></li>
              <li><Link to="/packages">Subscription Packages</Link></li>
              <li><a href="#ctg-catalog">Prometric Question Banks</a></li>
              <li><a href="#ctg-catalog">Pearson VUE Simulations</a></li>
              <li><Link to="/download-app">Android Mobile App</Link></li>
            </ul>
          </div>

          <div className="ctg-footer-col">
            <h5>Account & Legal</h5>
            <ul className="ctg-footer-links">
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/register">Create Account</Link></li>
              <li><Link to="/policies/terms">Terms & Conditions</Link></li>
              <li><Link to="/policies/refund">Refund Policy</Link></li>
              <li><Link to="/policies">Privacy & Policies</Link></li>
            </ul>
          </div>
        </div>

        <div className="ctg-footer-bottom">
          <div>
            © {new Date().getFullYear()} ClickToGulf & ClickToGulf Exams. All rights reserved. Serving healthcare professionals worldwide.
          </div>
          <div className="ctg-footer-bottom-links">
            <Link to="/policies/terms">Terms</Link>
            <Link to="/policies/refund">Refunds</Link>
            <Link to="/exams-portal">ClickToGulf Exams Portal</Link>
          </div>
        </div>
      </footer>

      {/* 2026 Mobile Thumb Dock */}
      <MobileThumbDock />
    </div>
  );
}
