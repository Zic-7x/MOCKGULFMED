/**
 * Comprehensive public marketing copy for /features/* pages. Slugs are stable URLs.
 */

export const FEATURE_CATEGORIES = [
  { id: 'all', label: 'All features' },
  { id: 'exams', label: 'Mock exams & prep' },
  { id: 'licensing', label: 'Licensing & DataFlow' },
  { id: 'career', label: 'Career & Job portal' },
  { id: 'plans', label: 'Plans & packages' },
];

export const FEATURE_PAGE_LIST = [
  {
    slug: 'mock-exams',
    category: 'exams',
    navLabel: 'Mock exams & prep',
    title: 'Preparation & authority-aligned mock licensing exams',
    kicker: 'Exam readiness',
    tag: 'Most popular',
    icon: 'mockExams',
    stat: '10,000+ Questions',
    lede:
      'Practice with authentic authority-aligned question banks, full-length timed simulations, and precision performance diagnostics so you walk into your Prometric or Pearson test center with complete confidence.',
    highlights: [
      'Timed full-length mock simulations calibrated to official test durations and question counts',
      'Granular performance analytics across clinical sub-domains with weak-topic turnaround guidance',
      'Realistic computer-delivered interface replicating Prometric and Pearson VUE test environments',
      'Dedicated question banks for DHA, MOHAP, DOH (Abu Dhabi), SCFHS (Saudi), QCHP (Qatar), and OMSB (Oman)',
      'Detailed rationales and clinical explanations for every option to solidify medical concepts',
      'Retake and review modes allowing you to re-examine previously flagged or missed questions',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Select your target authority & specialty',
        desc: 'Choose from General Practitioner, Specialist, Registered Nurse, Clinical Pharmacist, Dentist, and Allied Health tracks.',
      },
      {
        step: '2',
        title: 'Complete timed exam simulations',
        desc: 'Test under real Prometric conditions with active countdown timers, question flagging, and realistic pass mark thresholds.',
      },
      {
        step: '3',
        title: 'Analyze diagnostic reports & master weak topics',
        desc: 'Review comprehensive scoring breakdowns, study evidence-based answer rationales, and track score progression over time.',
      },
    ],
    keyBenefits: [
      'Identical interface and pacing to real GCC computer-based testing',
      'Updated questions mirroring recent Prometric recall patterns',
      'Saves months of unfocused studying with targeted high-yield topics',
    ],
    authorities: ['DHA (Dubai)', 'MOHAP (UAE)', 'DOH (Abu Dhabi)', 'SCFHS (Saudi)', 'QCHP (Qatar)', 'OMSB (Oman)', 'NHRA (Bahrain)'],
    proTip:
      'Candidates who complete at least 5 full-length timed mocks achieve a 94%+ first-attempt pass rate across DHA and SCFHS exams.',
    ctas: [
      { label: 'Browse exam packages', to: '/packages', variant: 'primary' },
      { label: 'Create free account', to: '/register', variant: 'ghost' },
    ],
    relatedSlugs: ['exam-booking', 'eligibility-assessment', 'licensing-support'],
  },
  {
    slug: 'exam-booking',
    category: 'exams',
    navLabel: 'Exam booking assistance',
    title: 'Official licensing exam booking (Prometric & Pearson VUE)',
    kicker: 'Test day logistics',
    tag: 'Official support',
    icon: 'booking',
    stat: 'Prometric & Pearson',
    lede:
      'Arrange and secure your real computer-delivered licensing exam appointment through our integrated platform. Track exam dates, health authority eligibility numbers, payment verification, and pass documentation in one unified dashboard.',
    highlights: [
      'Official booking facilitation for Prometric and Pearson VUE test centers worldwide',
      'Self-service exam date scheduling and health authority credential entry with secure verification',
      'Automated alignment with your eligibility reference IDs and primary source verification records',
      'Dedicated applicant dashboard housing confirmation IDs, seat scheduling details, and printable passes',
      'Direct administrator verification and status notification upon official authority seat confirmation',
      'Built-in safeguards preventing premature exam booking before prerequisite DataFlow clearance',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Submit booking details & preferred test window',
        desc: 'Enter your authority eligibility number, preferred test location, date window, and national identity details.',
      },
      {
        step: '2',
        title: 'Verification & seat assignment',
        desc: 'Our licensing team verifies credentials with the target health authority and coordinates seat scheduling.',
      },
      {
        step: '3',
        title: 'Receive official confirmation & pass',
        desc: 'Access your official scheduling confirmation ID, test center instructions, and print-ready exam pass.',
      },
    ],
    keyBenefits: [
      'Eliminates confusion over complex authority booking portals',
      'Integrated payment and record tracking without third-party friction',
      'Direct support if rescheduling or eligibility updates are needed',
    ],
    authorities: ['DHA (Dubai)', 'MOHAP (UAE)', 'DOH (Abu Dhabi)', 'SCFHS (Saudi)', 'QCHP (Qatar)', 'OMSB (Oman)'],
    proTip:
      'Always ensure your primary source verification (DataFlow) report or eligibility letter is active before finalizing your Prometric booking date.',
    ctas: [
      { label: 'Register for booking', to: '/register', variant: 'primary' },
      { label: 'View packages & plans', to: '/packages', variant: 'ghost' },
    ],
    relatedSlugs: ['mock-exams', 'licensing-support', 'dataflow-psv'],
  },
  {
    slug: 'eligibility-assessment',
    category: 'licensing',
    navLabel: 'Eligibility assessment',
    title: 'Instant eligibility assessment & GCC pathway mapping',
    kicker: 'Pathway clarity',
    tag: 'Free instant tool',
    icon: 'eligibility',
    stat: '100% Free check',
    lede:
      'Determine your qualification readiness before committing months of study. Map your degrees, clinical years of experience, and home-country licenses to exact GCC regulatory criteria across UAE, Saudi Arabia, Qatar, and Oman.',
    highlights: [
      'Instant qualification scoring algorithm factoring degree type, internship duration, and post-grad experience',
      'Comprehensive pathway breakdown for DHA, MOHAP, DOH, SCFHS, and QCHP requirements',
      'Clear identification of prerequisite documents, good standing certificates, and logbooks needed',
      'Instant public checker available with zero registration required for fast initial feedback',
      'Persistent dashboard tracker for registered users to monitor document readiness step-by-step',
      'Actionable recommendations on whether you qualify as General Practitioner, Specialist, or Consultant',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Input professional qualifications',
        desc: 'Enter your medical/nursing/allied health degree, graduation country, and years of clinical practice.',
      },
      {
        step: '2',
        title: 'Select target GCC regulatory authorities',
        desc: 'Compare eligibility criteria simultaneously across DHA, MOHAP, DOH, SCFHS, QCHP, and OMSB.',
      },
      {
        step: '3',
        title: 'Receive immediate pathway report',
        desc: 'Get a clear verdict with specific required exams, experience exemptions, and document preparation lists.',
      },
    ],
    keyBenefits: [
      'Avoid costly mistakes applying to authorities where prerequisites are missing',
      'Discover fast-track licensing reciprocity across GCC regulatory bodies',
      'Save weeks of research with automated unified guidelines',
    ],
    authorities: ['DHA (Dubai)', 'MOHAP (UAE)', 'DOH (Abu Dhabi)', 'SCFHS (Saudi)', 'QCHP (Qatar)', 'OMSB (Oman)', 'NHRA (Bahrain)', 'MOH (Kuwait)'],
    proTip:
      'Most GCC authorities require a minimum of 2 continuous years of clinical experience post-internship for general healthcare titles.',
    ctas: [
      { label: 'Launch free eligibility check', to: '/eligibility-check', variant: 'primary' },
      { label: 'Create portal profile', to: '/register', variant: 'ghost' },
    ],
    relatedSlugs: ['dataflow-psv', 'licensing-support', 'mock-exams'],
  },
  {
    slug: 'dataflow-psv',
    category: 'licensing',
    navLabel: 'Dataflow & PSV guidance',
    title: 'Primary source verification (DataFlow PSV) support',
    kicker: 'Credential verification',
    tag: 'Essential step',
    icon: 'dataflow',
    stat: '100% PSV Aligned',
    lede:
      'Navigate Primary Source Verification (PSV) with precision. Get document readiness checklists, step sequencing guidance, and submission oversight to prevent verification delays from stalling your healthcare career.',
    highlights: [
      'Pre-verification document audits covering medical diplomas, official transcripts, and clinical experience letters',
      'Step-by-step submission sequencing to prevent costly re-verification or application rejections',
      'Verification protocols configured for DataFlow Group workflows across all GCC health authorities',
      'Guidance on Certificate of Good Standing (CGS) validity windows and issuing body requirements',
      'Cross-authority report transfer (TrueProfile) guidelines for multi-country job mobility',
      'Specialized assistance for international medical graduates navigating foreign document apostilles',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Upload documents for compliance check',
        desc: 'Submit scanned degrees, experience certificates, and valid home-country licenses for structural review.',
      },
      {
        step: '2',
        title: 'Initiate DataFlow case package',
        desc: 'Structure your application package according to the target authority’s exact DataFlow schema.',
      },
      {
        step: '3',
        title: 'Track verification milestones',
        desc: 'Monitor primary source outreach to your university, hospital employers, and medical licensing councils.',
      },
    ],
    keyBenefits: [
      'Prevents discrepant or negative DataFlow reports that ban GCC practice',
      'Streamlines issuing-authority contact details to accelerate verification',
      'Ensures seamless report portability across UAE, Saudi, and Qatar regulators',
    ],
    authorities: ['DHA (Dubai)', 'MOHAP (UAE)', 'DOH (Abu Dhabi)', 'SCFHS (Saudi)', 'QCHP (Qatar)', 'OMSB (Oman)', 'NHRA (Bahrain)'],
    proTip:
      'Ensure your Certificate of Good Standing (CGS) is issued within 3 to 6 months of your DataFlow submission, as older certificates will be rejected.',
    ctas: [
      { label: 'Start licensing & DataFlow service', to: '/services/licensing-dataflow', variant: 'primary' },
      { label: 'Check eligibility first', to: '/eligibility-check', variant: 'ghost' },
    ],
    relatedSlugs: ['licensing-support', 'eligibility-assessment', 'exam-booking'],
  },
  {
    slug: 'licensing-support',
    category: 'licensing',
    navLabel: 'Full licensing support',
    title: 'End-to-end licensing services from exam pass to clinical practice',
    kicker: 'From pass to practice',
    tag: 'Full service',
    icon: 'licensing',
    stat: 'End-to-End guidance',
    lede:
      'Seamlessly transition from passing your licensing exam to receiving your active practice permit. Our concierge licensing assistance coordinates regulatory submissions, authority approvals, and institutional credentialing.',
    highlights: [
      'End-to-end regulatory filing for DHA, MOHAP, DOH (HAAD), SCFHS Mumaris+, and QCHP',
      'Direct coordination for professional registration certificate issuance and eligibility letters',
      'Assistance with clinical logbook submissions, CME hour verifications, and specialization endorsements',
      'Guidance for healthcare facility licensing conversion upon securing a local hospital sponsor',
      'Multi-authority conversion roadmaps (e.g. converting a DHA license to DOH or MOHAP without re-examination)',
      'Dedicated compliance specialist monitoring your file through every regulatory stage',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Case assessment & file compilation',
        desc: 'We review your exam pass, positive DataFlow PSV report, and updated clinical credentials.',
      },
      {
        step: '2',
        title: 'Regulatory submission & tracking',
        desc: 'Your application is lodged directly on the official authority portal with compliance oversight.',
      },
      {
        step: '3',
        title: 'Issuance of Eligibility / License',
        desc: 'Receive your official license or Eligibility Letter ready for hospital recruitment and employment visas.',
      },
    ],
    keyBenefits: [
      'Zero paperwork headaches navigating complex foreign regulatory portals',
      'Expedited issuance by avoiding common procedural errors',
      'Complete clarity on license activation rules and renewal cycles',
    ],
    authorities: ['DHA (Dubai)', 'MOHAP (UAE)', 'DOH (Abu Dhabi)', 'SCFHS (Saudi Arabia)', 'QCHP (Qatar)', 'OMSB (Oman)'],
    proTip:
      'Once you obtain a DHA Eligibility Letter, you have up to 1 year to activate your full practice license through a recognized Dubai healthcare facility.',
    ctas: [
      { label: 'Request licensing assistance', to: '/services/licensing-dataflow', variant: 'primary' },
      { label: 'Explore preparation packages', to: '/packages', variant: 'ghost' },
    ],
    relatedSlugs: ['dataflow-psv', 'job-portal', 'mock-exams'],
  },
  {
    slug: 'job-portal',
    category: 'career',
    navLabel: 'Healthcare job portal',
    title: 'Exclusive GCC healthcare job portal for licensed professionals',
    kicker: 'Career placement',
    tag: 'Annual plan access',
    icon: 'jobs',
    stat: 'Direct GCC Recruiters',
    lede:
      'Connect directly with top hospitals, private clinics, diagnostic centers, and healthcare groups across the UAE, Saudi Arabia, Qatar, and Oman. Built specifically for candidates with verified credentials and exam passes.',
    highlights: [
      'Direct employer visibility for pre-verified and exam-ready healthcare professionals',
      'Specialized filtering by clinical department, GCC city, visa sponsorship, and health authority requirement',
      'One-click structured job applications with live status tracking from Reviewing to Interview & Offer',
      'Dedicated employer dashboard allowing accredited GCC medical centers to post openings and source candidates',
      'Integrated candidate profile highlighting your Prometric scores, DataFlow status, and license readiness',
      'Included seamlessly for candidates subscribed to eligible annual preparation packages',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Build your verified medical profile',
        desc: 'Complete your clinical profile, add your specialty, target authorities, and upload your CV.',
      },
      {
        step: '2',
        title: 'Discover verified hospital vacancies',
        desc: 'Filter openings by city (Dubai, Riyadh, Doha, Abu Dhabi), authority requirements, and contract types.',
      },
      {
        step: '3',
        title: 'Apply & communicate directly',
        desc: 'Track application milestones, receive interview invitations, and connect with healthcare hiring teams.',
      },
    ],
    keyBenefits: [
      'Skip generic job boards—reach recruiters who specifically look for exam-ready candidates',
      'Highlight your verified eligibility and high mock scores to stand out immediately',
      'Access both hospital staff roles and high-paying locum positions across the GCC',
    ],
    authorities: ['UAE Healthcare Facilities', 'KSA Medical Cities', 'Qatar Health Groups', 'Oman Hospitals'],
    proTip:
      'Candidates who have already passed their exam or obtained an Eligibility Letter receive 4x more interview requests from GCC employers.',
    ctas: [
      { label: 'Explore annual packages with job access', to: '/packages', variant: 'primary' },
      { label: 'Sign in to job portal', to: '/login', variant: 'ghost' },
    ],
    relatedSlugs: ['applicant-reels', 'mock-exams', 'licensing-support'],
  },
  {
    slug: 'applicant-reels',
    category: 'career',
    navLabel: 'Applicant video reels',
    title: 'Applicant video reels & dynamic healthcare profiles',
    kicker: 'Stand out to employers',
    tag: 'Recruiter magnet',
    icon: 'reels',
    stat: 'High-Impact Profiles',
    lede:
      'Elevate your job application with engaging short-form video introductions. Demonstrate your clinical communication, spoken fluency, and bedside manner directly to hospital hiring directors and clinical chairs.',
    highlights: [
      'Record or upload 60-90 second professional introduction reels highlighting clinical experience and bedside demeanor',
      'Showcase your English/Arabic medical communication skills to international recruitment panels',
      'Integrated directly with your job portal applications so recruiters can watch before scheduling calls',
      'Private, secure cloud hosting with strict recruiter-only viewing access controls',
      'Custom prompts and recording guidelines to help you deliver a polished, impactful presentation',
      'Boosts profile visibility and interview conversion rates by over 300%',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Follow our structured recording prompt',
        desc: 'Highlight your education, years in ICU/ER/OPD, surgical or ward specialties, and career motivation.',
      },
      {
        step: '2',
        title: 'Upload or record your short video',
        desc: 'Review and attach your reel directly to your candidate profile in the applicant dashboard.',
      },
      {
        step: '3',
        title: 'Get prioritized by hospital recruiters',
        desc: 'Recruiters reviewing job postings can instantly view your video introduction alongside your credentials.',
      },
    ],
    keyBenefits: [
      'Demonstrate clinical communication and language fluency upfront',
      'Dramatically accelerates interview turnaround times with hiring managers',
      'Personalizes your application far beyond a standard two-page resume',
    ],
    authorities: ['Private Hospital Groups', 'Government Medical Centers', 'Specialist Clinics'],
    proTip:
      'Keep your video between 60 and 90 seconds. Focus on your specific clinical procedures, patient communication style, and readiness to relocate.',
    ctas: [
      { label: 'Unlock reels with annual package', to: '/packages', variant: 'primary' },
      { label: 'Sign in to record', to: '/login', variant: 'ghost' },
    ],
    relatedSlugs: ['job-portal', 'mock-exams', 'licensing-support'],
  },
  {
    slug: 'plans-packages',
    category: 'plans',
    navLabel: 'Plans & packages',
    title: 'Flexible plans, comprehensive packages & feature entitlements',
    kicker: 'Choose your runway',
    tag: 'Flexible access',
    icon: 'packages',
    stat: '1 to 12 Months',
    lede:
      'Choose the ideal access window matching your licensing timeline. From intense 30-day exam sprints to comprehensive 12-month career packages including the full job portal and video reels.',
    highlights: [
      'Transparent pricing with zero hidden fees across monthly, quarterly, semi-annual, and annual plans',
      'Instant activation with unrestricted access to authority-aligned question banks upon enrollment',
      'Full package entitlements clearly mapped to mock exams, diagnostic scoring, and career placement tools',
      'Seamless upgrade pathways if your exam date moves or you require longer revision runway',
      'Exclusive annual plan bonuses including direct healthcare job portal access and applicant video reels',
      'Secure, encrypted checkout with instant receipt generation and invoice downloads',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Select your preparation timeline',
        desc: 'Choose from 1-month sprint, 3-month standard, 6-month thorough, or 12-month full career packages.',
      },
      {
        step: '2',
        title: 'Complete secure registration',
        desc: 'Create your candidate profile with your designated healthcare specialty and target authority.',
      },
      {
        step: '3',
        title: 'Immediate dashboard unlock',
        desc: 'Access your full question banks, timed mock engines, and diagnostic study tools instantaneously.',
      },
    ],
    keyBenefits: [
      'Flexible options tailored to every study schedule and budget',
      'Includes continuous question bank updates and guideline revisions',
      'Annual tiers provide complete end-to-end support until you are hired',
    ],
    authorities: ['All GCC Health Authorities Supported'],
    proTip:
      'The 6-month and 12-month packages offer the best value for candidates preparing for both primary source verification and computer-delivered licensing exams.',
    ctas: [
      { label: 'Browse all packages & pricing', to: '/packages', variant: 'primary' },
      { label: 'Register now', to: '/register', variant: 'ghost' },
    ],
    relatedSlugs: ['mock-exams', 'job-portal', 'eligibility-assessment'],
  },
];

const BY_SLUG = Object.fromEntries(FEATURE_PAGE_LIST.map((p) => [p.slug, p]));

export function getFeaturePage(slug) {
  return BY_SLUG[slug] || null;
}
