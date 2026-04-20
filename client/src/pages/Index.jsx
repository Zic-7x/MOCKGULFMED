import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import logoUrl from '../image/Gemini_Generated_Image_wtgqj3wtgqj3wtgq-removebg-preview.png';
import './Index.css';

const STATUS_ROTATIONS = [
  { name: 'Dr. Amira K.', goal: 'SCFHS Prometric readiness' },
  { name: 'Hassan M.', goal: 'DHA clinical simulation pass' },
  { name: 'Priya S.', goal: 'MOHAP question bank mastery' },
  { name: 'Omar R.', goal: 'Pearson VUE pacing target' },
  { name: 'Layla F.', goal: 'OMSB weak-topic turnaround' },
];

const GCC_HEALTH_AUTHORITIES = [
  { abbr: 'MOHAP', line: 'Ministry of Health & Prevention — UAE' },
  { abbr: 'DHA', line: 'Dubai Health Authority' },
  { abbr: 'DOH', line: 'Department of Health — Abu Dhabi' },
  { abbr: 'SCFHS', line: 'Saudi Commission for Health Specialties' },
  { abbr: 'MOPH', line: 'Ministry of Public Health — Qatar' },
  { abbr: 'MOH Oman', line: 'Ministry of Health — Oman' },
  { abbr: 'HAAD', line: 'Health Authority Abu Dhabi' },
  { abbr: 'MOH Kuwait', line: 'Ministry of Health — Kuwait' },
  { abbr: 'NHRA', line: 'National Health Regulatory Authority — Bahrain' },
];

function ShieldCheckIcon({ className }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ProfessionIcon({ type, color }) {
  const common = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (type) {
    case 'heart':
      return (
        <svg {...common}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
        </svg>
      );
    case 'pill':
      return (
        <svg {...common}>
          <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
          <path d="m8.5 8.5 7 7" />
        </svg>
      );
    case 'stethoscope':
      return (
        <svg {...common}>
          <path d="M11 2v2" />
          <path d="M5 2v2" />
          <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
          <path d="M8 15a6 6 0 0 0 12 0v-3" />
          <circle cx="20" cy="10" r="2" />
        </svg>
      );
    case 'smile':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" x2="9.01" y1="9" y2="9" />
          <line x1="15" x2="15.01" y1="9" y2="9" />
        </svg>
      );
    case 'activity':
      return (
        <svg {...common}>
          <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
        </svg>
      );
    case 'flask':
      return (
        <svg {...common}>
          <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
          <path d="M8.5 2h7" />
          <path d="M7 16h10" />
        </svg>
      );
    case 'microscope':
      return (
        <svg {...common}>
          <path d="M6 18h8" />
          <path d="M3 22h18" />
          <path d="M14 22a7 7 0 1 0 0-14h-1" />
          <path d="M9 14h2" />
          <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
          <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...common}>
          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

const PROFESSION_CHIPS = [
  { label: 'Nursing', border: 'rgba(225, 29, 72, 0.145)', bg: 'rgba(225, 29, 72, 0.03)', iconBg: 'rgba(225, 29, 72, 0.094)', color: 'rgb(225, 29, 72)', icon: 'heart' },
  { label: 'Pharmacy', border: 'rgba(5, 150, 105, 0.145)', bg: 'rgba(5, 150, 105, 0.03)', iconBg: 'rgba(5, 150, 105, 0.094)', color: 'rgb(5, 150, 105)', icon: 'pill' },
  { label: 'Medicine', border: 'rgba(37, 99, 235, 0.145)', bg: 'rgba(37, 99, 235, 0.03)', iconBg: 'rgba(37, 99, 235, 0.094)', color: 'rgb(37, 99, 235)', icon: 'stethoscope' },
  { label: 'Dentistry', border: 'rgba(217, 119, 6, 0.145)', bg: 'rgba(217, 119, 6, 0.03)', iconBg: 'rgba(217, 119, 6, 0.094)', color: 'rgb(217, 119, 6)', icon: 'smile' },
  { label: 'Allied Health', border: 'rgba(124, 58, 237, 0.145)', bg: 'rgba(124, 58, 237, 0.03)', iconBg: 'rgba(124, 58, 237, 0.094)', color: 'rgb(124, 58, 237)', icon: 'activity' },
  { label: 'Laboratory', border: 'rgba(8, 145, 178, 0.145)', bg: 'rgba(8, 145, 178, 0.03)', iconBg: 'rgba(8, 145, 178, 0.094)', color: 'rgb(8, 145, 178)', icon: 'flask' },
  { label: 'Microbiology', border: 'rgba(13, 148, 136, 0.145)', bg: 'rgba(13, 148, 136, 0.03)', iconBg: 'rgba(13, 148, 136, 0.094)', color: 'rgb(13, 148, 136)', icon: 'microscope' },
  { label: 'Ophthalmology', border: 'rgba(2, 132, 199, 0.145)', bg: 'rgba(2, 132, 199, 0.03)', iconBg: 'rgba(2, 132, 199, 0.094)', color: 'rgb(2, 132, 199)', icon: 'eye' },
];

const STATS = [
  { id: 's1', value: 98, suffix: '%', label: 'Reported confidence after structured mocks' },
  { id: 's2', value: 8, suffix: '', label: 'Gulf licensing pathways supported' },
  { id: 's3', value: 24, suffix: '/7', label: 'Access window for focused practice' },
  { id: 's4', value: 10000, suffix: '+', label: 'Practice attempts supported on the platform' },
];

const SERVICES = [
  {
    title: 'Comprehensive banks',
    body: 'High-volume items aligned with Gulf competency domains for SCFHS through MOH.',
  },
  {
    title: 'Timed simulations',
    body: 'Full-length mocks with timers and navigation that mirror real test-day pressure.',
  },
  {
    title: 'Performance reporting',
    body: 'Per-attempt insight so you know what to revisit before your licensing date.',
  },
  {
    title: 'Personal dashboard',
    body: 'One place for exams, attempts, and progress—no hunting through scattered screens.',
  },
  {
    title: 'Prometric-style flow',
    body: 'Practice the cadence and UI patterns common to computer-delivered licensing exams.',
  },
  {
    title: 'Pearson VUE alignment',
    body: 'Build familiarity with alternate delivery patterns used across several pathways.',
  },
  {
    title: 'Weak-topic targeting',
    body: 'Turn summaries into focused drills instead of repeating what you already know.',
  },
  {
    title: 'Attempt history',
    body: 'See improvement over weeks, not just a single score snapshot.',
  },
  {
    title: 'Friction-free workflow',
    body: 'Sign in, pick an exam, submit, review—predictable steps that protect deep work.',
  },
];

const PATHWAY = [
  {
    phase: '1',
    title: 'Orient',
    body: 'Create your account and land on a dashboard that surfaces what to do next.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
        />
      </svg>
    ),
  },
  {
    phase: '2',
    title: 'Practice',
    body: 'Run timed mocks and topic drills built to remove surprises on exam day.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
        />
      </svg>
    ),
  },
  {
    phase: '3',
    title: 'Analyze',
    body: 'Review results, spot weak areas, and plan the next cycle in minutes—not days.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" />
      </svg>
    ),
  },
  {
    phase: '4',
    title: 'Repeat',
    body: 'Iterate until your metrics stabilize—speed to result without burning study time.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.56 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
        />
      </svg>
    ),
  },
];

