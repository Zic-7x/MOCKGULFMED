import { Link } from 'react-router-dom';
import logoUrl from '../image/Gemini_Generated_Image_wtgqj3wtgqj3wtgq-removebg-preview.png';
import './Index.css';

const Index = () => {
  return (
    <div className="index-page">
      <header className="index-hero">
        <div className="index-hero-inner">
          <div className="index-hero-brand">
            <img className="index-logo" src={logoUrl} alt="MockGulfMed" />
            <span className="sr-only">MockGulfMed</span>
          </div>

          <div className="index-hero-content">
            <h1 className="index-title">Medical Licensing Exam Preparation for Gulf Healthcare Professionals</h1>
            <p className="index-subtitle">
              Prepare with realistic practice exams, track your progress, and review results for SCFHS, QCHP, HAAD, MOHAP, OMSB, DHA, NHRA, and MOH licensing pathways.
            </p>

            <div className="index-cta">
              <Link className="index-cta-primary" to="/login">
                Sign in
              </Link>
              <Link className="index-cta-secondary" to="/packages">
                View packages
              </Link>
              <a className="index-cta-secondary" href="#features">
                Explore features
              </a>
            </div>

            <div className="index-trust">
              <span className="index-pill">Prometric and Pearson style practice</span>
              <span className="index-pill">Gulf licensing focused</span>
              <span className="index-pill">Timed full-length simulations</span>
              <span className="index-pill">Smart progress tracking</span>
            </div>

            <div className="index-metrics" aria-label="Portal impact">
              <div className="index-metric">
                <strong>10k+</strong>
                <span>Practice attempts supported</span>
              </div>
              <div className="index-metric">
                <strong>8 Boards</strong>
                <span>SCFHS, QCHP, HAAD, MOHAP, OMSB, DHA, NHRA, MOH</span>
              </div>
              <div className="index-metric">
                <strong>Prometric + Pearson</strong>
                <span>Master both exam ecosystems with one platform</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="index-main">
        <section className="index-section" id="features" aria-label="Portal features">
          <div className="index-section-head">
            <h2>Built for applicants</h2>
            <p>Fast navigation, exam-ready experience, and results you can understand.</p>
          </div>

          <div className="index-grid">
            <article className="index-card">
              <h3>Personal dashboard</h3>
              <p>See your available exams, recent attempts, and performance at a glance.</p>
            </article>
            <article className="index-card">
              <h3>Exam experience</h3>
              <p>Clean question layout with time tracking, easy navigation, and a smooth submission flow.</p>
            </article>
            <article className="index-card">
              <h3>Results & review</h3>
              <p>Open results by attempt, revisit summaries, and learn from each session.</p>
            </article>
            <article className="index-card">
              <h3>Focused workflow</h3>
              <p>From sign-in to taking exams to reviewing results — everything is structured and predictable.</p>
            </article>
          </div>
        </section>

        <section className="index-section index-services" aria-label="Our services">
          <div className="index-section-head">
            <h2>Our services</h2>
            <p>
              MockGulfMed provides end-to-end preparation for major Gulf medical licensing exams. Whether your target exam is delivered through Prometric or Pearson VUE, our system helps you practice with confidence, improve weak areas, and approach test day fully prepared.
            </p>
          </div>

          <div className="index-services-grid">
            <article className="index-service-card">
              <h3>Comprehensive question banks</h3>
              <p>
                Access practice sets aligned with common competency domains tested across Gulf licensing pathways.
              </p>
              <ul>
                <li>Coverage across SCFHS, QCHP, HAAD, MOHAP, OMSB, DHA, NHRA, and MOH-oriented topics</li>
                <li>Topic-based drills and mixed mock sessions</li>
                <li>Built for repeated, high-volume mastery practice</li>
              </ul>
            </article>
            <article className="index-service-card">
              <h3>Timed simulation exams</h3>
              <p>
                Build exam confidence with realistic timed simulations that match the pace and structure of real licensing tests.
              </p>
              <ul>
                <li>Prometric-style and Pearson-style mock experience</li>
                <li>Timer-driven attempts with smooth navigation</li>
                <li>Consistent submission and scoring flow before exam day</li>
              </ul>
            </article>
            <article className="index-service-card">
              <h3>Performance reporting</h3>
              <p>
                Understand strengths and weak areas after every attempt with clear, actionable reporting.
              </p>
              <ul>
                <li>Attempt history with measurable progress over time</li>
                <li>Weak-topic identification for focused revision</li>
                <li>Clear direction for your next study cycle</li>
              </ul>
            </article>
            <article className="index-service-card">
              <h3>Mastery-driven preparation workflow</h3>
              <p>
                Follow a practical cycle to master your exam: learn, practice, analyze, improve, and retake until you are exam-ready.
              </p>
              <ul>
                <li>Designed for both first-attempt candidates and repeat test takers</li>
                <li>Minimal-distraction interface for long sessions</li>
                <li>Reliable day-to-day preparation workflow</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="index-section" aria-label="Why applicants like it">
          <div className="index-section-head">
            <h2>Designed for clarity under time pressure</h2>
            <p>Small UX details that matter when you’re concentrating.</p>
          </div>

          <div className="index-highlights">
            <div className="index-highlight">
              <h3>Readable, distraction-free screens</h3>
              <p>Calm spacing, consistent typography, and high contrast for long sessions.</p>
            </div>
            <div className="index-highlight">
              <h3>Quick access to what you need</h3>
              <p>Jump to your exams and results without hunting through menus.</p>
            </div>
            <div className="index-highlight">
              <h3>Track improvement over time</h3>
              <p>Use your attempt history to identify weak topics and measure progress.</p>
            </div>
          </div>
        </section>

        <section className="index-section index-section-muted" aria-label="How it works">
          <div className="index-section-head">
            <h2>How it works</h2>
            <p>A simple flow that matches how applicants actually prepare.</p>
          </div>

          <ol className="index-steps">
            <li className="index-step">
              <span className="index-step-number">1</span>
              <div className="index-step-body">
                <h3>Sign in</h3>
                <p>Use your provided account to access the portal securely.</p>
              </div>
            </li>
            <li className="index-step">
              <span className="index-step-number">2</span>
              <div className="index-step-body">
                <h3>Choose an exam</h3>
                <p>Open your Exams list and start when you’re ready.</p>
              </div>
            </li>
            <li className="index-step">
              <span className="index-step-number">3</span>
              <div className="index-step-body">
                <h3>Submit & review</h3>
                <p>Submit your attempt, then use Results to review and improve.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="index-section" aria-label="Frequently asked questions">
          <div className="index-section-head">
            <h2>FAQ</h2>
            <p>Common questions from applicants using the portal.</p>
          </div>

          <div className="index-faq">
            <details className="index-faq-item">
              <summary>Where do I find my exams?</summary>
              <p>After signing in, open the Exams page from your dashboard navigation.</p>
            </details>
            <details className="index-faq-item">
              <summary>Can I review previous attempts?</summary>
              <p>Yes. Use the Results page to open attempts and view your exam outcomes.</p>
            </details>
            <details className="index-faq-item">
              <summary>I can’t sign in. What should I do?</summary>
              <p>Contact your administrator to verify your account access and credentials.</p>
            </details>
          </div>
        </section>

        <section className="index-section index-bottom-cta" aria-label="Get started">
          <div className="index-bottom-cta-inner">
            <div>
              <h2>Ready to get started?</h2>
              <p>Sign in to access your dashboard and available exams.</p>
            </div>
            <Link className="index-cta-primary" to="/login">
              Go to login
            </Link>
          </div>
        </section>
      </main>

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

