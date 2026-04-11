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
            <h1 className="index-title">Exam Portal for Medical Professionals</h1>
            <p className="index-subtitle">
              Prepare with realistic practice exams, track your progress, and review results — all from a clean and focused portal.
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
              <span className="index-pill">Secure sign-in</span>
              <span className="index-pill">Timed exams</span>
              <span className="index-pill">Clear review</span>
              <span className="index-pill">Progress tracking</span>
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
        </div>
      </footer>
    </div>
  );
};

export default Index;

