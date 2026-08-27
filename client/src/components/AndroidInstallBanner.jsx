import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AndroidInstallBanner.css';

export default function AndroidInstallBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsStandalone(true);
      return;
    }

    try {
      const isDismissed = sessionStorage.getItem('mockgulfmed-app-banner-dismissed');
      if (isDismissed) setDismissed(true);
    } catch {
      // ignore storage error
    }

    const handlePrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  if (dismissed || isStandalone) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('mockgulfmed-app-banner-dismissed', 'true');
    } catch {
      // ignore
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDismissed(true);
      }
      setDeferredPrompt(null);
    } else {
      // Trigger APK download directly
      const link = document.createElement('a');
      link.href = '/api/download-apk';
      link.download = 'MockGulfMed.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="android-install-banner" role="region" aria-label="Mobile App Available">
      <div className="banner-inner">
        <div className="banner-left">
          <img src="/logo.png" alt="MockGulfMed Icon" className="banner-app-icon" />
          <div className="banner-meta">
            <span className="banner-app-title">MockGulfMed Android App</span>
            <span className="banner-app-sub">Exam Simulation • 100% Free APK</span>
          </div>
        </div>

        <div className="banner-actions">
          <button
            type="button"
            className="banner-btn-install"
            onClick={handleInstallClick}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{deferredPrompt ? 'Install' : 'Get APK'}</span>
          </button>
          
          <Link to="/download-app" className="banner-btn-link" onClick={() => setDismissed(true)}>
            Details
          </Link>

          <button
            type="button"
            className="banner-btn-close"
            onClick={handleDismiss}
            aria-label="Dismiss app banner"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