const HIW_CURVE_PATH =
  'M112.891 97.7022C140.366 97.0802 171.004 94.6715 201.087 87.5116C210.43 85.2881 219.615 82.6412 228.284 78.2473C232.198 76.3179 235.905 73.9942 239.348 71.3124C241.85 69.2557 243.954 66.7571 245.555 63.9408C249.34 57.3235 248.281 50.5341 242.498 45.6109C239.033 42.7237 235.228 40.2703 231.169 38.3054C219.443 32.7209 207.141 28.4382 194.482 25.534C184.013 23.1927 173.358 21.7755 162.64 21.2989C161.376 21.3512 160.113 21.181 158.908 20.796C158.034 20.399 156.857 19.1682 156.962 18.4535C157.115 17.8927 157.381 17.3689 157.743 16.9139C158.104 16.4588 158.555 16.0821 159.067 15.8066C160.14 15.4683 161.274 15.3733 162.389 15.5286C179.805 15.3566 196.626 18.8373 212.998 24.462C220.978 27.2494 228.798 30.4747 236.423 34.1232C240.476 36.1159 244.202 38.7131 247.474 41.8258C254.342 48.2578 255.745 56.9397 251.841 65.4892C249.793 69.8582 246.736 73.6777 242.921 76.6327C236.224 82.0192 228.522 85.4602 220.502 88.2924C205.017 93.7847 188.964 96.9081 172.738 99.2109C153.442 101.949 133.993 103.478 114.506 103.79C91.1468 104.161 67.9334 102.97 45.1169 97.5831C36.0094 95.5616 27.2626 92.1655 19.1771 87.5116C13.839 84.5746 9.1557 80.5802 5.41318 75.7725C-0.54238 67.7259 -1.13794 59.1763 3.25594 50.2827C5.82447 45.3918 9.29572 41.0315 13.4863 37.4319C24.2989 27.5721 37.0438 20.9681 50.5431 15.7272C68.1451 8.8849 86.4883 5.1395 105.175 2.83669C129.045 0.0992292 153.151 0.134761 177.013 2.94256C197.672 5.23215 218.04 9.01724 237.588 16.3889C240.089 17.3418 242.498 18.5197 244.933 19.6446C246.627 20.4387 247.725 21.6695 246.997 23.615C246.455 25.1105 244.814 25.5605 242.63 24.5811C230.322 18.9961 217.233 16.1904 204.117 13.4376C188.761 10.3438 173.2 8.36665 157.558 7.52174C129.914 5.70776 102.154 8.06792 75.2124 14.5228C60.6177 17.8788 46.5758 23.2977 33.5102 30.6161C26.6595 34.3329 20.4123 39.0673 14.9818 44.658C12.9433 46.8071 11.1336 49.1622 9.58207 51.6855C4.87056 59.5336 5.61172 67.2494 11.9246 73.7608C15.2064 77.0494 18.8775 79.925 22.8564 82.3236C31.6176 87.7101 41.3848 90.5291 51.3902 92.5804C70.6068 96.5773 90.0219 97.7419 112.891 97.7022Z';

const HERO_HEADLINE_ACCENTS = [
  'Exam Preparation',
  'Healthcare Licensing',
  'Job Placement',
  'Career Growth',
];

