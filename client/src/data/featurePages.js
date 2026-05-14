/**
 * Public marketing copy for /features/* pages. Slugs are stable URLs.
 */

export const FEATURE_PAGE_LIST = [
  {
    slug: 'mock-exams',
    navLabel: 'Mock exams & prep',
    title: 'Preparation & mock licensing exams',
    kicker: 'Exam readiness',
    lede:
      'Authority-aligned question banks, full-length timed simulations, and performance reporting so you walk into Prometric- and Pearson-style delivery with fewer surprises.',
    highlights: [
      'Timed mocks that mirror computer-delivered licensing cadence',
      'Per-attempt insight for weak-topic targeting and revision plans',
      'Dashboard for exams, attempts, and progress in one place',
      'Coverage across DHA, MOHAP, DOH, SCFHS, QCHP, and related GCC pathways',
    ],
    ctas: [
      { label: 'View packages', to: '/packages', variant: 'primary' },
      { label: 'Create account', to: '/register', variant: 'ghost' },
    ],
    relatedSlugs: ['eligibility-assessment', 'licensing-support', 'exam-booking'],
  },
  {
    slug: 'exam-booking',
    navLabel: 'Exam booking',
    title: 'Official licensing exam booking (Prometric & Pearson)',
    kicker: 'Test day logistics',
    lede:
      'Arrange your real computer-delivered licensing exam through our platform—capture exam date, GCC health authority context, and applicant details in one place, complete checkout when your plan supports it, then keep confirmation IDs, status, and your exam pass on your profile alongside mock preparation.',
    highlights: [
      'Official Prometric- and Pearson-style delivery—not the timed mocks hosted on this site',
      'Self-service date and detail capture with secure payment where enabled; administrators can complete remaining fields',
      'Profile section for registration IDs, exam status, admin announcements, and print-friendly summaries when unlocked',
      'Designed to sit after eligibility and PSV work so booking does not collide with unfinished paperwork',
    ],
    ctas: [
      { label: 'Create account', to: '/register', variant: 'primary' },
      { label: 'Compare packages', to: '/packages', variant: 'ghost' },
    ],
    relatedSlugs: ['mock-exams', 'licensing-support', 'eligibility-assessment'],
  },
  {
    slug: 'job-portal',
    navLabel: 'Job portal',
    title: 'Healthcare job portal for licensed professionals',
    kicker: 'Career placement',
    lede:
      'Browse roles, follow structured applications, and connect with employers across the GCC—designed for applicants who are moving from exam success into active job search.',
    highlights: [
      'Role discovery with filters suited to healthcare hiring',
      'Application tracking so you know where each submission stands',
      'Employer workflows for posting roles and reviewing applicants',
      'Included on eligible annual plans—see packages for access details',
    ],
    ctas: [
      { label: 'See packages', to: '/packages', variant: 'primary' },
      { label: 'Sign in to portal', to: '/login', variant: 'ghost' },
    ],
    relatedSlugs: ['mock-exams', 'licensing-support', 'exam-booking'],
  },
  {
    slug: 'eligibility-assessment',
    navLabel: 'Eligibility assessment',
    title: 'Eligibility assessment & pathway mapping',
    kicker: 'Start with clarity',
    lede:
      'Understand regulator expectations before you commit months of study—map profession, education, and documentation readiness to the right GCC pathway.',
    highlights: [
      'Structured questions across pathway, education, and readiness',
      'Summary guidance to prioritise next steps',
      'Public checker available without an account',
      'Logged-in assessment for deeper tracking inside the portal',
    ],
    ctas: [
      { label: 'Try eligibility check', to: '/eligibility-check', variant: 'primary' },
      { label: 'Get started', to: '/register', variant: 'ghost' },
    ],
    relatedSlugs: ['dataflow-psv', 'mock-exams', 'exam-booking'],
  },
  {
    slug: 'licensing-support',
    navLabel: 'Licensing support',
    title: 'Licensing services & next steps after your exam',
    kicker: 'From pass to practice',
    lede:
      'Practical guidance for completing licensing steps across the region—so you know what comes after the exam instead of piecing together fragmented checklists.',
    highlights: [
      'Checklist-style thinking for UAE, KSA, Qatar, Oman, Bahrain, and Kuwait contexts',
      'Aligned with how applicants move from eligibility through to active licensure',
      'Complements mock preparation—not a substitute for regulator rules you must verify',
      'Supports nurses, physicians, dentists, pharmacy, allied health, and more',
    ],
    ctas: [
      { label: 'Start licensing / Dataflow request', to: '/services/licensing-dataflow', variant: 'primary' },
      { label: 'Explore packages', to: '/packages', variant: 'ghost' },
    ],
    relatedSlugs: ['dataflow-psv', 'mock-exams', 'exam-booking'],
  },
  {
    slug: 'dataflow-psv',
    navLabel: 'Dataflow & PSV',
    title: 'Dataflow & primary source verification (PSV)',
    kicker: 'Credential verification',
    lede:
      'Guidance on document checklists, submission order, and what to expect during PSV—so paperwork delays do not quietly erase your exam window.',
    highlights: [
      'Checklist mindset for transcripts, registrations, and experience evidence',
      'Sequencing tips to avoid rework and back-and-forth with verifiers',
      'Framed for Gulf health-authority workflows commonly paired with licensing',
      'Works alongside eligibility assessment and exam preparation',
    ],
    ctas: [
      { label: 'Licensing / Dataflow service', to: '/services/licensing-dataflow', variant: 'primary' },
      { label: 'Start eligibility check', to: '/eligibility-check', variant: 'ghost' },
    ],
    relatedSlugs: ['eligibility-assessment', 'licensing-support', 'exam-booking'],
  },
  {
    slug: 'applicant-reels',
    navLabel: 'Applicant reels',
    title: 'Applicant reels & short-form profiles',
    kicker: 'Stand out to employers',
    lede:
      'Show your communication strengths and career story in a format hiring teams scan quickly—paired with the job portal on eligible plans.',
    highlights: [
      'Short reels to complement CV-style applications',
      'Designed for healthcare applicants entering GCC markets',
      'Connects with employer discovery in the job portal',
      'Access tied to annual job portal eligibility—confirm on packages',
    ],
    ctas: [
      { label: 'View packages', to: '/packages', variant: 'primary' },
      { label: 'Sign in', to: '/login', variant: 'ghost' },
    ],
    relatedSlugs: ['job-portal', 'mock-exams', 'exam-booking'],
  },
  {
    slug: 'plans-packages',
    navLabel: 'Plans & packages',
    title: 'Plans, packages & entitlements',
    kicker: 'Choose your runway',
    lede:
      'Pick the access window that matches your exam date—monthly through annual options—with clear feature lines for mocks, job tools, and add-ons.',
    highlights: [
      'Transparent catalog for portal access duration',
      'Checkout integrated where configured',
      'Feature lines aligned with mocks, eligibility, and job tools',
      'Upgrade path when you need longer runway to exam day',
    ],
    ctas: [
      { label: 'Browse packages', to: '/packages', variant: 'primary' },
      { label: 'Register', to: '/register', variant: 'ghost' },
    ],
    relatedSlugs: ['mock-exams', 'exam-booking', 'eligibility-assessment'],
  },
];

const BY_SLUG = Object.fromEntries(FEATURE_PAGE_LIST.map((p) => [p.slug, p]));

export function getFeaturePage(slug) {
  return BY_SLUG[slug] || null;
}
