import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

// Handle dynamic import chunk loading failures after a new Vercel deployment
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[Vite] New deployment detected or chunk failed to load. Reloading to get latest app...', event);
  window.location.reload();
});

// Register service worker for Progressive Web App and Android install with auto-update
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered with scope:', reg.scope);

        // Actively check for Service Worker updates immediately on load
        reg.update().catch(() => {});

        // Listen for new updates
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New update ready, prompting worker to activate...');
                installingWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration ignored:', err);
      });

    // When the new worker takes control, refresh the page if not taking an exam
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        if (!window.location.pathname.includes('/exams/')) {
          window.location.reload();
        }
      }
    });

    // Check for updates periodically every 15 minutes
    setInterval(() => {
      navigator.serviceWorker.ready.then((reg) => reg.update()).catch(() => {});
    }, 15 * 60 * 1000);
  });

  // Check for updates whenever the user switches back to this tab
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker.ready.then((reg) => reg.update()).catch(() => {});
    }
  });
}