const TESTIMONIALS = [
  {
    name: 'Dr. Sarah Khan',
    avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
    route: '🇵🇰 Pakistan → 🇦🇪 UAE',
    handle: '@sarahkhan',
    text: 'Got my DHA license in just 6 weeks. The Dataflow processing was handled completely by MockGulfMed — stress-free!',
  },
  {
    name: 'Nurse Maria Santos',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    route: '🇵🇭 Philippines → 🇸🇦 KSA',
    handle: '@mariasantos',
    text: 'Passed my MOH exam on the first attempt thanks to the mock exams and study materials. Absolutely worth it.',
  },
  {
    name: 'Dr. Ahmed Al-Rashid',
    avatar: 'https://randomuser.me/api/portraits/men/51.jpg',
    route: '🇪🇬 Egypt → 🇦🇪 UAE',
    handle: '@ahmedalrashid',
    text: 'MockGulfMed placed me with a top hospital in Abu Dhabi within 3 weeks of getting my DOH license. Incredible service.',
  },
  {
    name: 'Pharmacist Priya Nair',
    avatar: 'https://randomuser.me/api/portraits/women/53.jpg',
    route: '🇮🇳 India → 🇦🇪 UAE',
    handle: '@priyanair',
    text: 'The study assistant answered every question about my syllabus instantly. My preparation was so much more focused.',
  },
  {
    name: 'Dr. James Okafor',
    avatar: 'https://randomuser.me/api/portraits/men/33.jpg',
    route: '🇳🇬 Nigeria → 🇶🇦 Qatar',
    handle: '@jamesokafor',
    text: 'Document verification that usually takes months was completed in 3 weeks. The team is professional and responsive.',
  },
  {
    name: 'Nurse Fatima Al-Hassan',
    avatar: 'https://randomuser.me/api/portraits/women/45.jpg',
    route: '🇯🇴 Jordan → 🇸🇦 KSA',
    handle: '@fatimaalhassan',
    text: 'The live dashboard kept me updated on every step of my licensing progress. No more chasing emails!',
  },
  {
    name: 'Dr. Ravi Sharma',
    avatar: 'https://randomuser.me/api/portraits/men/61.jpg',
    route: '🇮🇳 India → 🇦🇪 UAE',
    handle: '@ravisharma',
    text: 'From credential check to exam booking, MockGulfMed handled everything. I just focused on studying.',
  },
  {
    name: 'Physiotherapist Lena Müller',
    avatar: 'https://randomuser.me/api/portraits/women/22.jpg',
    route: '🇩🇪 Germany → 🇦🇪 UAE',
    handle: '@lenamuller',
    text: '98% pass rate is no joke — the Prometric mock exams matched the real exam format perfectly.',
  },
  {
    name: 'Dr. Omar Khalil',
    avatar: 'https://randomuser.me/api/portraits/men/85.jpg',
    route: '🇸🇩 Sudan → 🇸🇦 KSA',
    handle: '@omarkhalil',
    text: 'Best investment I made for my career. Got SCFHS licensed and placed at a hospital in Riyadh within 2 months.',
  },
];

function TestimonialCardMobile({ t }) {
  return (
    <article className="index-test-card index-test-card--sm">
      <div className="index-test-card-head">
        <span className="index-test-avatar">
          <img src={t.avatar} alt="" loading="lazy" decoding="async" width={32} height={32} />
        </span>
        <div className="index-test-card-meta">
          <span className="index-test-name">{t.name}</span>
          <span className="index-test-route">{t.route}</span>
        </div>
      </div>
      <p className="index-test-quote">{t.text}</p>
    </article>
  );
}

function TestimonialCardDesktop({ t }) {
  return (
    <article className="index-test-card index-test-card--lg">
      <div className="index-test-card-head">
        <span className="index-test-avatar">
          <img src={t.avatar} alt="" loading="lazy" decoding="async" width={32} height={32} />
        </span>
        <div className="index-test-card-meta">
          <span className="index-test-name">{t.name}</span>
          <span className="index-test-handle">{t.handle}</span>
        </div>
      </div>
      <p className="index-test-quote index-test-quote--lg">{t.text}</p>
      <p className="index-test-route-foot">{t.route}</p>
    </article>
  );
}

function MarqueeHorizontal({ items, durationSec, reverse, renderItem }) {
  return (
    <div
      className={`index-marquee-h ${reverse ? 'index-marquee-h--reverse' : ''}`}
      style={{ '--marquee-duration': `${durationSec}s` }}
      role="presentation"
    >
      <div className="index-marquee-h-track">
        <div className="index-marquee-h-half">{items.map((item, i) => renderItem(item, `mh1-${i}`))}</div>
        <div className="index-marquee-h-half" aria-hidden="true">
          {items.map((item, i) => renderItem(item, `mh2-${i}`))}
        </div>
      </div>
    </div>
  );
}

