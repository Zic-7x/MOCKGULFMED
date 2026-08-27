import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import IndexMarketingLayout from '../components/IndexMarketingLayout';
import './DownloadApp.css';

export default function DownloadApp() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState('apk'); // 'apk' | 'pwa'
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handlePwaInstall = async () => {
    if (!deferredPrompt) {
      alert('To install directly, open this website in Google Chrome or Samsung Internet on Android, then tap Menu (⋮) > "Add to Home screen" or "Install App".');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDownloadApk = () => {
    setDownloadStarted(true);
    const link = document.createElement('a');
    link.href = '/api/download-apk';
    link.download = 'MockGulfMed.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <IndexMarketingLayout documentTitle="Download Android App · MockGulfMed">
      <div className="download-app-page">
        {/* Hero Section */}
        <section className="app-hero-section">
          <div className="app-hero-container">
            <div className="app-hero-badge">
              <span className="badge-pulse" />
              <span>Official Android Release • Direct Download</span>
            </div>

            <h1 className="app-hero-title">
              Practice Medical Exams Anywhere with the{' '}
              <span className="title-highlight">MockGulfMed Android App</span>
            </h1>

            <p className="app-hero-subtitle">
              Get the full-featured medical licensing mock exam portal right on your Android phone. 
              Practice Prometric, DHA, MOH, HAAD, OMSB, and SMLE MCQs with high-speed offline capabilities, instant results, and full-screen immersion.
            </p>

            <div className="app-download-actions">
              <button
                type="button"
                id="direct-apk-download-btn"
                className="btn-download-primary"
                onClick={handleDownloadApk}
              >
                <span className="btn-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </span>
                <div className="btn-text-wrap">
                  <span className="btn-label-sub">Direct Download</span>
                  <span className="btn-label-main">Download Android APK</span>
                </div>
                <span className="btn-size-tag">~1 MB</span>
              </button>

              <button
                type="button"
                id="instant-pwa-install-btn"
                className="btn-download-secondary"
                onClick={handlePwaInstall}
              >
                <span className="btn-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </span>
                <div className="btn-text-wrap">
                  <span className="btn-label-sub">{isInstalled ? 'Installed' : 'No APK File Needed'}</span>
                  <span className="btn-label-main">
                    {isInstalled ? '✓ App Installed' : '1-Click Instant Install'}
                  </span>
                </div>
              </button>
            </div>

            {downloadStarted && (
              <div className="download-started-alert" role="alert">
                <span className="alert-icon">✓</span>
                <div>
                  <strong>APK download started!</strong> Open the downloaded <code>MockGulfMed.apk</code> file on your Android device to install. See steps below.
                </div>
              </div>
            )}

            <div className="app-specs-strip">
              <div className="spec-item">
                <span className="spec-label">Version</span>
                <span className="spec-val">1.0.0 (Latest)</span>
              </div>
              <div className="spec-divider" />
              <div className="spec-item">
                <span className="spec-label">File Size</span>
                <span className="spec-val">&lt; 1 MB</span>
              </div>
              <div className="spec-divider" />
              <div className="spec-item">
                <span className="spec-label">Android OS</span>
                <span className="spec-val">8.0 &amp; Above</span>
              </div>
              <div className="spec-divider" />
              <div className="spec-item">
                <span className="spec-label">Cost</span>
                <span className="spec-val" style={{ color: '#16a34a', fontWeight: 700 }}>Free Download</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="app-features-section">
          <div className="section-header">
            <h2 className="section-title">Designed Specifically for Healthcare Candidates</h2>
            <p className="section-desc">Experience frictionless study sessions, fast test simulation, and direct Gulf career access.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-box" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                  <path d="m9 14 2 2 4-4" />
                </svg>
              </div>
              <h3 className="feature-card-title">Full Screen Exam Simulator</h3>
              <p className="feature-card-text">
                Simulate real Prometric &amp; Pearson VUE timed exam interfaces without annoying browser URL bars or accidental tab closures.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 className="feature-card-title">Instant Offline Caching</h3>
              <p className="feature-card-text">
                Quickly review answered MCQs, explanations, rationales, and results even in poor connectivity or hospital wards.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ background: '#fef3c7', color: '#d97706' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3 className="feature-card-title">Eligibility &amp; Dataflow Tools</h3>
              <p className="feature-card-text">
                Check DHA, MOH, HAAD, OMSB, and SMLE qualification eligibility and manage document verification on your phone.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h3 className="feature-card-title">Healthcare Jobs &amp; Video Reels</h3>
              <p className="feature-card-text">
                Browse medical jobs across Dubai, Abu Dhabi, Saudi Arabia, Qatar, Oman and record your Applicant Video Intro Reel directly using your phone camera.
              </p>
            </div>
          </div>
        </section>

        {/* Step-by-Step Installation Guide */}
        <section className="app-install-guide-section">
          <div className="section-header">
            <h2 className="section-title">How to Install on Android</h2>
            <p className="section-desc">Follow these quick, easy steps to download and install MockGulfMed on your device.</p>
          </div>

          <div className="install-tabs">
            <button
              type="button"
              className={`install-tab-btn ${activeTab === 'apk' ? 'active' : ''}`}
              onClick={() => setActiveTab('apk')}
            >
              📥 Direct APK Installation (Recommended)
            </button>
            <button
              type="button"
              className={`install-tab-btn ${activeTab === 'pwa' ? 'active' : ''}`}
              onClick={() => setActiveTab('pwa')}
            >
              ⚡ 1-Click Chrome Install
            </button>
          </div>

          {activeTab === 'apk' ? (
            <div className="guide-steps-grid">
              <div className="guide-step-card">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4 className="step-title">Tap "Download Android APK"</h4>
                  <p className="step-desc">
                    Tap the blue download button above. The file <code>MockGulfMed.apk</code> will begin downloading to your phone.
                  </p>
                </div>
              </div>

              <div className="guide-step-card">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4 className="step-title">Allow Unknown Sources (If prompted)</h4>
                  <p className="step-desc">
                    If Android shows <em>"For your security, your phone is not allowed to install unknown apps"</em>, tap <strong>Settings</strong> and toggle on <strong>"Allow from this source"</strong> for your browser.
                  </p>
                </div>
              </div>

              <div className="guide-step-card">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4 className="step-title">Tap "Install" &amp; Open</h4>
                  <p className="step-desc">
                    Tap <strong>Install</strong> on the prompt. Once finished, tap <strong>Open</strong> or find the MockGulfMed icon on your home screen or app drawer!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="guide-steps-grid">
              <div className="guide-step-card">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4 className="step-title">Open in Chrome or Samsung Internet</h4>
                  <p className="step-desc">
                    Visit this website on your Android phone using Google Chrome, Samsung Internet, or Brave.
                  </p>
                </div>
              </div>

              <div className="guide-step-card">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4 className="step-title">Tap Menu (⋮) or "Install App"</h4>
                  <p className="step-desc">
                    Tap the 3 vertical dots menu in top right of Chrome, and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </p>
                </div>
              </div>

              <div className="guide-step-card">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4 className="step-title">Launch Standalone App</h4>
                  <p className="step-desc">
                    The app will install directly as a native standalone app on your Android launcher without taking storage space.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="apk-safety-callout">
            <div className="safety-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div className="safety-content">
              <strong>100% Safe &amp; Verified Direct Package</strong>
              <p>
                Our APK is lightweight, contains zero ads, and is directly built and distributed by MockGulfMed. You do not need to pay Play Store fees or have a Google Play account to study.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="app-bottom-cta">
          <div className="bottom-cta-box">
            <h2>Ready to start practicing on Android?</h2>
            <p>Download the application now and access hundreds of verified Prometric &amp; Pearson MCQs.</p>
            <button
              type="button"
              className="btn-download-primary"
              onClick={handleDownloadApk}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download MockGulfMed.apk</span>
            </button>
          </div>
        </section>
      </div>
    </IndexMarketingLayout>
  );
}