function MarqueeVertical({ items, durationSec, reverse, className, renderItem }) {
  return (
    <div
      className={`index-marquee-v ${reverse ? 'index-marquee-v--reverse' : ''} ${className || ''}`}
      style={{ '--marquee-duration': `${durationSec}s` }}
      role="presentation"
    >
      <div className="index-marquee-v-track">
        <div className="index-marquee-v-half">{items.map((item, i) => renderItem(item, `mv1-${i}`))}</div>
        <div className="index-marquee-v-half" aria-hidden="true">
          {items.map((item, i) => renderItem(item, `mv2-${i}`))}
        </div>
      </div>
    </div>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function useInViewOnce(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: options.threshold ?? 0.12, rootMargin: options.rootMargin ?? '0px 0px -8% 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [options.threshold, options.rootMargin]);
  return [ref, inView];
}

function StatCell({ stat, reducedMotion }) {
  const [ref, inView] = useInViewOnce({ threshold: 0.2 });
  const [display, setDisplay] = useState(reducedMotion ? stat.value : 0);

  useEffect(() => {
    if (!inView) return undefined;
    if (reducedMotion) {
      setDisplay(stat.value);
      return undefined;
    }
    const duration = 1400;
    const start = performance.now();
    const to = stat.value;
    let raf;
    let cancelled = false;
    const tick = (now) => {
      if (cancelled) return;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [inView, reducedMotion, stat.value]);

  const formatted =
    stat.value >= 1000 ? display.toLocaleString() : String(display);

  return (
    <div ref={ref} className="index-stat-cell index-glass">
      <div className="index-stat-value" aria-live="polite">
        {formatted}
        {stat.suffix}
      </div>
      <p className="index-stat-label">{stat.label}</p>
    </div>
  );
}

const Index = () => {
  const reducedMotion = usePrefersReducedMotion();
  const [navSolid, setNavSolid] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('mockgulfmed-index-theme');
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {
      /* ignore */
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [statusIdx, setStatusIdx] = useState(0);
  const [heroHeadlineIdx, setHeroHeadlineIdx] = useState(0);

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('mockgulfmed-index-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const id = window.setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUS_ROTATIONS.length);
    }, 4200);
    return () => clearInterval(id);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const id = window.setInterval(() => {
      setHeroHeadlineIdx((i) => (i + 1) % HERO_HEADLINE_ACCENTS.length);
    }, 5200);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  useEffect(() => {
    const nodes = document.querySelectorAll('.index-reveal');
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('index-reveal--visible');
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -5% 0px' }
    );
    nodes.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, []);

  const pageClass = `index-page index-page--${theme}`;

  return (
    <div className={pageClass}>
      <a className="index-skip" href="#main-content">
        Skip to content
      </a>

      <header
        className={`index-nav ${navSolid ? 'index-nav--solid' : ''}`}
        role="banner"
      >
        <div className="index-nav-inner">
          <Link className="index-nav-brand" to="/">
            <img className="index-nav-logo" src={logoUrl} alt="" />
            <span className="index-nav-title">MockGulfMed</span>
          </Link>

          <nav className="index-nav-actions" aria-label="Primary">
            <button
              type="button"
              className="index-icon-btn"
              onClick={toggleTheme}
              aria-pressed={theme === 'dark'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <span className="index-icon-btn-icon" aria-hidden="true">
                  ☀️
                </span>
              ) : (
                <span className="index-icon-btn-icon" aria-hidden="true">
                  🌙
                </span>
              )}
            </button>
            <Link className="index-btn index-btn--ghost" to="/packages">
              Packages
            </Link>
            <Link className="index-btn index-btn--primary" to="/login">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <section className="index-hero index-hero--immersive" aria-label="Introduction">
        <div className="index-hero-bg" aria-hidden="true">
          <img
            className="index-hero-bg-img"
            src="/assets/hero-dubai-healthcare-team.png"
            alt=""
            fetchPriority="high"
            decoding="async"
          />
          <div className="index-hero-bg-dark" />
          <div className="index-hero-bg-grad-r" />
          <div className="index-hero-bg-grad-t" />
        </div>
        <div className="index-hero-grid-pattern" aria-hidden="true" />

        <div className="index-hero-shell">
          <div className="index-hero-row">
            <div className="index-hero-copy">
              <div className="index-hero-badge">
                <span className="index-hero-badge-ping" aria-hidden="true">
                  <span className="index-hero-badge-ping-ring" />
                  <span className="index-hero-badge-ping-dot" />
                </span>
                <span>#1 healthcare licensing prep platform in the GCC</span>
              </div>

              <h1
                className="index-hero-title"
                aria-label={`Your Path to ${HERO_HEADLINE_ACCENTS[heroHeadlineIdx]} Starts Here.`}
              >
                <span className="index-hero-title-line">Your Path to</span>
                <br />
                <span className="index-hero-title-line2">
                  <span className="index-hero-title-accent-stack" aria-hidden="true">
                    {HERO_HEADLINE_ACCENTS.map((line, i) => (
                      <span
                        key={line}
                        className={`index-hero-title-accent ${
                          (reducedMotion ? 0 : heroHeadlineIdx) === i ? 'index-hero-title-accent--on' : ''
                        }`}
                      >
                        {line}
                      </span>
                    ))}
                  </span>
                  <span className="index-hero-title-line"> Starts Here.</span>
                </span>
              </h1>

              <p className="index-hero-lede">
                From eligibility checks to exam day—MockGulfMed helps healthcare professionals practise
                with realistic Gulf licensing mocks across the UAE &amp; GCC.
              </p>

              <div className="index-hero-cta">
                <Link to="/register" className="index-hero-cta-primary">
                  <span className="index-hero-metal-glow" aria-hidden="true" />
                  <span className="index-hero-metal-bloom" aria-hidden="true" />
                  <span className="index-hero-metal-body">
                    <span className="index-hero-metal-shine" aria-hidden="true" />
                    <span className="index-hero-metal-top" aria-hidden="true" />
                    <span className="index-hero-metal-label">
                      Start your journey
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </span>
                  </span>
                </Link>

                <Link to="/packages" className="index-hero-cta-secondary">
                  <span className="index-hero-cta-secondary-inner">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <polygon points="6 3 20 12 6 21 6 3" />
                    </svg>
                    Explore packages
                  </span>
                </Link>
              </div>
            </div>

            <div className="index-hero-viz" aria-hidden="false">
              <div className="index-hero-viz-inner">
                <div className="index-hero-glass">
                  <div className="index-hero-glass-shine" aria-hidden="true" />
                  <div className="index-hero-glass-blob index-hero-glass-blob--tr" aria-hidden="true" />
                  <div className="index-hero-glass-blob index-hero-glass-blob--bl" aria-hidden="true" />

                  <div className="index-hero-glass-head">
                    <div className="index-hero-avatars">
                      <img src="/assets/doctor-1-B-Z_S-PB.jpg" alt="" loading="lazy" decoding="async" />
                      <img src="/assets/doctor-2-BRymFCbj.jpg" alt="" loading="lazy" decoding="async" />
                      <img src="/assets/doctor-3-BH4S2aG1.jpg" alt="" loading="lazy" decoding="async" />
                    </div>
                    <div>
                      <p className="index-hero-glass-kicker">10k+ professionals</p>
                      <p className="index-hero-glass-sub">Preparing across the GCC</p>
                    </div>
                    <div className="index-hero-glass-live">
                      <span className="index-hero-glass-live-dot" />
                    </div>
                  </div>

                  <div className="index-hero-mini-stats">
                    <div className="index-hero-mini-stat">
                      <div className="index-hero-mini-ic">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
                          <circle cx="12" cy="8" r="6" />
                        </svg>
                      </div>
                      <div>
                        <p className="index-hero-mini-val">98%</p>
                        <p className="index-hero-mini-lbl">Pass rate</p>
                      </div>
                    </div>
                    <div className="index-hero-mini-stat">
                      <div className="index-hero-mini-ic index-hero-mini-ic--sky">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      <div>
                        <p className="index-hero-mini-val">10k+</p>
                        <p className="index-hero-mini-lbl">Attempts</p>
                      </div>
                    </div>
                    <div className="index-hero-mini-stat">
                      <div className="index-hero-mini-ic index-hero-mini-ic--amber">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                          <path d="M2 12h20" />
                        </svg>
                      </div>
                      <div>
                        <p className="index-hero-mini-val">6</p>
                        <p className="index-hero-mini-lbl">GCC countries</p>
                      </div>
                    </div>
                    <div className="index-hero-mini-stat">
                      <div className="index-hero-mini-ic index-hero-mini-ic--violet">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                        </svg>
                      </div>
                      <div>
                        <p className="index-hero-mini-val">4.9★</p>
                        <p className="index-hero-mini-lbl">Rating</p>
                      </div>
                    </div>
                  </div>

                  <div className="index-hero-feed">
                    <div className="index-hero-feed-ic">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                    <div className="index-hero-feed-text">
                      <p className="index-hero-feed-title" key={statusIdx}>
                        {STATUS_ROTATIONS[statusIdx].name} — {STATUS_ROTATIONS[statusIdx].goal}
                      </p>
                      <p className="index-hero-feed-meta">Live activity · MockGulfMed</p>
                    </div>
                    <span className="index-hero-feed-tag">New</span>
                  </div>
                </div>

                <div className="index-hero-float index-hero-float--tr">
                  <p className="index-hero-float-title">Aligned with</p>
                  <p className="index-hero-float-sub">DHA · DOH · MOH · SCFHS</p>
                </div>
                <div className="index-hero-float index-hero-float--bl">
                  <p className="index-hero-float-title">Prep on your schedule</p>
                  <p className="index-hero-float-sub">⚡ 24/7 portal access</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="index-authorities index-reveal" aria-label="GCC health authorities">
        <div className="index-authorities-head">
          <p className="index-authorities-label">
            Recognised &amp; aligned with leading GCC health authorities
          </p>
        </div>
        <div className="index-authorities-viewport">
          <div className="index-authorities-fade index-authorities-fade--left" aria-hidden="true" />
          <div className="index-authorities-fade index-authorities-fade--right" aria-hidden="true" />
          <div className="index-authorities-track">
            {[...GCC_HEALTH_AUTHORITIES, ...GCC_HEALTH_AUTHORITIES, ...GCC_HEALTH_AUTHORITIES].map((a, i) => (
              <div key={`${a.abbr}-${i}`} className="index-authority-card">
                <div className="index-authority-icon" aria-hidden="true">
                  <ShieldCheckIcon className="index-authority-shield" />
                </div>
                <div className="index-authority-text">
                  <p className="index-authority-abbr">{a.abbr}</p>
                  <p className="index-authority-full">{a.line}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main id="main-content" className="index-main">
        <section
          className="index-section index-hiw index-reveal"
          id="how-it-works"
          aria-labelledby="index-hiw-heading"
        >
          <div className="index-hiw-inner">
            <div className="index-hiw-intro">
              <div className="index-hiw-pill">How it works</div>
              <h2 id="index-hiw-heading" className="index-hiw-title">
                From application to
                <br />
                <span className="index-hiw-title-gradient">Licensed in 4 steps</span>
              </h2>
              <p className="index-hiw-lead">
                Our structured approach helps healthcare professionals prepare for Gulf licensing exams with
                clarity—covering eligibility through exam readiness across the GCC.
              </p>
            </div>

            <div className="index-hiw-grid">
              <article className="index-hiw-card index-hiw-card--stat index-glass">
                <div className="index-hiw-stat-inner">
                  <div className="index-hiw-stat-visual" aria-hidden="true">
                    <svg className="index-hiw-curve" viewBox="0 0 254 104" fill="none">
                      <path d={HIW_CURVE_PATH} fill="currentColor" />
                    </svg>
                    <span className="index-hiw-stat-number">98%</span>
                  </div>
                  <h3 className="index-hiw-stat-heading">Exam pass rate</h3>
                  <p className="index-hiw-stat-text">
                    Authority-aligned practice and mock exams behind strong outcomes across DHA, MOH, SCFHS,
                    and more.
                  </p>
                </div>
              </article>

              <article className="index-hiw-card index-hiw-card--step index-glass index-hiw-step--a">
                <div className="index-hiw-icon-wrap index-hiw-icon-wrap--primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                    <path d="M4.268 21a2 2 0 0 0 1.727 1H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" />
                    <path d="m9 18-1.5-1.5" />
                    <circle cx="5" cy="14" r="3" />
                  </svg>
                </div>
                <div className="index-hiw-step-head">
                  <span className="index-hiw-step-badge index-hiw-step-badge--primary">1</span>
                  <h3 className="index-hiw-step-title">Eligibility assessment</h3>
                </div>
                <p className="index-hiw-step-body">
                  We help you understand requirements for GCC authorities—DHA, MOH, DOH, SCFHS, QCHP—and map
                  your licensing pathway before you invest months of study.
                </p>
              </article>

              <article className="index-hiw-card index-hiw-card--step index-glass index-hiw-step--b">
                <div className="index-hiw-icon-wrap index-hiw-icon-wrap--accent">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div className="index-hiw-step-head">
                  <span className="index-hiw-step-badge index-hiw-step-badge--accent">2</span>
                  <h3 className="index-hiw-step-title">Dataflow &amp; PSV</h3>
                </div>
                <p className="index-hiw-step-body">
                  Guidance on primary source verification workflows—document checklist, submission order, and
                  what to expect—so paperwork does not derail your timeline.
                </p>
              </article>

              <article className="index-hiw-card index-hiw-card--step index-hiw-card--wide index-glass index-hiw-step--c">
                <div className="index-hiw-icon-wrap index-hiw-icon-wrap--gold">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 7v14" />
                    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
                  </svg>
                </div>
                <div className="index-hiw-step-head">
                  <span className="index-hiw-step-badge index-hiw-step-badge--gold">3</span>
                  <h3 className="index-hiw-step-title">Exam preparation</h3>
                </div>
                <p className="index-hiw-step-body">
                  Authority-specific question banks, full-length mocks, and progress tracking—built to reduce
                  surprises on exam day.
                </p>
                <div className="index-hiw-tags">
                  {['DHA', 'MOH', 'DOH', 'SCFHS', 'QCHP', 'Pearson'].map((tag) => (
                    <span key={tag} className="index-hiw-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>

              <article className="index-hiw-card index-hiw-card--step index-hiw-card--wide index-glass index-hiw-step--d">
                <div className="index-hiw-icon-wrap index-hiw-icon-wrap--primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    <rect width="20" height="14" x="2" y="6" rx="2" />
                  </svg>
                </div>
                <div className="index-hiw-step-head">
                  <span className="index-hiw-step-badge index-hiw-step-badge--primary">4</span>
                  <h3 className="index-hiw-step-title">Licensing &amp; next steps</h3>
                </div>
                <p className="index-hiw-step-body">
                  After your exam, know how to complete licensing steps and pursue roles across the
                  region—with a clear checklist instead of guesswork.
                </p>
                <div className="index-hiw-region">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    <path d="M2 12h20" />
                  </svg>
                  <span>UAE · Saudi Arabia · Qatar · Oman · Bahrain · Kuwait</span>
                </div>
              </article>

              <div className="index-hiw-card index-hiw-card--cta index-glass">
                <div className="index-hiw-cta-row">
                  <div className="index-hiw-cta-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="index-hiw-cta-title">Join professionals preparing with structure</h3>
                    <p className="index-hiw-cta-sub">
                      Create your account and start with packages built for Gulf licensing pathways.
                    </p>
                  </div>
                  <Link className="index-hiw-cta-btn" to="/register">
                    Start your journey
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="index-section index-section--alt index-reveal" aria-label="Impact at a glance">
          <div className="index-section-head">
            <h2>Outcomes that compound</h2>
            <p>Numbers applicants care about—confidence, coverage, access, and volume.</p>
          </div>
          <div className="index-stats">
            {STATS.map((s) => (
              <StatCell key={s.id} stat={s} reducedMotion={reducedMotion} />
            ))}
          </div>
        </section>

        <section className="index-section index-reveal" id="features" aria-label="Services">
          <div className="index-section-head">
            <h2>Everything you need to prepare with clarity</h2>
            <p>
              Nine focused capabilities that work together—so you spend time learning, not fighting the
              interface.
            </p>
          </div>
          <div className="index-service-grid">
            {SERVICES.map((item) => (
              <article key={item.title} className="index-service-card index-glass">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="index-section index-section--alt index-reveal" aria-label="Your pathway">
          <div className="index-section-head">
            <h2>A four-phase pathway</h2>
            <p>Complex licensing prep, simplified into steps you can repeat every week.</p>
          </div>
          <ol className="index-pathway">
            {PATHWAY.map((step, i) => (
              <li key={step.phase} className="index-pathway-item">
                <div className="index-pathway-marker">
                  <span className="index-pathway-icon">{step.icon}</span>
                  {i < PATHWAY.length - 1 && <span className="index-pathway-line" aria-hidden="true" />}
                </div>
                <div className="index-pathway-body index-glass">
                  <span className="index-pathway-badge">Phase {step.phase}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="index-testimonials index-reveal" aria-labelledby="index-testimonials-heading">
          <div className="index-testimonials-bg" aria-hidden="true" />
          <div className="index-testimonials-inner">
            <div className="index-testimonials-head">
              <div className="index-testimonials-pill">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                </svg>
                Testimonials
              </div>
              <h2 id="index-testimonials-heading" className="index-testimonials-title">
                What our clients say
              </h2>
              <p className="index-testimonials-sub">
                Real stories from healthcare professionals we&apos;ve helped get licensed across the GCC.
              </p>
            </div>

            <div className="index-testimonials-mobile">
              <div className="index-testimonials-mobile-rows">
                <MarqueeHorizontal
                  items={TESTIMONIALS}
                  durationSec={30}
                  renderItem={(t, key) => <TestimonialCardMobile key={key} t={t} />}
                />
                <MarqueeHorizontal
                  items={TESTIMONIALS}
                  durationSec={26}
                  reverse
                  renderItem={(t, key) => <TestimonialCardMobile key={key} t={t} />}
                />
              </div>
              <div className="index-testimonials-mobile-fade index-testimonials-mobile-fade--l" aria-hidden="true" />
              <div className="index-testimonials-mobile-fade index-testimonials-mobile-fade--r" aria-hidden="true" />
            </div>

            <div className="index-testimonials-desktop">
              <div className="index-testimonials-desktop-stage">
                <div className="index-testimonials-desktop-vfade index-testimonials-desktop-vfade--t" aria-hidden="true" />
                <div className="index-testimonials-desktop-vfade index-testimonials-desktop-vfade--b" aria-hidden="true" />
                <div className="index-testimonials-desktop-hfade index-testimonials-desktop-hfade--l" aria-hidden="true" />
                <div className="index-testimonials-desktop-hfade index-testimonials-desktop-hfade--r" aria-hidden="true" />
                <div className="index-testimonials-desktop-tilt">
                  <MarqueeVertical
                    items={TESTIMONIALS}
                    durationSec={35}
                    renderItem={(t, key) => <TestimonialCardDesktop key={key} t={t} />}
                  />
                  <MarqueeVertical
                    items={TESTIMONIALS}
                    durationSec={38}
                    reverse
                    renderItem={(t, key) => <TestimonialCardDesktop key={key} t={t} />}
                  />
                  <MarqueeVertical
                    className="index-marquee-v--wide-only"
                    items={TESTIMONIALS}
                    durationSec={32}
                    renderItem={(t, key) => <TestimonialCardDesktop key={key} t={t} />}
                  />
                  <MarqueeVertical
                    className="index-marquee-v--xl-only"
                    items={TESTIMONIALS}
                    durationSec={36}
                    reverse
                    renderItem={(t, key) => <TestimonialCardDesktop key={key} t={t} />}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="index-proven index-reveal" aria-labelledby="index-proven-heading">
          <div className="index-proven-bg" aria-hidden="true" />
          <div className="index-proven-orb index-proven-orb--1" aria-hidden="true" />
          <div className="index-proven-orb index-proven-orb--2" aria-hidden="true" />
          <div className="index-proven-orb index-proven-orb--3" aria-hidden="true" />
          <div className="index-proven-noise" aria-hidden="true" />
          <div className="index-proven-line index-proven-line--top" aria-hidden="true" />
          <div className="index-proven-line index-proven-line--bottom" aria-hidden="true" />

          <div className="index-proven-inner">
            <header className="index-proven-header">
              <div className="index-proven-pill">
                <span className="index-proven-pill-dot" aria-hidden="true" />
                Proven results
              </div>
              <h2 id="index-proven-heading" className="index-proven-headline">
                <span className="index-proven-line1">10k+ practice attempts.</span>
                <span className="index-proven-line2">One trusted platform.</span>
              </h2>
              <p className="index-proven-sub">
                From first login to exam day—healthcare professionals across the GCC use MockGulfMed to
                prepare with structure, track progress, and build confidence for licensing exams.
              </p>
            </header>

            <div className="index-proven-bento">
              <article className="index-proven-card index-proven-card--hero">
                <div className="index-proven-card-glow" aria-hidden="true" />
                <div className="index-proven-card-shine" aria-hidden="true" />
                <div className="index-proven-hero-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <p className="index-proven-hero-stat">10k+</p>
                  <p className="index-proven-hero-title">Practice attempts supported</p>
                  <p className="index-proven-hero-note">Across UAE, KSA, Qatar, Oman, Bahrain &amp; Kuwait</p>
                </div>
                <div className="index-proven-dots" aria-hidden="true">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <span key={i} className="index-proven-dot" />
                  ))}
                </div>
              </article>

              <div className="index-proven-grid-right">
                <article className="index-proven-card index-proven-card--sm index-proven-card--emerald">
                  <div className="index-proven-sm-shine" aria-hidden="true" />
                  <div className="index-proven-sm-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
                      <circle cx="12" cy="8" r="6" />
                    </svg>
                  </div>
                  <p className="index-proven-sm-stat">98%</p>
                  <p className="index-proven-sm-title">Reported readiness</p>
                  <p className="index-proven-sm-note">After structured mock cycles</p>
                </article>

                <article className="index-proven-card index-proven-card--sm index-proven-card--amber">
                  <div className="index-proven-sm-shine" aria-hidden="true" />
                  <div className="index-proven-sm-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                      <path d="M2 12h20" />
                    </svg>
                  </div>
                  <p className="index-proven-sm-stat">6</p>
                  <p className="index-proven-sm-title">GCC countries</p>
                  <p className="index-proven-sm-note">UAE · KSA · Qatar &amp; more</p>
                </article>

                <article className="index-proven-card index-proven-card--sm index-proven-card--violet">
                  <div className="index-proven-sm-shine" aria-hidden="true" />
                  <div className="index-proven-sm-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                    </svg>
                  </div>
                  <p className="index-proven-sm-stat">4.9★</p>
                  <p className="index-proven-sm-title">Satisfaction</p>
                  <p className="index-proven-sm-note">From applicant feedback</p>
                </article>

                <article className="index-proven-card index-proven-card--wide">
                  <div className="index-proven-wide-shine" aria-hidden="true" />
                  <div className="index-proven-bars" aria-hidden="true">
                    {[100, 85, 70, 92, 78].map((w) => (
                      <div key={w} className="index-proven-bar">
                        <span style={{ width: `${w}%` }} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="index-proven-wide-stat">8+ boards</p>
                    <p className="index-proven-wide-title">Gulf licensing coverage</p>
                    <p className="index-proven-wide-note">SCFHS, DHA, MOHAP, OMSB &amp; more</p>
                  </div>
                  <div className="index-proven-flags" aria-hidden="true">
                    <span>🇦🇪</span>
                    <span>🇸🇦</span>
                    <span>🇶🇦</span>
                    <span>🇴🇲</span>
                    <span>🇧🇭</span>
                    <span>🇰🇼</span>
                  </div>
                </article>
              </div>
            </div>

            <div className="index-proven-pills">
              <span className="index-proven-pilltag index-proven-pilltag--sky">
                <ShieldCheckIcon className="index-proven-pill-ic" />
                DHA exam-style
              </span>
              <span className="index-proven-pilltag index-proven-pilltag--emerald">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="index-proven-pill-ic" aria-hidden="true">
                  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                MOH-aligned
              </span>
              <span className="index-proven-pilltag index-proven-pilltag--amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="index-proven-pill-ic" aria-hidden="true">
                  <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
                  <circle cx="12" cy="8" r="6" />
                </svg>
                SCFHS-focused
              </span>
              <span className="index-proven-pilltag index-proven-pilltag--violet">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="index-proven-pill-ic" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                Secure access
              </span>
            </div>
          </div>
        </section>

        <section className="index-section index-section--alt index-reveal" aria-label="Portal features">
          <div className="index-section-head">
            <h2>Built for applicants</h2>
            <p>Fast navigation, exam-ready experience, and results you can understand.</p>
          </div>
          <div className="index-mini-grid">
            <article className="index-mini-card index-glass">
              <h3>Personal dashboard</h3>
              <p>See your available exams, recent attempts, and performance at a glance.</p>
            </article>
            <article className="index-mini-card index-glass">
              <h3>Exam experience</h3>
              <p>Clean question layout with time tracking, easy navigation, and a smooth submission flow.</p>
            </article>
            <article className="index-mini-card index-glass">
              <h3>Results &amp; review</h3>
              <p>Open results by attempt, revisit summaries, and learn from each session.</p>
            </article>
          </div>
        </section>

        <section className="index-section index-reveal" aria-label="Frequently asked questions">
          <div className="index-section-head">
            <h2>FAQ</h2>
            <p>Common questions from applicants using the portal.</p>
          </div>
          <div className="index-faq">
            <details className="index-faq-item index-glass">
              <summary>Where do I find my exams?</summary>
              <p>After signing in, open the Exams page from your dashboard navigation.</p>
            </details>
            <details className="index-faq-item index-glass">
              <summary>Can I review previous attempts?</summary>
              <p>Yes. Use the Results page to open attempts and view your exam outcomes.</p>
            </details>
            <details className="index-faq-item index-glass">
              <summary>I can’t sign in. What should I do?</summary>
              <p>Contact your administrator to verify your account access and credentials.</p>
            </details>
          </div>
        </section>

        <section className="index-section index-bottom-cta index-reveal" aria-label="Get started">
          <div className="index-bottom-cta-inner index-glass">
            <div>
              <h2>Ready to remove friction from prep?</h2>
              <p>Sign in to access your dashboard and available exams.</p>
            </div>
            <Link className="index-btn index-btn--primary" to="/login">
              Go to login
            </Link>
          </div>
        </section>
      </main>

      <div className="index-professions-wrap index-reveal" aria-label="Professions we support">
        <p className="index-professions-title">Professions we support</p>
        <div className="index-professions-viewport">
          <div className="index-professions-track">
            {[...PROFESSION_CHIPS, ...PROFESSION_CHIPS, ...PROFESSION_CHIPS].map((p, i) => (
              <div
                key={`${p.label}-${i}`}
                className="index-profession-chip"
                style={{
                  borderColor: p.border,
                  background: p.bg,
                }}
              >
                <div
                  className="index-profession-icon"
                  style={{ background: p.iconBg }}
                >
                  <ProfessionIcon type={p.icon} color={p.color} />
                </div>
                <span className="index-profession-label" style={{ color: p.color }}>
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="index-footer">
        <div className="index-footer-inner">
          <span>MockGulfMed</span>
          <span className="index-footer-sep" aria-hidden="true">
            •
          </span>
          <span>Exam Portal</span>
          <span className="index-footer-sep" aria-hidden="true">
            •
          </span>
          <Link to="/policies">Policies</Link>
          <span className="index-footer-sep" aria-hidden="true">
            •
          </span>
          <Link to="/policies/terms">Terms</Link>
          <span className="index-footer-sep" aria-hidden="true">
            •
          </span>
          <Link to="/policies/refund">Refund policy</Link>
        </div>
      </footer>
    </div>
  );
};

export default Index;
